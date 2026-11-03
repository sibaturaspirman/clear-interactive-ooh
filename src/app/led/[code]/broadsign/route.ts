import { renderBroadsignHtml } from "@/lib/broadsign-led/render-html";
import { getBroadsignSitePayload } from "@/lib/broadsign-led/resolve-site-config";
import { getServerEnv } from "@/lib/env";

type RouteContext = {
  params: Promise<{ code: string }>;
};

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
  const origin = new URL(request.url).origin;
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
