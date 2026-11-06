import "server-only";

import { getServerEnv } from "@/lib/env";

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function buildApiUrl(path: string, baseUrl: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

const GENERIC_HTTP_MESSAGES = new Set([
  "unprocessable entity",
  "unprocessable content",
  "the given data was invalid",
  "bad request",
]);

/**
 * FastAPI / OpenAPI / Pydantic v1–v2: `detail` can be string | object | array of
 * { loc, msg, type, input, ctx } — field names vary (`msg` vs `message`).
 */
function collectDetailArray(detail: unknown, out: string[]): void {
  if (!detail) {
    return;
  }
  if (typeof detail === "string" && detail.trim()) {
    out.push(detail.trim());
    return;
  }
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const row = detail as Record<string, unknown>;
    const msg =
      (typeof row.msg === "string" && row.msg.trim()) ||
      (typeof row.message === "string" && row.message.trim());
    const loc = Array.isArray(row.loc)
      ? row.loc
          .filter((p) => typeof p === "string" || typeof p === "number")
          .join(".")
      : "";
    if (msg) {
      const input = row.input;
      const suffix =
        input !== undefined && input !== null
          ? ` (got: ${typeof input === "string" ? input.slice(0, 80) : JSON.stringify(input).slice(0, 80)})`
          : "";
      out.push((loc ? `${loc}: ${msg}` : msg) + suffix);
      return;
    }
    try {
      out.push(JSON.stringify(detail).slice(0, 400));
    } catch {
      /* skip */
    }
    return;
  }
  if (!Array.isArray(detail)) {
    return;
  }
  for (const item of detail) {
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
      continue;
    }
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const msg =
        (typeof row.msg === "string" && row.msg.trim()) ||
        (typeof row.message === "string" && row.message.trim());
      const loc = Array.isArray(row.loc)
        ? row.loc
            .filter((p) => typeof p === "string" || typeof p === "number")
            .join(".")
        : "";
      if (msg) {
        const input = row.input;
        const suffix =
          input !== undefined && input !== null
            ? ` (got: ${typeof input === "string" ? input.slice(0, 120) : JSON.stringify(input).slice(0, 120)})`
            : "";
        out.push((loc ? `${loc}: ${msg}` : msg) + suffix);
        continue;
      }
      try {
        out.push(JSON.stringify(item).slice(0, 280));
      } catch {
        /* skip */
      }
    }
  }
}

/** Collect Laravel/Zod-style validation lines from `errors` objects (including nested). */
function collectValidationLines(errors: unknown, out: string[]): void {
  if (!errors || typeof errors !== "object") {
    return;
  }
  for (const value of Object.values(errors)) {
    if (typeof value === "string" && value.trim()) {
      out.push(value.trim());
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          out.push(item.trim());
        } else if (item && typeof item === "object") {
          collectValidationLines(item, out);
        }
      }
      continue;
    }
    if (value && typeof value === "object") {
      collectValidationLines(value, out);
    }
  }
}

/** Laravel / JSON:API — 422 often only sets `message` to the HTTP phrase; real detail is in `errors`. */
function extractApiErrorBody(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const o = payload as Record<string, unknown>;
  const lines: string[] = [];
  collectValidationLines(o.errors, lines);
  collectDetailArray(o.detail, lines);
  if (lines.length > 0) {
    return lines.slice(0, 8).join(" ");
  }

  const detailStr =
    (typeof o.detail === "string" && o.detail.trim()) ||
    (typeof o.title === "string" && o.title.trim()) ||
    (typeof o.error === "string" && o.error.trim());
  if (detailStr) {
    return detailStr;
  }

  const msg = typeof o.message === "string" ? o.message.trim() : "";
  if (msg && !GENERIC_HTTP_MESSAGES.has(msg.toLowerCase())) {
    return msg;
  }

  return fallback;
}

function formatPayloadForErrorHint(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 0).slice(0, 600);
  } catch {
    return "";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallback = `Clear API ${response.status} ${response.statusText}`;
    const raw = await response.text().catch(() => "");
    if (!raw.trim()) {
      throw new Error(fallback);
    }
    let payload: unknown;
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      throw new Error(raw.slice(0, 400));
    }
    let message = extractApiErrorBody(payload, fallback);
    const generic =
      message === fallback ||
      GENERIC_HTTP_MESSAGES.has(message.toLowerCase());
    if (generic) {
      if (payload !== null && typeof payload === "object") {
        const hint = formatPayloadForErrorHint(payload);
        if (hint) {
          message = `${fallback}. ${hint}`;
        }
      }
      /** CMS often returns only `{ "message": "Unprocessable Entity" }` — show raw body for debugging. */
      const rawSnippet = raw.replace(/\s+/g, " ").trim().slice(0, 420);
      if (rawSnippet && !message.includes(rawSnippet.slice(0, 40))) {
        message = `${message} | CMS: ${rawSnippet}`;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return response.json() as Promise<T>;
}

/** Public CMS routes (`/api/locations`, `/api/submissions`) — no auth header. */
export async function publicApiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { apiUrl } = getServerEnv();
  const { headers, ...init } = options;

  const response = await fetch(buildApiUrl(path, apiUrl), {
    ...init,
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });

  return parseResponse<T>(response);
}

export async function publicApiPostJson<T>(
  path: string,
  body: unknown,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { apiUrl } = getServerEnv();
  const { headers, ...init } = options;

  const response = await fetch(buildApiUrl(path, apiUrl), {
    ...init,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

/** LED player routes — `x-led-key` header (see backend `player.js`). */
export async function ledApiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { apiUrl, ledKey } = getServerEnv();
  const { headers, ...init } = options;

  const response = await fetch(buildApiUrl(path, apiUrl), {
    ...init,
    headers: {
      Accept: "application/json",
      "x-led-key": ledKey,
      ...headers,
    },
  });

  return parseResponse<T>(response);
}
