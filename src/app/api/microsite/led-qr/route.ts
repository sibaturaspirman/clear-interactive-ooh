import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { getLocationByCode } from "@/lib/locations";
import { mintWindowToken } from "@/lib/microsite/session-tokens";
import { micrositePath } from "@/lib/paths";
import { getAppOrigin } from "@/lib/urls";

/**
 * Dynamic PNG QR for LED — encodes `/microsite/{code}?w=...` (rotating session token).
 * No cache so displays always refresh when img src is bumped with `&t=`.
 */
export async function GET(request: Request) {
  const micrositeSessionSecret = process.env.MICROSITE_SESSION_SECRET?.trim();

  if (
    process.env.NODE_ENV === "production" &&
    (!micrositeSessionSecret || micrositeSessionSecret.length < 16)
  ) {
    return NextResponse.json(
      { error: "MICROSITE_SESSION_SECRET required for dynamic QR" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code")?.trim().toLowerCase() ?? "";
  if (!rawCode) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const location = await getLocationByCode(rawCode);
  if (!location) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  const origin = await getAppOrigin();
  const w = mintWindowToken(location.code);
  const target = `${origin}${micrositePath(location.code)}?w=${encodeURIComponent(w)}`;

  const size = Math.min(
    1024,
    Math.max(64, Number.parseInt(searchParams.get("size") ?? "480", 10) || 480),
  );

  const png = await QRCode.toBuffer(target, {
    type: "png",
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
