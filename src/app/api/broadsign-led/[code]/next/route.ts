import { ledApiFetch } from "@/lib/api";
import { getServerEnv } from "@/lib/env";

type RouteContext = {
  params: Promise<{ code: string }>;
};

/** Same-origin proxy for Broadsign player (avoids cross-origin fetch from iframe). */
export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const clientKey = request.headers.get("x-led-key")?.trim();
  const { ledKey } = getServerEnv();

  if (!clientKey || clientKey !== ledKey) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "5";
  const replay = url.searchParams.get("replay") ?? "0";
  const order = url.searchParams.get("order") ?? "desc";

  try {
    const data = await ledApiFetch<unknown>(
      `/api/led/${encodeURIComponent(code)}/next?limit=${encodeURIComponent(limit)}&replay=${encodeURIComponent(replay)}&order=${encodeURIComponent(order)}`,
    );
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal ambil antrian";
    return Response.json({ message }, { status: 502 });
  }
}
