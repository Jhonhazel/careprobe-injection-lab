export type Mode = "secure" | "vulnerable";
export type LabKind = "sql" | "command";
export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
}
export interface CatalogResult {
  mode: Mode;
  keyword: string;
  count: number;
  services: Service[];
}
export interface SqlResult extends CatalogResult {
  query: string;
  parameters: string[];
}
export interface CommandResult {
  mode: Mode;
  label: string;
  output: string;
  shell: boolean;
  timeoutMs: number;
  outputLimitBytes: number;
}
export type LabResult = SqlResult | CommandResult;
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  body?: { mode: Mode; label: string },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...(body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ApiError(
      0,
      "API_OFFLINE",
      "API tidak dapat dihubungi. Pastikan Docker Compose berjalan, lalu coba lagi.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    if (response.status >= 500) {
      throw new ApiError(
        response.status,
        "API_OFFLINE",
        "API tidak dapat dihubungi atau proxy lokal gagal. Pastikan Docker Compose berjalan.",
      );
    }
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "Respons API tidak valid. Periksa backend lokal.",
    );
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error?.code ?? "API_ERROR",
      data.error?.message ?? "Permintaan gagal.",
    );
  }
  return data as T;
}

export interface Evidence {
  kind: LabKind;
  mode: Mode;
  input: string;
  time: string;
  status: number;
  result?: LabResult;
  error?: string;
}
const evidenceKey = "careprobe-evidence-v1";
export function readEvidence(): Evidence[] {
  try {
    const data: unknown = JSON.parse(
      sessionStorage.getItem(evidenceKey) ?? "[]",
    );
    return Array.isArray(data)
      ? data
          .filter(
            (row): row is Evidence =>
              row &&
              ["sql", "command"].includes(row.kind) &&
              ["secure", "vulnerable"].includes(row.mode) &&
              typeof row.input === "string" &&
              typeof row.status === "number" &&
              typeof row.time === "string",
          )
          .slice(0, 4)
      : [];
  } catch {
    return [];
  }
}
export function rememberEvidence(evidence: Evidence) {
  try {
    sessionStorage.setItem(
      evidenceKey,
      JSON.stringify(
        [
          evidence,
          ...readEvidence().filter(
            (row) => row.kind !== evidence.kind || row.mode !== evidence.mode,
          ),
        ].slice(0, 4),
      ),
    );
  } catch {
    /* Storage may be disabled; the current result still works. */
  }
}
export function clearEvidence() {
  try {
    sessionStorage.removeItem(evidenceKey);
  } catch {
    /* Optional storage. */
  }
}
