import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { eq } from "drizzle-orm";
import { buildApp } from "./setup.js";
import { db } from "../db/index.js";
import { users, transactions } from "../db/schema.js";
import type { FastifyInstance } from "fastify";

describe("Self-fulfillment webhook", () => {
  let mockServer: http.Server;
  let received: { contentType?: string; body: Record<string, unknown> } | null = null;
  let webhookUrl: string;

  beforeAll(async () => {
    mockServer = http.createServer((req, res) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        received = {
          contentType: req.headers["content-type"],
          body: JSON.parse(data || "{}"),
        };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    await new Promise<void>((resolve) => mockServer.listen(0, "127.0.0.1", resolve));
    const port = (mockServer.address() as AddressInfo).port;
    webhookUrl = `http://127.0.0.1:${port}/api/webhook/test`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  it("sends {child, minutes, secret} as JSON and deducts stars", async () => {
    const parentApp: FastifyInstance = await buildApp(1);

    const [child] = await db
      .select()
      .from(users)
      .where(eq(users.email, "petr@example.com"))
      .limit(1);
    expect(child).toBeTruthy();

    await db.insert(transactions).values({
      familyId: child.familyId!,
      childId: child.id,
      amount: 500,
      description: "test seed balance",
      authorId: 1,
    });

    const createRes = await parentApp.inject({
      method: "POST",
      url: "/api/wishes",
      payload: {
        title: "Extra čas na tabletu",
        starCost: 111,
        isSelfFulfillment: true,
        multiplier: 3,
        webhookUrl,
        webhookParamName: "minutes",
        webhookSecret: "THRK2026",
      },
    });
    expect(createRes.statusCode).toBe(200);
    const wishId = createRes.json().wish.id;
    expect(createRes.json().wish).not.toHaveProperty("webhookSecret");
    await parentApp.close();

    const childApp: FastifyInstance = await buildApp(child.id);
    const res = await childApp.inject({
      method: "POST",
      url: `/api/wishes/${wishId}/self-fulfill`,
      payload: { starCost: 111 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().parameter).toBe(333);
    await childApp.close();

    expect(received).toBeTruthy();
    expect(received!.contentType).toContain("application/json");
    expect(received!.body).toEqual({
      child: child.displayName,
      minutes: 333,
      secret: "THRK2026",
    });
  });
});
