import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "./setup.js";
import type { FastifyInstance } from "fastify";

describe("Children API (parent)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // User 1 = seed parent
    app = await buildApp(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/children returns list with balance", async () => {
    const res = await app.inject({ method: "GET", url: "/api/children" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.children).toBeInstanceOf(Array);
    expect(body.children.length).toBeGreaterThan(0);
    expect(body.children[0]).toHaveProperty("balance");
    expect(body.children[0]).toHaveProperty("display_name");
  });

  it("POST /api/child-invitations creates a new invitation", async () => {
    const res = await app.inject({ method: "POST", url: "/api/child-invitations" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.invitation).toHaveProperty("code");
    expect(body.invitation.code).toHaveLength(12);
  });

  it("GET /api/child-invitations returns invitations list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/child-invitations" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.invitations).toBeInstanceOf(Array);
  });
});

describe("Children API (child)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // User 2 = seed child "Petr Novák"
    app = await buildApp(2);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/children returns 403 for child role", async () => {
    const res = await app.inject({ method: "GET", url: "/api/children" });
    expect(res.statusCode).toBe(403);
  });

  it("POST /api/child-invitations returns 403 for child role", async () => {
    const res = await app.inject({ method: "POST", url: "/api/child-invitations" });
    expect(res.statusCode).toBe(403);
  });
});

describe("Transactions API", () => {
  let parentApp: FastifyInstance;
  let childApp: FastifyInstance;

  beforeAll(async () => {
    parentApp = await buildApp(1); // parent
    childApp = await buildApp(2); // child Petr
  });

  afterAll(async () => {
    await parentApp.close();
    await childApp.close();
  });

  it("POST /api/transactions (parent) adds stars to child", async () => {
    const res = await parentApp.inject({
      method: "POST",
      url: "/api/transactions",
      payload: {
        childId: 2,
        amount: 5,
        description: "Test: dobrá práce",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.transaction).toHaveProperty("id");
    expect(body.transaction.amount).toBe(5);
  });

  it("POST /api/transactions (child) returns 403", async () => {
    const res = await childApp.inject({
      method: "POST",
      url: "/api/transactions",
      payload: {
        childId: 2,
        amount: 5,
        description: "Self-award attempt",
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /api/transactions (child) returns own transactions", async () => {
    const res = await childApp.inject({
      method: "GET",
      url: "/api/transactions",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.transactions).toBeInstanceOf(Array);
    expect(body.transactions.length).toBeGreaterThan(0);
    // All transactions should belong to this child
    for (const tx of body.transactions) {
      expect(tx.childId).toBe(2);
    }
  });

  it("GET /api/transactions (parent) requires childId param", async () => {
    const res = await parentApp.inject({
      method: "GET",
      url: "/api/transactions",
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /api/transactions (parent) with childId returns transactions", async () => {
    const res = await parentApp.inject({
      method: "GET",
      url: "/api/transactions?childId=2",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.transactions).toBeInstanceOf(Array);
  });

  it("POST /api/transactions validates required fields", async () => {
    const res = await parentApp.inject({
      method: "POST",
      url: "/api/transactions",
      payload: { childId: 2 }, // missing amount and description
    });
    expect(res.statusCode).toBe(400);
  });
});
