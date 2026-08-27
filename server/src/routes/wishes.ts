import type { FastifyInstance } from "fastify";
import { requireAuth, requireParent } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { wishes, transactions, users } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";

type WishRow = typeof wishes.$inferSelect;

// Never expose the webhook secret; hide the webhook target from children.
function serializeWish(wish: WishRow, role: string | null) {
  const { webhookSecret, ...rest } = wish;
  const base = { ...rest, hasWebhookSecret: !!webhookSecret };
  if (role !== "parent") {
    return { ...base, webhookUrl: null };
  }
  return base;
}

function isValidWebhookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function wishRoutes(fastify: FastifyInstance) {
  fastify.get("/api/wishes", {
    preHandler: [requireAuth],
    handler: async (request) => {
      const user = request.user!;
      const familyId = user.familyId!;

      const allWishes = await db
        .select()
        .from(wishes)
        .where(eq(wishes.familyId, familyId))
        .orderBy(desc(wishes.createdAt));

      if (user.role === "child") {
        const [{ balance }] = await db.execute<{ balance: number }>(
          `SELECT COALESCE(SUM(amount), 0)::int AS balance FROM transactions WHERE child_id = ${user.id}`
        ).then((r) => r.rows);

        return {
          wishes: allWishes.map((w) => ({
            ...serializeWish(w, user.role),
            reachable: w.starCost !== null ? balance >= w.starCost : null,
          })),
          balance,
        };
      }

      return { wishes: allWishes.map((w) => serializeWish(w, user.role)) };
    },
  });

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
          isSelfFulfillment: { type: "boolean" },
          multiplier: { type: "number", minimum: 1 },
          webhookUrl: { type: "string", maxLength: 2048 },
          webhookSecret: { type: "string", maxLength: 255 },
          webhookParamName: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      if (!user.familyId) {
        return reply.code(400).send({ error: "Not in a family" });
      }

      const body = request.body as {
        title: string;
        starCost?: number;
        isPersistent?: boolean;
        isSelfFulfillment?: boolean;
        multiplier?: number;
        webhookUrl?: string;
        webhookSecret?: string;
        webhookParamName?: string;
      };

      const isParent = user.role === "parent";
      const isSelfFulfillment = isParent ? (body.isSelfFulfillment ?? false) : false;

      // Self-fulfillment wishes require a valid webhook target + parameter name.
      if (isSelfFulfillment) {
        if (!body.webhookUrl || !isValidWebhookUrl(body.webhookUrl)) {
          return reply.code(400).send({ error: "Valid webhookUrl (http/https) is required" });
        }
        if (!body.webhookParamName) {
          return reply.code(400).send({ error: "webhookParamName is required" });
        }
      }

      const [wish] = await db
        .insert(wishes)
        .values({
          familyId: user.familyId,
          title: body.title,
          starCost: isParent ? (body.starCost ?? null) : null,
          isPersistent: isParent ? (body.isPersistent ?? false) : false,
          isSelfFulfillment,
          multiplier: isParent ? (body.multiplier ?? 1) : 1,
          webhookUrl: isSelfFulfillment ? body.webhookUrl! : null,
          webhookSecret: isSelfFulfillment ? (body.webhookSecret ?? null) : null,
          webhookParamName: isSelfFulfillment ? body.webhookParamName! : null,
          createdBy: user.id,
        })
        .returning();

      return { wish: serializeWish(wish, user.role) };
    },
  });

  fastify.patch("/api/wishes/:id", {
    preHandler: [requireParent],
    schema: {
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          starCost: { type: "number", minimum: 1 },
          isPersistent: { type: "boolean" },
          isSelfFulfillment: { type: "boolean" },
          multiplier: { type: "number", minimum: 1 },
          webhookUrl: { type: "string", maxLength: 2048 },
          webhookSecret: { type: "string", maxLength: 255 },
          webhookParamName: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };
      const body = request.body as {
        title?: string;
        starCost?: number;
        isPersistent?: boolean;
        isSelfFulfillment?: boolean;
        multiplier?: number;
        webhookUrl?: string;
        webhookSecret?: string;
        webhookParamName?: string;
      };

      const [wish] = await db
        .select()
        .from(wishes)
        .where(and(eq(wishes.id, parseInt(id)), eq(wishes.familyId, user.familyId!)))
        .limit(1);

      if (!wish) {
        return reply.code(404).send({ error: "Wish not found" });
      }

      if (body.webhookUrl !== undefined && !isValidWebhookUrl(body.webhookUrl)) {
        return reply.code(400).send({ error: "Valid webhookUrl (http/https) is required" });
      }

      const updates: Partial<typeof wishes.$inferInsert> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.starCost !== undefined) updates.starCost = body.starCost;
      if (body.isPersistent !== undefined) updates.isPersistent = body.isPersistent;
      if (body.isSelfFulfillment !== undefined) updates.isSelfFulfillment = body.isSelfFulfillment;
      if (body.multiplier !== undefined) updates.multiplier = body.multiplier;
      if (body.webhookUrl !== undefined) updates.webhookUrl = body.webhookUrl;
      if (body.webhookParamName !== undefined) updates.webhookParamName = body.webhookParamName;
      // Only overwrite the secret when a non-empty value is supplied.
      if (body.webhookSecret) updates.webhookSecret = body.webhookSecret;

      const [updated] = await db
        .update(wishes)
        .set(updates)
        .where(eq(wishes.id, wish.id))
        .returning();

      return { wish: serializeWish(updated, user.role) };
    },
  });

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

      const [child] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, childId), eq(users.familyId, user.familyId!), eq(users.role, "child")))
        .limit(1);

      if (!child) {
        return reply.code(404).send({ error: "Child not found in your family" });
      }

      const [{ balance }] = await db.execute<{ balance: number }>(
        `SELECT COALESCE(SUM(amount), 0)::int AS balance FROM transactions WHERE child_id = ${childId}`
      ).then((r) => r.rows);

      if (balance < wish.starCost) {
        return reply.code(400).send({ error: "Insufficient star balance" });
      }

      await db.insert(transactions).values({
        familyId: user.familyId!,
        childId,
        amount: -wish.starCost,
        description: `Přání: ${wish.title}`,
        wishId: wish.id,
        authorId: user.id,
      });

      return { ok: true, balance: balance - wish.starCost };
    },
  });

  // Child self-fulfills a special wish: deduct stars + call external service.
  fastify.post("/api/wishes/:id/self-fulfill", {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: "object",
        properties: {
          starCost: { type: "number", minimum: 1 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      if (user.role !== "child") {
        return reply.code(403).send({ error: "Only a child can self-fulfill" });
      }

      const { id } = request.params as { id: string };
      const { starCost } = request.body as { starCost?: number };

      const [wish] = await db
        .select()
        .from(wishes)
        .where(and(eq(wishes.id, parseInt(id)), eq(wishes.familyId, user.familyId!)))
        .limit(1);

      if (!wish || !wish.isSelfFulfillment) {
        return reply.code(404).send({ error: "Self-fulfillment wish not found" });
      }

      const price = starCost ?? wish.starCost ?? null;
      if (price === null || price < 1) {
        return reply.code(400).send({ error: "Price (starCost) is required" });
      }

      const [{ balance }] = await db.execute<{ balance: number }>(
        `SELECT COALESCE(SUM(amount), 0)::int AS balance FROM transactions WHERE child_id = ${user.id}`
      ).then((r) => r.rows);

      if (balance < price) {
        return reply.code(400).send({ error: "Insufficient star balance" });
      }

      const parameter = price * (wish.multiplier ?? 1);

      // Call the external service first so a failed webhook never costs stars.
      if (wish.webhookUrl) {
        const paramName = wish.webhookParamName || "value";
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(wish.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              child: user.displayName,
              [paramName]: parameter,
              ...(wish.webhookSecret ? { secret: wish.webhookSecret } : {}),
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!res.ok) {
            request.log.error({ status: res.status }, "Self-fulfill webhook returned non-OK");
            return reply.code(502).send({ error: "External service call failed" });
          }
        } catch (err) {
          request.log.error({ err }, "Self-fulfill webhook call failed");
          return reply.code(502).send({ error: "External service call failed" });
        }
      }

      const paramLabel = wish.webhookParamName ? ` (${parameter} ${wish.webhookParamName})` : "";
      await db.insert(transactions).values({
        familyId: user.familyId!,
        childId: user.id,
        amount: -price,
        description: `Splněno: ${wish.title}${paramLabel}`,
        wishId: wish.id,
        authorId: user.id,
      });

      // Non-repeatable wish is removed after use.
      if (!wish.isPersistent) {
        await db.delete(wishes).where(eq(wishes.id, wish.id));
      }

      return { ok: true, balance: balance - price, parameter };
    },
  });

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
        .from(transactions)
        .where(and(eq(transactions.familyId, user.familyId!), eq(transactions.childId, targetChildId)))
        .orderBy(desc(transactions.createdAt));

      return { wishes: fulfilled.filter((tx) => tx.wishId !== null) };
    },
  });
}
