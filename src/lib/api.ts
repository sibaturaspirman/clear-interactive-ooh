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

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Clear API ${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      const body = await response.text().catch(() => "");
      if (body) {
        message = body.slice(0, 200);
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
