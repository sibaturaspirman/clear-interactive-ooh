"use server";

import { cookies } from "next/headers";

import { MICROSITE_SCAN_QR_AGAIN_MESSAGE } from "@/lib/microsite/microsite-session-user-message";
import { isWindowSubmitConsumed } from "@/lib/microsite/session-consumed";
import {
  micrositeSubmitTicketCookie,
  mintSubmitTicket,
  verifyWindowToken,
} from "@/lib/microsite/session-tokens";

export type ExchangeMicrositeSessionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Sets httpOnly submit cookie from signed `w` (same logic as POST /api/microsite/session).
 * Prefer this from the microsite client so exchange works even when route handlers misbehave.
 */
export async function exchangeMicrositeSession(
  w: string,
  locationCode: string,
): Promise<ExchangeMicrositeSessionResult> {
  const trimmedW = (w || "").trim();
  const code = (locationCode || "").trim().toLowerCase();
  if (!trimmedW || !code) {
    return { ok: false, message: MICROSITE_SCAN_QR_AGAIN_MESSAGE };
  }

  const payload = verifyWindowToken(trimmedW);
  if (!payload || payload.c.toLowerCase() !== code) {
    return {
      ok: false,
      message: MICROSITE_SCAN_QR_AGAIN_MESSAGE,
    };
  }

  if (isWindowSubmitConsumed(payload.c, payload.wid, payload.iat)) {
    return {
      ok: false,
      message: MICROSITE_SCAN_QR_AGAIN_MESSAGE,
    };
  }

  const ticket = mintSubmitTicket(payload.c, payload.wid, payload.iat);
  const cookieStore = await cookies();
  cookieStore.set(micrositeSubmitTicketCookie, ticket, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(20 * 60),
  });
  return { ok: true };
}
