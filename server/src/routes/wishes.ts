import type { FastifyInstance } from "fastify";
import { requireAuth, requireParent } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { wishes, transactions, users } from "../db/schema.js";
import { eq, and, desc, isNotNull, sql } from "drizzle-orm";

export default async function wishRoutes(fastify: FastifyInstance) {
  // List wishes for family
  fastify.get("/api/wishes", {
    preHandler: [requireAuth],
    handler: async (request) => {
      const user = request.user!;
      const familyId = user.familyId!;

      const allWishes = await db
        .select()
        .from(wishes)
        .where(and(eq(wishes.familyId, familyId), sql`${wishes.fulfilledAt} IS NULL`))
        .orderBy(desc(wishes.createdAt));

      // If child, compute balance for reachability
      if (user.role === "child") {
        const [{ balance }] = await db.execute<{ balance: number }>(
          /*sql*/`SELECT COALESCE(SUM(amount), 0)::int AS balance FROM transactions WHERE child_id = ${user.id}`
        ).then((r) => r.rows);

        return {
          wishes: allWishes.map((w) => ({
            ...w,
            reachable: w.starCost !== null ? balance >= w.starCost : null,
          })),
          balance,
        };
      }

      return { wishes: allWishes };
    },
  });

  // Create a wish (parent or child)
  fastify.post("/api/wishes", {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          starCost: { type: "number", minimum: 1 },
          isPersistent: { type: "boolean" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      if (!user.familyId) {
        return reply.code(400).send({ error: "Not in a family" });
      }

      const { title, starCost, isPersistent } = request.body as {
        title: string;
        starCost?: number;
        isPersistent?: boolean;
      };

      // Child cannot set price or persistence
      const [wish] = await db
        .insert(wishes)
        .values({
          familyId: user.familyId,
          title,
          starCost: user.role === "parent" ? (starCost ?? null) : null,
          isPersistent: user.role === "parent" ? (isPersistent ?? false) : false,
          createdBy: user.id,
        })
        .returning();

      return { wish };
    },
  });

  // Update wish (parent only — set price, persistence, title)
  fastify.patch("/api/wishes/:id", {
    preHandler: [requireParent],
    schema: {
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          starCost: { type: "number", minimum: 1 },
          isPersistent: { type: "boolean" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };
      const body = request.body as { title?: string; starCost?: number; isPersistent?: boolean };

      const [wish] = await db
        .select()
        .from(wishes)
        .where(and(eq(wishes.id, parseInt(id)), eq(wishes.familyId, user.familyId!)))
        .limit(1);

      if (!wish) {
        return reply.code(404).send({ error: "Wish not found" });
      }

      const updates: Partial<typeof wishes.$inferInsert> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.starCost !== undefined) updates.starCost = body.starCost;
      if (body.isPersistent !== undefined) updates.isPersistent = body.isPersistent;

      const [updated] = await db
        .update(wishes)
        .set(updates)
        .where(eq(wishes.id, wish.id))
        .returning();

      return { wish: updated };
    },
  });

  // Delete wish (parent only)
  fastify.delete("/api/wishes/:id", {
    preHandler: [requireParent],
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };

      const deleted = await db
        .delete(wishes)
        .where(and(eq(wishes.id, parseInt(id)), eq(wishes.familyId, user.familyId!)))
        .returning();

      if (!deleted.length) {
        return reply.code(404).send({ error: "Wish not found" });
      }

      return { ok: true };
    },
  });

  // Fulfill wish (parent only — deducts stars from child)
  fastify.post("/api/wishes/:id/fulfill", {
    preHandler: [requireParent],
    schema: {
      body: {
        type: "object",
        required: ["childId"],
        properties: {
          childId: { type: "number" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };
      const { childId } = request.body as { childId: number };

      const [wish] = await db
        .select()
        .from(wishes)
        .where(and(eq(wishes.id, parseInt(id)), eq(wishes.familyId, user.familyId!)))
        .limit(1);

      if (!wish || wish.starCost === null) {
        return reply.code(400).send({ error: "Wish not found or not priced" });
      }

      // Check child balance
      const [{ balance }] = await db.execute<{ balance: number }>(
        /*sql*/`SELECT COALESCE(SUM(amount), 0)::int AS balance FROM transactions WHERE child_id = ${childId}`
      ).then((r) => r.rows);

      if (balance < wish.starCost) {
        return reply.code(400).send({ error: "Insufficient star balance" });
      }

      // Deduct stars
      await db.insert(transactions).values({
        familyId: user.familyId!,
        childId,
        amount: -wish.starCost,
        description: `Přání: ${wish.title}`,
        authorId: user.id,
      });

      if (wish.isPersistent) {
        // Mark as fulfilled but keep
        await db
          .update(wishes)
          .set({ fulfilledAt: new Date(), fulfilledForChildId: childId })
          .where(eq(wishes.id, wish.id));
      } else {
        // Remove wish
        await db.delete(wishes).where(eq(wishes.id, wish.id));
      }

      return { ok: true };
    },
  });

  // Fulfilled wishes history
  fastify.get("/api/wishes/fulfilled", {
    preHandler: [requireAuth],
    schema: {
      querystring: {
        type: "object",
        properties: {
          childId: { type: "string" },
        },
      },
    },
    handler: async (request) => {
      const user = request.user!;
      const { childId } = request.query as { childId?: string };

      const targetChildId = user.role === "child" ? user.id : parseInt(childId || "0");

      const fulfilled = await db
        .select()
        .from(wishes)
        .where(
          and(
            eq(wishes.familyId, user.familyId!),
            eq(wishes.fulfilledForChildId, targetChildId),
            isNotNull(wishes.fulfilledAt)
          )
        )
        .orderBy(desc(wishes.fulfilledAt));

      return { wishes: fulfilled };
    },
  });
}
