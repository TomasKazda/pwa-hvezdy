import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { users, families, childInvitations } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export default async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require admin access
  fastify.addHook("preHandler", requireAdmin);

  // --- Users ---
  fastify.get("/api/admin/users", async () => {
    const allUsers = await db.select().from(users);
    return { users: allUsers };
  });

  fastify.delete("/api/admin/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(users).where(eq(users.id, parseInt(id))).returning();
    if (!deleted.length) return reply.code(404).send({ error: "User not found" });
    return { ok: true };
  });

  // --- Families ---
  fastify.get("/api/admin/families", async () => {
    const allFamilies = await db.select().from(families);
    return { families: allFamilies };
  });

  fastify.post("/api/admin/families", {
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
    },
    handler: async (request) => {
      const { name } = request.body as { name: string };
      const code = randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
      const [family] = await db.insert(families).values({ name, code }).returning();
      return { family };
    },
  });

  fastify.patch("/api/admin/families/:id", {
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          code: { type: "string", minLength: 8, maxLength: 8 },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { name?: string; code?: string };

      const [updated] = await db
        .update(families)
        .set(body)
        .where(eq(families.id, parseInt(id)))
        .returning();

      if (!updated) return reply.code(404).send({ error: "Family not found" });
      return { family: updated };
    },
  });

  fastify.delete("/api/admin/families/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const familyId = parseInt(id);

    // Disconnect all members
    await db.update(users).set({ familyId: null, role: null }).where(eq(users.familyId, familyId));
    // Delete family
    const deleted = await db.delete(families).where(eq(families.id, familyId)).returning();
    if (!deleted.length) return reply.code(404).send({ error: "Family not found" });
    return { ok: true };
  });

  // --- Child Invitations ---
  fastify.get("/api/admin/child-invitations", async () => {
    const all = await db.select().from(childInvitations);
    return { invitations: all };
  });

  fastify.delete("/api/admin/child-invitations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(childInvitations).where(eq(childInvitations.id, parseInt(id))).returning();
    if (!deleted.length) return reply.code(404).send({ error: "Invitation not found" });
    return { ok: true };
  });
}
