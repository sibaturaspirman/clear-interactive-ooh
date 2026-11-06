import { NextResponse } from "next/server";

import { MICROSITE_SCAN_QR_AGAIN_MESSAGE } from "@/lib/microsite/microsite-session-user-message";
import {
  micrositeSubmitTicketCookie,
  mintSubmitTicket,
  verifyWindowToken,
} from "@/lib/microsite/session-tokens";

type Body = {
  w?: string;
  code?: string;
};

/**
 * Exchange signed window token `w` (from QR URL) for a per-device submit cookie (one-time use at submit).
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, message: MICROSITE_SCAN_QR_AGAIN_MESSAGE },
      { status: 400 },
    );
  }

  const w = typeof body.w === "string" ? body.w.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";

  if (!w || !code) {
    return NextResponse.json(
      { ok: false, message: MICROSITE_SCAN_QR_AGAIN_MESSAGE },
      { status: 400 },
    );
  }

  const payload = verifyWindowToken(w);
  if (!payload || payload.c.toLowerCase() !== code) {
    return NextResponse.json(
      { ok: false, message: MICROSITE_SCAN_QR_AGAIN_MESSAGE },
      { status: 401 },
    );
  }

  const ticket = mintSubmitTicket(payload.c, payload.wid);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(micrositeSubmitTicketCookie, ticket, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(20 * 60), // 20 minutes
  });
  return res;
}
