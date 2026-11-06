import { NextResponse } from "next/server";

import { getLocationByCode } from "@/lib/locations";
import { mintWindowToken } from "@/lib/microsite/session-tokens";

/**
 * Dev-only: current signed `w` for a location (for testing without rotating QR asset).
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toLowerCase() ?? "";
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const location = await getLocationByCode(code);
  if (!location) {
    return NextResponse.json({ error: "Unknown code" }, { status: 404 });
  }

  const w = mintWindowToken(location.code);
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    new URL(request.url).origin;

  return NextResponse.json({
    code: location.code,
    w,
    micrositeUrl: `${origin}/microsite/${encodeURIComponent(location.code)}?w=${encodeURIComponent(w)}`,
  });
}
