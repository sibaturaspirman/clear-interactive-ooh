import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** QR / URL rotates every 5 minutes (new `w` on each rotation). */
export const MICROSITE_WINDOW_ROTATE_MS = 5 * 60 * 1000;
/** User must exchange `w` for a ticket before this passes (wall clock on token). */
export const MICROSITE_WINDOW_MAX_AGE_MS = 20 * 60 * 1000;
/** Per-device ticket: submit allowed until this expires after exchange. */
export const MICROSITE_SUBMIT_TICKET_TTL_MS = 20 * 60 * 1000;

const COOKIE_SUBMIT_TICKET = "clear_ms_submit";

type WindowPayload = {
  /** location code */
  c: string;
  /** window start (ms), aligned to ROTATE_MS */
  wid: number;
  /** issued at */
  iat: number;
};

type SubmitTicketPayload = {
  jti: string;
  c: string;
  wid: number;
  /** Matches `WindowPayload.iat` — identifies which QR URL / `w` this ticket came from. */
  winIat: number;
  iat: number;
  exp: number;
};

function getSecret(): Buffer {
  const raw = process.env.MICROSITE_SESSION_SECRET?.trim();
  if (!raw || raw.length < 16) {
    if (process.env.NODE_ENV === "development") {
      return Buffer.from(
        "dev-only-microsite-session-secret-change-me",
        "utf8",
      );
    }
    throw new Error("Missing or weak MICROSITE_SESSION_SECRET");
  }
  return Buffer.from(raw, "utf8");
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(s: string): Buffer {
  const pad = 4 - (s.length % 4);
  const padded = s + (pad === 4 ? "" : "=".repeat(pad));
  return Buffer.from(
    padded.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );
}

function sign(data: string): string {
  const mac = createHmac("sha256", getSecret())
    .update(data)
    .digest();
  return base64UrlEncode(mac);
}

function verifySig(data: string, sig: string): boolean {
  const expected = sign(data);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(sig, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Current window id (aligned to rotation). */
export function currentWindowId(now = Date.now()): number {
  return Math.floor(now / MICROSITE_WINDOW_ROTATE_MS) * MICROSITE_WINDOW_ROTATE_MS;
}

/** Issue `w` for LED QR / URL (short-lived validity from issue time in payload). */
export function mintWindowToken(locationCode: string, now = Date.now()): string {
  const wid = currentWindowId(now);
  const payload: WindowPayload = {
    c: locationCode,
    wid,
    iat: now,
  };
  const json = JSON.stringify(payload);
  const data = base64UrlEncode(Buffer.from(json, "utf8"));
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifyWindowToken(w: string): WindowPayload | null {
  const parts = w.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig || !verifySig(data, sig)) return null;
  let payload: WindowPayload;
  try {
    payload = JSON.parse(
      base64UrlDecode(data).toString("utf8"),
    ) as WindowPayload;
  } catch {
    return null;
  }
  if (!payload.c || typeof payload.wid !== "number" || typeof payload.iat !== "number") {
    return null;
  }
  const now = Date.now();
  if (now - payload.iat > MICROSITE_WINDOW_MAX_AGE_MS) {
    return null;
  }
  return payload;
}

export function mintSubmitTicket(
  locationCode: string,
  windowId: number,
  windowIssuedAt: number,
): string {
  const now = Date.now();
  const jti = base64UrlEncode(randomBytes(24));
  const payload: SubmitTicketPayload = {
    jti,
    c: locationCode,
    wid: windowId,
    winIat: windowIssuedAt,
    iat: now,
    exp: now + MICROSITE_SUBMIT_TICKET_TTL_MS,
  };
  const json = JSON.stringify(payload);
  const data = base64UrlEncode(Buffer.from(json, "utf8"));
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function parseSubmitTicket(
  raw: string | undefined,
): SubmitTicketPayload | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig || !verifySig(data, sig)) return null;
  let payload: SubmitTicketPayload;
  try {
    payload = JSON.parse(
      base64UrlDecode(data).toString("utf8"),
    ) as SubmitTicketPayload;
  } catch {
    return null;
  }
  const now = Date.now();
  if (
    !payload.jti ||
    !payload.c ||
    typeof payload.exp !== "number" ||
    typeof payload.winIat !== "number" ||
    now > payload.exp
  ) {
    return null;
  }
  return payload;
}

export const micrositeSubmitTicketCookie = COOKIE_SUBMIT_TICKET;
