export type Mode = "secure" | "vulnerable";
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
  body?: object,
  responseType: 'json' | 'text' = 'json',
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
  if (response.ok && responseType === 'text') return await response.text() as T;
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
