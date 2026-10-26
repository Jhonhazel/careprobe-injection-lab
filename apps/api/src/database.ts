import initSqlJs, { type Database } from "sql.js";
import { LabError } from "./errors.js";

export type Mode = "secure" | "vulnerable";
export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
}

export interface ConsultationInput {
  serviceId: number;
  patientName: string;
  reason: string;
}
export interface Consultation extends ConsultationInput {
  id: number;
  serviceName: string;
  status: 'PENDING';
  createdAt: string;
}

export async function createDatabase() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE services (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
    description TEXT NOT NULL, duration INTEGER NOT NULL, price INTEGER NOT NULL
  )`);
  const seed: Omit<Service, "id">[] = [
    {
      name: "Konsultasi Umum",
      category: "Konsultasi",
      description:
        "Simulasi konsultasi kesehatan umum untuk kebutuhan latihan.",
      duration: 30,
      price: 75000,
    },
    {
      name: "Pemeriksaan Gigi",
      category: "Pemeriksaan",
      description:
        "Layanan pemeriksaan gigi fiktif, tanpa tindakan medis nyata.",
      duration: 45,
      price: 120000,
    },
    {
      name: "Skrining Mata",
      category: "Pemeriksaan",
      description: "Contoh layanan pemeriksaan ketajaman penglihatan.",
      duration: 20,
      price: 60000,
    },
    {
      name: "Konsultasi Nutrisi",
      category: "Konsultasi",
      description:
        "Contoh konsultasi pola makan dengan profil sepenuhnya fiktif.",
      duration: 40,
      price: 95000,
    },
    {
      name: "Cek Kesehatan Dasar",
      category: "Skrining",
      description:
        "Paket skrining dummy untuk menjelajahi katalog laboratorium.",
      duration: 60,
      price: 150000,
    },
    {
      name: "Edukasi Kebugaran",
      category: "Edukasi",
      description: "Sesi edukasi kebugaran fiktif untuk latihan pencarian.",
      duration: 30,
      price: 50000,
    },
  ];
  for (const row of seed) {
    db.run(
      "INSERT INTO services (name, category, description, duration, price) VALUES (?, ?, ?, ?, ?)",
      [row.name, row.category, row.description, row.duration, row.price],
    );
  }
  db.run(`CREATE TABLE consultations (
    id INTEGER PRIMARY KEY, serviceId INTEGER NOT NULL REFERENCES services(id),
    patientName TEXT NOT NULL, reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', createdAt TEXT NOT NULL
  )`);
  db.run('INSERT INTO consultations (serviceId, patientName, reason, createdAt) VALUES (?, ?, ?, ?)',
    [1, 'Alya Demo', 'Simulasi konsultasi kesehatan umum.', '2026-10-01T09:00:00.000Z']);
  db.run('INSERT INTO consultations (serviceId, patientName, reason, createdAt) VALUES (?, ?, ?, ?)',
    [2, 'Bima Demo', 'Simulasi pemeriksaan gigi rutin.', '2026-10-02T09:00:00.000Z']);
  // SQL exercises always run read-only. Only the synchronous, bound insert below unlocks writes.
  db.run("PRAGMA query_only = ON");
  return db;
}

export function readConsultations(db: Database, id?: number): Consultation[] {
  const statement = db.prepare(`SELECT c.id, c.serviceId, s.name AS serviceName,
    c.patientName, c.reason, c.status, c.createdAt
    FROM consultations c JOIN services s ON s.id = c.serviceId
    ${id === undefined ? '' : 'WHERE c.id = ?'} ORDER BY c.id DESC`);
  try {
    statement.bind(id === undefined ? [] : [id]);
    const rows: Consultation[] = [];
    while (statement.step()) {
      const row = statement.getAsObject();
      rows.push({ id: Number(row.id), serviceId: Number(row.serviceId), serviceName: String(row.serviceName),
        patientName: String(row.patientName), reason: String(row.reason), status: 'PENDING', createdAt: String(row.createdAt) });
    }
    return rows;
  } finally { statement.free(); }
}

export function createConsultation(db: Database, input: ConsultationInput): Consultation {
  const service = db.prepare('SELECT id FROM services WHERE id = ?');
  try {
    service.bind([input.serviceId]);
    if (!service.step()) throw new LabError(404, 'SERVICE_NOT_FOUND', 'Layanan tidak ditemukan. Pilih layanan yang tersedia.');
  } finally { service.free(); }
  // sql.js operations here are synchronous: no other request can run while writes are enabled.
  db.run('PRAGMA query_only = OFF');
  try {
    db.run('INSERT INTO consultations (serviceId, patientName, reason, createdAt) VALUES (?, ?, ?, ?)',
      [input.serviceId, input.patientName, input.reason, new Date().toISOString()]);
    const id = Number(db.exec('SELECT last_insert_rowid()')[0].values[0][0]);
    return readConsultations(db, id)[0];
  } finally {
    db.run('PRAGMA query_only = ON');
  }
}

export function searchServices(
  db: Database,
  keyword: string,
  mode: Mode = "secure",
) {
  if (keyword.includes(";")) {
    throw new LabError(
      400,
      "VALIDATION_ERROR",
      "Lab SQL hanya menerima satu pencarian SELECT tanpa titik koma.",
    );
  }
  const select =
    "SELECT id, name, category, description, duration, price FROM services WHERE name LIKE ";
  // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: concatenation changes SQL structure.
  // Never copy this into a real application. This database contains only dummy services.
  const query =
    mode === "vulnerable"
      ? `${select}'%${keyword}%' ORDER BY id`
      : `${select}? ORDER BY id`;
  const parameters = mode === "secure" ? [`%${keyword}%`] : [];
  try {
    const statement = db.prepare(query);
    const services: Service[] = [];
    try {
      statement.bind(parameters);
      while (statement.step()) {
        const row = statement.getAsObject();
        services.push({
          id: Number(row.id),
          name: String(row.name),
          category: String(row.category),
          description: String(row.description),
          duration: Number(row.duration),
          price: Number(row.price),
        });
      }
    } finally {
      statement.free();
    }
    return {
      mode,
      keyword,
      count: services.length,
      services,
      query,
      parameters,
    };
  } catch {
    throw new LabError(
      400,
      "INVALID_SQL",
      "Input tidak membentuk pencarian yang valid. Gunakan contoh lab yang disediakan.",
    );
  }
}
