import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

declare module "fastify" {
  interface FastifyRequest {
    user?: typeof users.$inferSelect;
    isAdmin?: boolean;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorateRequest("user", undefined);
  fastify.decorateRequest("isAdmin", false);

  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    if (request.session.userId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.session.userId))
        .limit(1);

      if (user) {
        request.user = user;
        request.isAdmin = user.email === process.env.ADMIN_EMAIL;
      }
    }
  });
});

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}

export async function requireParent(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  if (request.user.role !== "parent") {
    return reply.code(403).send({ error: "Forbidden: parent role required" });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.isAdmin) {
    return reply.code(403).send({ error: "Forbidden: admin access required" });
  }
}
