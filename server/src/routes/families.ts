import type { FastifyInstance } from "fastify";
import { requireAuth, requireParent } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { families, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateFamilyCode(): string {
  return randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

export default async function familyRoutes(fastify: FastifyInstance) {
  // Get current user's family (any role in the family)
  fastify.get("/api/families/mine", {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const user = request.user!;
      if (!user.familyId) {
        return reply.code(404).send({ error: "Not in a family" });
      }
      const [family] = await db
        .select()
        .from(families)
        .where(eq(families.id, user.familyId))
        .limit(1);
      if (!family) {
        return reply.code(404).send({ error: "Family not found" });
      }
      return { family };
    },
  });

  // Create a new family
  fastify.post("/api/families", {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      if (user.familyId) {
        return reply.code(400).send({ error: "Already in a family" });
      }

      const code = generateFamilyCode();
      const [family] = await db
        .insert(families)
        .values({ name: (request.body as { name: string }).name, code, createdBy: user.id })
        .returning();

      await db
        .update(users)
        .set({ familyId: family.id, role: "parent" })
        .where(eq(users.id, user.id));

      return { family };
    },
  });

  // Join an existing family (as parent)
  fastify.post("/api/families/join", {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", minLength: 8, maxLength: 8 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      if (user.familyId) {
        return reply.code(400).send({ error: "Already in a family" });
      }

      const { code } = request.body as { code: string };
      const [family] = await db
        .select()
        .from(families)
        .where(eq(families.code, code.toUpperCase()))
        .limit(1);

      if (!family) {
        return reply.code(404).send({ error: "Family not found" });
      }

      await db
        .update(users)
        .set({ familyId: family.id, role: "parent" })
        .where(eq(users.id, user.id));

      return { family };
    },
  });
}
