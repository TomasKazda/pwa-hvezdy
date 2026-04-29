import type { FastifyInstance } from "fastify";
import oauth2 from "@fastify/oauth2";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export default async function authRoutes(fastify: FastifyInstance) {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  await fastify.register(oauth2, {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || "",
        secret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    startRedirectPath: "/api/auth/google",
    callbackUri: `${baseUrl}/api/auth/callback`,
    discovery: {
      issuer: "https://accounts.google.com",
    },
  });

  fastify.get("/api/auth/callback", async (request, reply) => {
    const { token } = await (fastify as unknown as { googleOAuth2: { getAccessTokenFromAuthorizationCodeFlow: (req: unknown) => Promise<{ token: { access_token: string } }> } }).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    // Fetch user info from Google
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const profile = await response.json() as { id: string; email: string; name: string; picture: string };

    // Upsert user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, profile.id))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          googleId: profile.id,
          email: profile.email,
          displayName: profile.name,
          photoUrl: profile.picture,
        })
        .returning();
    }

    request.session.userId = user.id;
    reply.redirect("/");
  });

  fastify.get("/api/auth/me", async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Not authenticated" });
    }
    return {
      id: request.user.id,
      email: request.user.email,
      displayName: request.user.displayName,
      photoUrl: request.user.photoUrl,
      role: request.user.role,
      familyId: request.user.familyId,
      isAdmin: request.isAdmin,
    };
  });

  fastify.post("/api/auth/logout", async (request, reply) => {
    request.session.destroy();
    return { ok: true };
  });
}
