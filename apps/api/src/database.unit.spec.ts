import { expect, it } from 'vitest';
import * as database from './database.js';

it('restores SQLite read-only protection after a consultation insert', async () => {
  const db = await database.createDatabase();
  try {
    expect(() => database.createConsultation(db, { serviceId: 1, patientName: 'Rani Demo', reason: 'Simulasi konsultasi.' })).not.toThrow();
    expect(() => db.run("INSERT INTO services VALUES (99, 'Dummy', 'Dummy', 'Dummy', 10, 10)")).toThrow(/readonly/i);
  } finally { db.close(); }
});
