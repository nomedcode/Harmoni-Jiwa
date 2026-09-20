import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, formatApiError } from "@/lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("formatApiError", () => {
  it("appends the HTTP status when present", () => {
    const error = new ApiError("Data tidak valid.", { kind: "http", status: 422, url: "/x" });
    expect(formatApiError(error)).toBe("Data tidak valid. (HTTP 422)");
  });

  it("keeps plain messages for configuration errors without status", () => {
    const error = new ApiError("Belum dikonfigurasi.", { kind: "configuration", url: "/x" });
    expect(formatApiError(error)).toBe("Belum dikonfigurasi.");
  });

  it("falls back to the Error message for unknown errors", () => {
    expect(formatApiError(new Error("boom"))).toBe("boom");
    expect(formatApiError("teks")).toBe("Terjadi kesalahan yang tidak diketahui.");
  });
});

describe("apiRequest", () => {
  it("sends the bearer token and returns the parsed payload", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ data: [{ id: 1 }] }), { status: 200 }));

    const result = await apiRequest<{ data: { id: number }[] }>("employees", {}, "token-abc");

    expect(result.data[0].id).toBe(1);
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-abc");
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("maps a 401 response to an ApiError that carries status and payload", async () => {
    stubFetch(new Response(JSON.stringify({ message: "Token ditolak." }), { status: 401 }));

    await expect(apiRequest("auth/sync", { method: "POST", body: "{}" }))
      .rejects.toMatchObject({ name: "ApiError", kind: "http", status: 401, message: "Token ditolak." });
  });

  it("uses a default message when the backend body has no message", async () => {
    stubFetch(new Response("", { status: 403 }));

    await expect(apiRequest("staff/appointments"))
      .rejects.toThrow("Akses ke endpoint ini ditolak.");
  });

  it("reports a network error when fetch rejects", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(apiRequest("employees")).rejects.toMatchObject({ kind: "network" });
  });
});
