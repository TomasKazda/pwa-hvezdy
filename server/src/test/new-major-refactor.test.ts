import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "./setup.js";
import type { FastifyInstance } from "fastify";

describe("Major refactor: activity types and invitations", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates activity types with value and direction", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/activity-types",
      payload: {
        name: "Připravenost",
        value: 3,
        direction: "plus",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.activityType).toMatchObject({
      name: "Připravenost",
      value: 3,
      direction: "plus",
    });
  });

  it("creates child invitation with usageCount field", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/child-invitations",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.invitation).toHaveProperty("usageCount");
    expect(body.invitation.usageCount).toBe(0);
  });

  it("accepts transactions with wishId and without categoryId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/transactions",
      payload: {
        childId: 2,
        amount: 7,
        description: "Dobrovolná odměna",
        wishId: 99,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.transaction).toHaveProperty("wishId");
    expect(body.transaction).not.toHaveProperty("categoryId");
  });
});
