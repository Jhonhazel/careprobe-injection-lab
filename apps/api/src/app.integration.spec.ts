import { beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { createApp } from "./app.js";

describe('direct encoded services URLs', () => {
  let app: Express;
  beforeAll(async () => { app = await createApp(); });
  it.each([
    ['keyword=gigi&mode=secure', 'gigi', 1, 'secure'],
    ['keyword=gigi&mode=vulnerable', 'gigi', 1, 'vulnerable'],
    ['keyword=%27%20OR%201%3D1%20--%20&mode=vulnerable', "' OR 1=1 -- ", 6, 'vulnerable'],
    ['keyword=%27%20OR%201%3D1%20--%20&mode=secure', "' OR 1=1 -- ", 0, 'secure'],
    ['keyword=%27%20OR%201%3D1%20--%20', "' OR 1=1 -- ", 0, 'secure'],
    ['keyword=%27%20OR%201%3D1%20--%20&mode=invalid', "' OR 1=1 -- ", 0, 'secure'],
    ['keyword=%2527%2520OR%25201%253D1%2520--%2520&mode=vulnerable', '%27%20OR%201%3D1%20--%20', 0, 'vulnerable']
  ])('executes the decoded query exactly once: %s', async (query, keyword, count, mode) => {
    const response = await request(app).get(`/api/services?${query}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ keyword, count, mode });
    expect(response.body.services).toHaveLength(Number(count));
  });
  it.each(['keyword=one&keyword=two', `keyword=${'a'.repeat(121)}`, 'keyword=%3B&mode=vulnerable'])('rejects malformed keyword URL: %s', async (query) => {
    const before = (await request(app).get('/api/services')).body.services;
    const response = await request(app).get(`/api/services?${query}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect((await request(app).get('/api/services')).body.services).toEqual(before);
  });
});

describe("health API", () => {
  it("reports readiness as JSON", async () => {
    const response = await request(await createApp()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok", database: "ready" });
  });
});

describe("command boundary on the host", () => {
  let app: Express;
  beforeAll(async () => {
    app = await createApp();
  });

  it.each(["secure", "vulnerable"])(
    "fails closed for %s outside the Docker sandbox",
    async (mode) => {
      const response = await request(app)
        .post("/api/labs/command")
        .send({ mode, label: "clinic-demo" });
      expect(response.status).toBe(503);
      expect(response.body.error.code).toBe("SANDBOX_REQUIRED");
      expect(response.body.output).toBeUndefined();
    },
  );

  it.each([
    { mode: "other", label: "clinic-demo" },
    { label: "" },
    { label: "a".repeat(81) },
    { label: 12 },
    {},
    { mode: "secure", label: "clinic-demo; printf LAB_MARKER" },
    { mode: "vulnerable", label: "clinic-demo; echo LAB_MARKER" },
    { mode: "secure", label: "clinic demo" },
    { mode: "vulnerable", label: "a\nLAB_MARKER" },
    { label: "clinic-demo", extra: true },
  ])("rejects malformed command input: %j", async (body) => {
    const response = await request(app).post("/api/labs/command").send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects malformed JSON without a stack trace", async () => {
    const response = await request(app)
      .post("/api/labs/command")
      .set("Content-Type", "application/json")
      .send("{");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it.each(
    ["\n", "\r", "\r\n", "\u2028", "\u2029"].flatMap((suffix) =>
      ["secure", "vulnerable"].map((mode) => ({ mode, suffix })),
    ),
  )("rejects trailing line separators: %j", async ({ mode, suffix }) => {
    const response = await request(app)
      .post("/api/labs/command")
      .send({ mode, label: `clinic-demo${suffix}` });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.output).toBeUndefined();
  });

  it("bounds JSON request size", async () => {
    const response = await request(app)
      .post("/api/labs/command")
      .send({ label: "a".repeat(3000) });
    expect(response.status).toBe(413);
  });

  it("rejects a foreign browser origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://example.org");
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("LOCAL_ORIGIN_REQUIRED");
  });

  it("accepts the local frontend origin", async () => {
    expect(
      (
        await request(app)
          .get("/api/health")
          .set("Origin", "http://127.0.0.1:5173")
      ).status,
    ).toBe(200);
  });

  it("returns JSON for an unknown endpoint", async () => {
    const response = await request(app).get("/api/missing");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});

describe("SQLite catalog and SQL laboratory", () => {
  let app: Express;
  beforeAll(async () => {
    app = await createApp();
  });

  it("reads six synthetic services from SQLite", async () => {
    const response = await request(app).get("/api/services");
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(6);
    expect(response.body.services[0]).toMatchObject({
      name: "Konsultasi Umum",
      category: "Konsultasi",
    });
  });

  it("filters ordinary browsing and defaults to secure mode", async () => {
    const response = await request(app)
      .get("/api/services")
      .query({ keyword: "gigi" });
    expect(response.body).toMatchObject({ count: 1, mode: "secure" });
    expect(response.body.services[0].name).toBe("Pemeriksaan Gigi");
    expect(
      (await request(app).get("/api/services").query({ keyword: "tidak-ada" }))
        .body.count,
    ).toBe(0);
  });

  it("returns the same normal search in both SQL modes", async () => {
    const secure = await request(app)
      .get("/api/labs/sql")
      .query({ mode: "secure", keyword: "gigi" });
    const vulnerable = await request(app)
      .get("/api/labs/sql")
      .query({ mode: "vulnerable", keyword: "gigi" });
    expect(secure.status).toBe(200);
    expect(secure.body.count).toBe(1);
    expect(vulnerable.body.services).toEqual(secure.body.services);
  });

  it("returns actual duplicate records for a SELECT-only UNION ALL exercise", async () => {
    const response = await request(app)
      .get("/api/labs/sql")
      .query({
        mode: "vulnerable",
        keyword: "' UNION ALL SELECT * FROM services -- ",
      });
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(12);
    expect(
      response.body.services.filter((row: { id: number }) => row.id === 2),
    ).toHaveLength(2);
  });

  it("only changes query structure in vulnerable mode for the harmless tautology", async () => {
    const keyword = "' OR 1=1 -- ";
    const vulnerable = await request(app)
      .get("/api/labs/sql")
      .query({ mode: "vulnerable", keyword });
    const secure = await request(app)
      .get("/api/labs/sql")
      .query({ mode: "secure", keyword });
    expect(vulnerable.status).toBe(200);
    expect(vulnerable.body.count).toBe(6);
    expect(secure.body.count).toBe(0);
    expect(secure.body.query).toContain("LIKE ?");
    expect(secure.body.query).not.toContain(keyword);
    expect(secure.body.parameters).toEqual(["%' OR 1=1 -- %"]);
  });

  it("uses the same SQL behavior through ordinary services without leaking queries", async () => {
    const response = await request(app)
      .get("/api/services")
      .query({ mode: "vulnerable", keyword: "' OR 1=1 -- " });
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(6);
    expect(response.body.query).toBeUndefined();
    expect(response.body.parameters).toBeUndefined();
    const secure = await request(app).get('/api/services').query({ mode: 'secure', keyword: "' OR 1=1 -- " });
    expect(secure.body.count).toBe(0);
  });

  it.each([undefined, 'other', ['secure', 'vulnerable']])('defaults ordinary search to secure for missing/invalid mode: %j', async (mode) => {
    const response = await request(app).get('/api/services').query({ ...(mode === undefined ? {} : { mode }), keyword: "' OR 1=1 -- " });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ mode: 'secure', count: 0 });
  });

  it.each(['secure', 'vulnerable'])('ordinary normal search works in %s mode', async (mode) => {
    const response = await request(app).get('/api/services').query({ mode, keyword: 'gigi' });
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
  });

  it("never executes a stacked write and keeps seed records intact", async () => {
    const response = await request(app)
      .get("/api/labs/sql")
      .query({ mode: "vulnerable", keyword: "'; DELETE FROM services; -- " });
    expect(response.status).toBe(400);
    expect((await request(app).get("/api/services")).body.count).toBe(6);
  });

  it("handles invalid SQL as a controlled error without leaking internals", async () => {
    const response = await request(app)
      .get("/api/labs/sql")
      .query({ mode: "vulnerable", keyword: "'" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_SQL");
    expect(JSON.stringify(response.body)).not.toMatch(/stack|SELECT|sqlite/i);
  });

  it.each([
    { mode: "other" },
    { keyword: "a".repeat(121) },
    { keyword: ["a", "b"] },
    { mode: ["secure", "vulnerable"] },
  ])("rejects malformed SQL parameters: %j", async (query) => {
    const response = await request(app).get("/api/labs/sql").query(query);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
