import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { z } from "zod";
import { createDatabase, searchServices, createConsultation, readConsultations } from "./database.js";
import { LabError } from "./errors.js";
import { runCommand } from "./command.js";
import { sandboxReady } from "./sandbox.js";

const keywordSchema = z.string().max(120).default("");
// Product endpoints fail safely to secure for missing or invalid preferences.
const productModeSchema = z.enum(["secure", "vulnerable"]).catch("secure");
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
    const { keyword, mode } = z
      .strictObject({ keyword: keywordSchema, mode: productModeSchema })
      .parse(req.query);
    const { services, count } = searchServices(db, keyword, mode);
    res.json({ mode, keyword, services, count });
  });
  app.get("/api/labs/sql", (req, res) => {
    const { mode, keyword } = sqlSchema.parse(req.query);
    res.json(searchServices(db, keyword, mode));
  });
  app.get('/api/consultations', (_req, res) => {
    res.json({ consultations: readConsultations(db) });
  });
  app.post('/api/consultations', (req, res) => {
    const input = z.strictObject({
      serviceId: z.number().int().positive().max(999999999),
      patientName: z.string().trim().min(2).max(60),
      reason: z.string().trim().min(3).max(500)
    }).parse(req.body);
    res.status(201).json({ consultation: createConsultation(db, input) });
  });
  const exportSummary: RequestHandler = async (req, res) => {
    const id = Number(z.string().regex(/^[1-9]\d{0,8}$/).parse(req.params.id));
    const { mode, documentTitle } = z.strictObject({
      mode: productModeSchema,
      documentTitle: z.string().min(1).max(80).default('ringkasan-konsultasi')
    }).parse(req.method === 'GET' ? req.query : req.body);
    const consultation = readConsultations(db, id)[0];
    if (!consultation) throw new LabError(404, 'CONSULTATION_NOT_FOUND', 'Konsultasi tidak ditemukan.');
    // Reuse the existing bounded formatter and Docker guard; no new command sink or paths.
    const { output } = await runCommand(mode, documentTitle);
    const title = output.replace(/^diagnostic: /, '').trimEnd();
    const summary = [
      'CareProbe Health — Ringkasan Konsultasi', `Judul: ${title}`, '',
      `ID konsultasi: ${consultation.id}`, `Layanan: ${consultation.serviceName}`,
      `Tanggal: ${consultation.createdAt}`, `Pasien demo: ${consultation.patientName}`,
      `Alasan: ${consultation.reason}`, `Status: ${consultation.status}`, '',
      'Simulasi layanan kesehatan — data fiktif. Bukan dokumen medis.'
    ].join('\n');
    res.attachment(`careprobe-konsultasi-${id}.txt`).type('text/plain').send(summary);
  };
  // Local educational download only: both inputs use the same allowlist and Docker gate.
  app.get('/api/consultations/:id/export', exportSummary);
  app.post('/api/consultations/:id/export', exportSummary);
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
