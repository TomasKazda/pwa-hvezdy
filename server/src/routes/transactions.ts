import type { FastifyInstance } from "fastify";
import { requireAuth, requireParent } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { transactions, users } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";

export default async function transactionRoutes(fastify: FastifyInstance) {
  // Get transactions (parent: any child in family, child: own only)
  fastify.get("/api/transactions", {
    preHandler: [requireAuth],
    schema: {
      querystring: {
        type: "object",
        properties: {
          childId: { type: "string" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      const { childId } = request.query as { childId?: string };

      if (user.role === "child") {
        // Child can only see own transactions
        const txs = await db
          .select()
          .from(transactions)
          .where(eq(transactions.childId, user.id))
          .orderBy(desc(transactions.createdAt));

        return { transactions: txs };
      }

      // Parent: must specify childId, child must be in same family
      if (!childId) {
        return reply.code(400).send({ error: "childId is required" });
      }

      const [child] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, parseInt(childId)),
            eq(users.familyId, user.familyId!)
          )
        )
        .limit(1);

      if (!child) {
        return reply.code(404).send({ error: "Child not found in your family" });
      }

      const txs = await db
        .select()
        .from(transactions)
        .where(eq(transactions.childId, child.id))
        .orderBy(desc(transactions.createdAt));

      return { transactions: txs };
    },
  });

  // Add/remove stars (parent only)
  fastify.post("/api/transactions", {
    preHandler: [requireParent],
    schema: {
      body: {
        type: "object",
        required: ["childId", "amount", "description"],
        properties: {
          childId: { type: "number" },
          amount: { type: "number" },
          description: { type: "string", minLength: 1, maxLength: 255 },
          wishId: { type: ["number", "null"] },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      const { childId, amount, description, wishId } = request.body as {
        childId: number;
        amount: number;
        description: string;
        wishId?: number | null;
      };

      const [child] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, childId),
            eq(users.familyId, user.familyId!),
            eq(users.role, "child")
          )
        )
        .limit(1);

      if (!child) {
        return reply.code(404).send({ error: "Child not found in your family" });
      }

      const [tx] = await db
        .insert(transactions)
        .values({
          familyId: user.familyId!,
          childId,
          amount,
          description,
          wishId: wishId ?? null,
          authorId: user.id,
        })
        .returning();

      return { transaction: tx };
    },
  });

  // Delete a transaction (parent only, e.g. to fix a mistaken entry)
  fastify.delete("/api/transactions/:id", {
    preHandler: [requireParent],
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };

      const [deleted] = await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.id, parseInt(id)),
            eq(transactions.familyId, user.familyId!)
          )
        )
        .returning();

      if (!deleted) {
        return reply.code(404).send({ error: "Transaction not found" });
      }

      return { ok: true };
    },
  });
}
