import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db/index.js";

declare module "fastify" {
  interface Session {
    userId?: number;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cookie);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PgStore = connectPgSimple(session as any);

  await fastify.register(session, {
    secret: process.env.SESSION_SECRET || "dev-secret-change-me-in-production",
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store: new PgStore({
      pool: pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }) as any,
    saveUninitialized: false,
  });
});
