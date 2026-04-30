import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "./setup.js";
import type { FastifyInstance } from "fastify";

describe("Auth API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/auth/me returns 401 when not authenticated", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty("error");
  });

  it("POST /api/auth/logout succeeds even without session", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/auth/google redirects to Google OAuth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/google" });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain("accounts.google.com");
  });
});

describe("Auth API (logged in)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // User ID 1 = seed parent "Táta Novák"
    app = await buildApp(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/auth/me returns user info", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("id", 1);
    expect(body).toHaveProperty("displayName");
    expect(body).toHaveProperty("role", "parent");
    expect(body).toHaveProperty("isAdmin");
  });
});
