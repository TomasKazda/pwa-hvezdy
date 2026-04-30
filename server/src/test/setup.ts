import Fastify, { type FastifyInstance } from "fastify";
import sessionPlugin from "../plugins/session.js";
import authPlugin from "../plugins/auth.js";
import authRoutes from "../routes/auth.js";
import familyRoutes from "../routes/families.js";
import childrenRoutes from "../routes/children.js";
import transactionRoutes from "../routes/transactions.js";
import wishRoutes from "../routes/wishes.js";
import activityTypeRoutes from "../routes/activity-types.js";
import adminRoutes from "../routes/admin.js";

/**
 * Build a Fastify app instance for testing.
 * @param mockUserId - If provided, injects this userId into the session for every request (simulates logged-in user)
 */
export async function buildApp(mockUserId?: number): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(sessionPlugin);
  await app.register(authPlugin);

  // If mockUserId is set, simulate a logged-in session
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
