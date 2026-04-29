import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { runMigrations } from "./db/migrate.js";
import sessionPlugin from "./plugins/session.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import familyRoutes from "./routes/families.js";
import childrenRoutes from "./routes/children.js";
import transactionRoutes from "./routes/transactions.js";
import wishRoutes from "./routes/wishes.js";
import activityTypeRoutes from "./routes/activity-types.js";
import adminRoutes from "./routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

// Run database migrations
await runMigrations();

// Plugins
await fastify.register(sessionPlugin);
await fastify.register(authPlugin);

// API Routes
await fastify.register(authRoutes);
await fastify.register(familyRoutes);
await fastify.register(childrenRoutes);
await fastify.register(transactionRoutes);
await fastify.register(wishRoutes);
await fastify.register(activityTypeRoutes);
await fastify.register(adminRoutes);

// Serve static client files in production
const clientDist = join(__dirname, "../../client/dist");
await fastify.register(fastifyStatic, {
  root: clientDist,
  prefix: "/",
  wildcard: false,
});

// SPA fallback — serve index.html for non-API routes
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith("/api/")) {
    reply.code(404).send({ error: "Not found" });
  } else {
    reply.sendFile("index.html");
  }
});

// Start server
const port = parseInt(process.env.PORT || "3000");
const host = process.env.HOST || "0.0.0.0";

try {
  await fastify.listen({ port, host });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
