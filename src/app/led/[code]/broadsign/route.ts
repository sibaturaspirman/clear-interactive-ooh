import { renderBroadsignHtml } from "@/lib/broadsign-led/render-html";
import { getBroadsignSitePayload } from "@/lib/broadsign-led/resolve-site-config";
import { getServerEnv } from "@/lib/env";

type RouteContext = {
  params: Promise<{ code: string }>;
};

/** `request.url` reports the bind host (e.g. 0.0.0.0) under `next dev --hostname`, so prefer the Host header. */
function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return url.origin;
  }
  const protocol =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(/:$/, "");
  return `${protocol}://${host}`;
}

/** Vanilla HTML5 player for Broadsign Chromium 87 — does not replace `/led/[code]`. */
export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const site = getBroadsignSitePayload(code);

  if (!site) {
    return new Response("Broadsign player not available for this location.", {
      status: 404,
    });
  }

  const { ledKey } = getServerEnv();
  const origin = requestOrigin(request);
  const html = renderBroadsignHtml(site, {
    apiBaseUrl: origin,
    ledKey,
    useLedProxy: true,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
