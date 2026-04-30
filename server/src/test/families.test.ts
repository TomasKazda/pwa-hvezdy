import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "./setup.js";
import type { FastifyInstance } from "fastify";

describe("Families API (not logged in)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/families returns 401 when not authenticated", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/families",
      payload: { name: "Test Family" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/families/join returns 401 when not authenticated", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/families/join",
      payload: { code: "ABCD1234" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("Families API (logged in as parent)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // User 1 = seed parent, already has a family
    app = await buildApp(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/families returns 400 if already in a family", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/families",
      payload: { name: "Another Family" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty("error");
  });

  it("POST /api/families/join returns 400 if already in a family", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/families/join",
      payload: { code: "DEMO1234" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/families validates body schema", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/families",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
