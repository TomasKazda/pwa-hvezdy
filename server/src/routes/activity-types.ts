import type { FastifyInstance } from "fastify";
import { requireParent } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { activityTypes } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

export default async function activityTypeRoutes(fastify: FastifyInstance) {
  fastify.get("/api/activity-types", {
    preHandler: [requireParent],
    handler: async (request) => {
      const user = request.user!;
      const types = await db
        .select()
        .from(activityTypes)
        .where(eq(activityTypes.familyId, user.familyId!));

      return { activityTypes: types };
    },
  });

  fastify.post("/api/activity-types", {
    preHandler: [requireParent],
    schema: {
      body: {
        type: "object",
        required: ["name", "defaultStars"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          defaultStars: { type: "number", minimum: 1 },
        },
      },
    },
    handler: async (request) => {
      const user = request.user!;
      const { name, defaultStars } = request.body as { name: string; defaultStars: number };

      const [type] = await db
        .insert(activityTypes)
        .values({ familyId: user.familyId!, name, defaultStars })
        .returning();

      return { activityType: type };
    },
  });

  fastify.patch("/api/activity-types/:id", {
    preHandler: [requireParent],
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          defaultStars: { type: "number", minimum: 1 },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };
      const body = request.body as { name?: string; defaultStars?: number };

      const [updated] = await db
        .update(activityTypes)
        .set(body)
        .where(and(eq(activityTypes.id, parseInt(id)), eq(activityTypes.familyId, user.familyId!)))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Activity type not found" });
      }

      return { activityType: updated };
    },
  });

  fastify.delete("/api/activity-types/:id", {
    preHandler: [requireParent],
    handler: async (request, reply) => {
      const user = request.user!;
      const { id } = request.params as { id: string };

      const deleted = await db
        .delete(activityTypes)
        .where(and(eq(activityTypes.id, parseInt(id)), eq(activityTypes.familyId, user.familyId!)))
        .returning();

      if (!deleted.length) {
        return reply.code(404).send({ error: "Activity type not found" });
      }

      return { ok: true };
    },
  });
}
