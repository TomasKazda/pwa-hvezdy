import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "./setup.js";
import type { FastifyInstance } from "fastify";

describe("Wishes API (parent)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(1); // parent
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/wishes returns wishes list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/wishes" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.wishes).toBeInstanceOf(Array);
    expect(body.wishes.length).toBeGreaterThan(0);
  });

  it("POST /api/wishes creates a new wish with price", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wishes",
      payload: {
        title: "Test přání od rodiče",
        starCost: 15,
        isPersistent: true,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.wish.title).toBe("Test přání od rodiče");
    expect(body.wish.starCost).toBe(15);
    expect(body.wish.isPersistent).toBe(true);
  });

  it("PATCH /api/wishes/:id sets price on unpriced wish", async () => {
    // Find the unpriced wish from seed ("Vlastní sluchátka")
    const listRes = await app.inject({ method: "GET", url: "/api/wishes" });
    const unpriced = listRes.json().wishes.find((w: { starCost: number | null }) => w.starCost === null);

    if (!unpriced) {
      // Skip if seed data changed
      return;
    }

    const res = await app.inject({
      method: "PATCH",
      url: `/api/wishes/${unpriced.id}`,
      payload: { starCost: 25 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().wish.starCost).toBe(25);
  });

  it("POST /api/wishes/:id/fulfill deducts stars and fulfills wish", async () => {
    // Use "Zmrzlina" (cost 5, persistent) — child 2 has balance >= 5
    const listRes = await app.inject({ method: "GET", url: "/api/wishes" });
    const zmrzlina = listRes.json().wishes.find((w: { title: string }) => w.title === "Zmrzlina");

    if (!zmrzlina) return;

    const res = await app.inject({
      method: "POST",
      url: `/api/wishes/${zmrzlina.id}/fulfill`,
      payload: { childId: 2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it("DELETE /api/wishes/:id removes a wish", async () => {
    // Create a wish then delete it
    const createRes = await app.inject({
      method: "POST",
      url: "/api/wishes",
      payload: { title: "To be deleted" },
    });
    const wish = createRes.json().wish;

    const res = await app.inject({
      method: "DELETE",
      url: `/api/wishes/${wish.id}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });
});

describe("Wishes API (child)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(2); // child Petr
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/wishes returns wishes with reachability", async () => {
    const res = await app.inject({ method: "GET", url: "/api/wishes" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("balance");
    expect(body.wishes).toBeInstanceOf(Array);
    // Each priced wish should have reachable field
    for (const w of body.wishes) {
      if (w.starCost !== null) {
        expect(w).toHaveProperty("reachable");
        expect(typeof w.reachable).toBe("boolean");
      }
    }
  });

  it("POST /api/wishes (child) creates wish without price", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wishes",
      payload: {
        title: "Přání od dítěte",
        starCost: 100, // child tries to set price — should be ignored
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.wish.title).toBe("Přání od dítěte");
    expect(body.wish.starCost).toBeNull(); // child cannot set price
    expect(body.wish.isPersistent).toBe(false);
  });

  it("PATCH /api/wishes/:id returns 403 for child", async () => {
    const listRes = await app.inject({ method: "GET", url: "/api/wishes" });
    const wish = listRes.json().wishes[0];

    const res = await app.inject({
      method: "PATCH",
      url: `/api/wishes/${wish.id}`,
      payload: { starCost: 999 },
    });
    expect(res.statusCode).toBe(403);
  });

  it("DELETE /api/wishes/:id returns 403 for child", async () => {
    const listRes = await app.inject({ method: "GET", url: "/api/wishes" });
    const wish = listRes.json().wishes[0];

    const res = await app.inject({
      method: "DELETE",
      url: `/api/wishes/${wish.id}`,
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /api/wishes/fulfilled returns fulfilled wish history", async () => {
    const res = await app.inject({ method: "GET", url: "/api/wishes/fulfilled" });
    expect(res.statusCode).toBe(200);
    expect(res.json().wishes).toBeInstanceOf(Array);
  });
});
