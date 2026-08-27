import Fastify, { type FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import sessionPlugin from "../plugins/session.js";
import authPlugin from "../plugins/auth.js";
import authRoutes from "../routes/auth.js";
import familyRoutes from "../routes/families.js";
import childrenRoutes from "../routes/children.js";
import transactionRoutes from "../routes/transactions.js";
import wishRoutes from "../routes/wishes.js";
import activityTypeRoutes from "../routes/activity-types.js";
import adminRoutes from "../routes/admin.js";
import { db } from "../db/index.js";
import { runMigrations } from "../db/migrate.js";
import { families, users, wishes } from "../db/schema.js";

let bootstrapPromise: Promise<void> | null = null;

async function ensureBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await runMigrations();

      const [family] = await db.select().from(families).limit(1);

      if (!family) {
        const [createdFamily] = await db
          .insert(families)
          .values({
            name: "Novákovi",
            code: "DEMO1234",
            createdBy: null,
          })
          .returning();

        if (createdFamily) {
          const [parent] = await db
            .insert(users)
            .values({
              googleId: "seed-parent-001",
              email: "rodic@example.com",
              displayName: "Táta Novák",
              photoUrl: null,
              familyId: createdFamily.id,
              role: "parent",
            })
            .onConflictDoNothing()
            .returning();

          await db
            .insert(users)
            .values({
              googleId: "seed-child-001",
              email: "petr@example.com",
              displayName: "Petr Novák",
              photoUrl: null,
              familyId: createdFamily.id,
              role: "child",
            })
            .onConflictDoNothing();

          if (parent) {
            await db.update(families).set({ createdBy: parent.id }).where(eq(families.id, createdFamily.id));
          }
        }
      }

      const [parent] = await db.select().from(users).where(eq(users.email, "rodic@example.com")).limit(1);
      if (!parent) {
        await db
          .insert(users)
          .values({
            googleId: "seed-parent-001",
            email: "rodic@example.com",
            displayName: "Táta Novák",
            photoUrl: null,
            familyId: family.id,
            role: "parent",
          })
          .onConflictDoNothing();
      }

      const [child] = await db.select().from(users).where(eq(users.email, "petr@example.com")).limit(1);
      if (!child) {
        await db
          .insert(users)
          .values({
            googleId: "seed-child-001",
            email: "petr@example.com",
            displayName: "Petr Novák",
            photoUrl: null,
            familyId: family.id,
            role: "child",
          })
          .onConflictDoNothing();
      }

      const [seedParent] = await db
        .select()
        .from(users)
        .where(eq(users.email, "rodic@example.com"))
        .limit(1);
      const existingWishes = await db
        .select()
        .from(wishes)
        .where(eq(wishes.familyId, family.id))
        .limit(1);
      if (seedParent && existingWishes.length === 0) {
        await db.insert(wishes).values({
          familyId: family.id,
          title: "Zmrzlina",
          starCost: 5,
          isPersistent: true,
          createdBy: seedParent.id,
        });
      }
    })();
  }

  await bootstrapPromise;
}

/**
 * Build a Fastify app instance for testing.
 * @param mockUserId - If provided, injects this userId into the session for every request (simulates logged-in user)
 */
export async function buildApp(mockUserId?: number): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await ensureBootstrap();

  await app.register(sessionPlugin);
  await app.register(authPlugin);

  if (mockUserId !== undefined) {
    app.addHook("onRequest", async (request) => {
      request.session.userId = mockUserId;
    });
  }

  await app.register(authRoutes);
  await app.register(familyRoutes);
  await app.register(childrenRoutes);
  await app.register(transactionRoutes);
  await app.register(wishRoutes);
  await app.register(activityTypeRoutes);
  await app.register(adminRoutes);

  await app.ready();
  return app;
}
