import express, { type ErrorRequestHandler } from "express";
import { z } from "zod";
import { createDatabase, searchServices } from "./database.js";
import { LabError } from "./errors.js";
import { runCommand } from "./command.js";
import { sandboxReady } from "./sandbox.js";

const keywordSchema = z.string().max(120).default("");
const sqlSchema = z.strictObject({
  mode: z.enum(["secure", "vulnerable"]).default("secure"),
  keyword: keywordSchema,
});

export async function createApp() {
  const db = await createDatabase();
  const app = express();
  app.disable("x-powered-by");
  app.use((req, _res, next) => {
    const origin = req.get("Origin");
    const localOrigins = new Set([
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:4173",
      "http://localhost:4173",
      "http://127.0.0.1:3100",
      "http://localhost:3100",
    ]);
    if (origin && !localOrigins.has(origin)) {
      return next(
        new LabError(
          403,
          "LOCAL_ORIGIN_REQUIRED",
          "API ini hanya untuk frontend laboratorium lokal.",
        ),
      );
    }
    next();
  });
  app.use(express.json({ limit: "2kb" }));
  app.use((_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    next();
  });
  app.get("/api/health", (_req, res) => {
    db.exec("SELECT 1");
    res.json({
      status: "ok",
      database: "ready",
      commandSandbox: sandboxReady(),
    });
  });
  app.get("/api/services", (req, res) => {
    const { keyword } = z
      .strictObject({ keyword: keywordSchema })
      .parse(req.query);
    const { services, count } = searchServices(db, keyword);
    res.json({ mode: "secure", keyword, services, count });
  });
  app.get("/api/labs/sql", (req, res) => {
    const { mode, keyword } = sqlSchema.parse(req.query);
    res.json(searchServices(db, keyword, mode));
  });
  app.post("/api/labs/command", async (req, res) => {
    const { mode, label } = z
      .strictObject({
        mode: z.enum(["secure", "vulnerable"]).default("secure"),
        label: z.string().min(1).max(80),
      })
      .parse(req.body);
    res.json(await runCommand(mode, label));
  });
  app.use((_req, _res, next) =>
    next(new LabError(404, "NOT_FOUND", "Endpoint tidak ditemukan.")),
  );
  const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    _next,
  ) => {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Input tidak valid. Periksa mode, tipe, dan panjang input.",
          },
        });
    } else if (error instanceof LabError) {
      res
        .status(error.status)
        .json({ error: { code: error.code, message: error.message } });
    } else if (error instanceof SyntaxError) {
      res
        .status(400)
        .json({
          error: {
            code: "INVALID_JSON",
            message: "Body harus berupa JSON yang valid.",
          },
        });
    } else if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.too.large"
    ) {
      res
        .status(413)
        .json({
          error: {
            code: "BODY_TOO_LARGE",
            message: "Body melebihi batas 2 KB.",
          },
        });
    } else {
      res
        .status(500)
        .json({
          error: {
            code: "INTERNAL_ERROR",
            message: "Operasi gagal. Coba kembali atau restart lab.",
          },
        });
    }
  };
  app.use(errorHandler);
  return app;
}
