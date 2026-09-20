export type ApiErrorKind = "network" | "http" | "configuration";

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly url: string;
  readonly payload: ApiErrorPayload | null;

  constructor(
    message: string,
    options: {
      kind: ApiErrorKind;
      status?: number;
      url: string;
      payload?: ApiErrorPayload | null;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status ?? 0;
    this.url = options.url;
    this.payload = options.payload ?? null;
  }
}

const DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1";
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const developmentApiUrl = process.env.NODE_ENV === "development" ? DEFAULT_API_URL : "";

// Local fallback prevents setup friction during development. Production must
// declare NEXT_PUBLIC_API_URL so missing deployment configuration fails loudly.
export const API_BASE_URL = (configuredApiUrl || developmentApiUrl).replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 10000;

function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export function apiHealthUrl(): string {
  try {
    return `${new URL(API_BASE_URL).origin}/up`;
  } catch {
    return "";
  }
}

async function readPayload(response: Response): Promise<ApiErrorPayload | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null
      ? parsed as ApiErrorPayload
      : { message: text };
  } catch {
    return { message: text.slice(0, 300) };
  }
}

function errorMessage(payload: ApiErrorPayload | null, status: number): string {
  if (payload?.message) return payload.message;
  if (status === 401) return "Sesi login tidak diterima oleh backend.";
  if (status === 403) return "Akses ke endpoint ini ditolak.";
  if (status === 422) return "Data yang dikirim tidak valid.";
  return `Backend mengembalikan HTTP ${status}.`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const url = apiUrl(path);
  if (!API_BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL belum dikonfigurasi.", {
      kind: "configuration",
      url,
    });
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(
      timedOut
        ? `Request ke ${url} timeout setelah ${REQUEST_TIMEOUT_MS / 1000} detik.`
        : `Gagal terhubung ke ${url}. Pastikan Laravel aktif dan CORS mengizinkan origin frontend.`,
      { kind: "network", url },
    );
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ApiError(errorMessage(payload, response.status), {
      kind: "http",
      status: response.status,
      url,
      payload,
    });
  }

  return payload as T;
}

export function apiJson<T>(path: string, method: "POST" | "PUT" | "PATCH", body: unknown, accessToken: string): Promise<T> {
  return apiRequest<T>(path, {
    method,
    body: JSON.stringify(body),
  }, accessToken);
}

export type AuthRole = "patient" | "karyawan" | "admin";
export type SyncProfileResponse = { data: Record<string, unknown> & { role?: AuthRole } };

export type SyncProfilePayload = {
  full_name: string;
  gender?: "M" | "F";
  phone_number?: string;
};

export type AppointmentPayload = {
  full_name: string;
  gender: "M" | "F";
  phone_number: string;
  service_type: string;
  schedule: string;
  employee_id: number;
};

export type ApiAppointment = Record<string, unknown>;
export type PaginatedResponse<T> = { data: T[]; [key: string]: unknown };

export type ApiEmployee = {
  id: number;
  full_name: string;
  role: string;
};

export function listEmployees(accessToken: string): Promise<{ data: ApiEmployee[] }> {
  return apiRequest("employees", {}, accessToken);
}

export function syncProfile(payload: SyncProfilePayload, accessToken: string): Promise<SyncProfileResponse> {
  return apiJson("auth/sync", "POST", payload, accessToken);
}

export function createAppointment(payload: AppointmentPayload, accessToken: string): Promise<{ message?: string; data: ApiAppointment }> {
  return apiJson("appointments", "POST", payload, accessToken);
}

export function listAppointments(accessToken: string): Promise<PaginatedResponse<ApiAppointment>> {
  return apiRequest("appointments", {}, accessToken);
}

export function listQueues(accessToken: string): Promise<PaginatedResponse<ApiAppointment>> {
  return apiRequest("queues", {}, accessToken);
}

export function listStaffAppointments(accessToken: string, page = 1): Promise<PaginatedResponse<ApiAppointment>> {
  return apiRequest(`staff/appointments?page=${page}`, {}, accessToken);
}

export async function healthCheck(): Promise<{ status: number; url: string }> {
  const url = apiHealthUrl();
  if (!url) throw new ApiError("NEXT_PUBLIC_API_URL tidak valid.", { kind: "configuration", url });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new ApiError(`Health check mengembalikan HTTP ${response.status}.`, {
        kind: "http",
        status: response.status,
        url,
      });
    }
    return { status: response.status, url };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Gagal menghubungi health check ${url}.`, { kind: "network", url });
  } finally {
    clearTimeout(timeout);
  }
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const suffix = error.status ? ` (HTTP ${error.status})` : "";
    return `${error.message}${suffix}`;
  }
  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}
