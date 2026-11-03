import { ledApiFetch } from "@/lib/api";
import { getServerEnv } from "@/lib/env";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const clientKey = request.headers.get("x-led-key")?.trim();
  const { ledKey } = getServerEnv();

  if (!clientKey || clientKey !== ledKey) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    await ledApiFetch(`/api/led/${encodeURIComponent(code)}/played`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal ack antrian";
    return Response.json({ message }, { status: 502 });
  }
}
