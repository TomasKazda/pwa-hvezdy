import type { FastifyInstance } from "fastify";
import { requireAuth, requireParent } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { childInvitations, users } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateInviteCode(): string {
  return randomBytes(6).toString("hex").toUpperCase().slice(0, 12);
}

export default async function childrenRoutes(fastify: FastifyInstance) {
  // Generate child invitation code (parent only)
  fastify.post("/api/child-invitations", {
    preHandler: [requireParent],
    handler: async (request) => {
      const user = request.user!;
      const code = generateInviteCode();

      const [invitation] = await db
        .insert(childInvitations)
        .values({
          code,
          familyId: user.familyId!,
          createdBy: user.id,
        })
        .returning();

      return { invitation };
    },
  });

  // List child invitations (parent only)
  fastify.get("/api/child-invitations", {
    preHandler: [requireParent],
    handler: async (request) => {
      const user = request.user!;
      const invitations = await db
        .select()
        .from(childInvitations)
        .where(eq(childInvitations.familyId, user.familyId!));

      return { invitations };
    },
  });

  // Delete unused invitation (parent only)
  fastify.delete("/api/child-invitations/:id", {
    preHandler: [requireParent],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const [invitation] = await db
        .select()
        .from(childInvitations)
        .where(
          and(
            eq(childInvitations.id, parseInt(id)),
            eq(childInvitations.familyId, user.familyId!),
            isNull(childInvitations.usedBy)
          )
        )
        .limit(1);

      if (!invitation) {
        return reply.code(404).send({ error: "Invitation not found or already used" });
      }

      await db.delete(childInvitations).where(eq(childInvitations.id, invitation.id));
      return { ok: true };
    },
  });

  // Child registers using invitation code
  fastify.post("/api/children/register", {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", minLength: 12, maxLength: 12 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      if (user.familyId) {
        return reply.code(400).send({ error: "Already in a family" });
      }

      const { code } = request.body as { code: string };
      const [invitation] = await db
        .select()
        .from(childInvitations)
        .where(
          and(
            eq(childInvitations.code, code.toUpperCase()),
            isNull(childInvitations.usedBy)
          )
        )
        .limit(1);

      if (!invitation) {
        return reply.code(404).send({ error: "Invalid or already used invitation code" });
      }

      // Mark invitation as used
      await db
        .update(childInvitations)
        .set({ usedBy: user.id, usedAt: new Date() })
        .where(eq(childInvitations.id, invitation.id));

      // Assign user to family as child
      await db
        .update(users)
        .set({ familyId: invitation.familyId, role: "child" })
        .where(eq(users.id, user.id));

      return { familyId: invitation.familyId };
    },
  });

  // List children in family (parent)
  fastify.get("/api/children", {
    preHandler: [requireParent],
    handler: async (request) => {
      const user = request.user!;

      const children = await db.execute<{ id: number; displayName: string; photoUrl: string | null; balance: number }>(
        /*sql*/`
        SELECT u.id, u.display_name AS "displayName", u.photo_url AS "photoUrl",
               COALESCE(SUM(t.amount), 0)::int AS balance
        FROM users u
        LEFT JOIN transactions t ON t.child_id = u.id
        WHERE u.family_id = ${user.familyId} AND u.role = 'child'
        GROUP BY u.id
        `
      );

      return { children: children.rows };
    },
  });

  // Remove child from family (parent)
  fastify.delete("/api/children/:id", {
    preHandler: [requireParent],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const [child] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, parseInt(id)),
            eq(users.familyId, user.familyId!),
            eq(users.role, "child")
          )
        )
        .limit(1);

      if (!child) {
        return reply.code(404).send({ error: "Child not found" });
      }

      await db
        .update(users)
        .set({ familyId: null, role: null })
        .where(eq(users.id, child.id));

      return { ok: true };
    },
  });
}
