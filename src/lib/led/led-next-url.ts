/** Query for CLEAR API `GET /api/led/:code/next` (newest-first playback). */
export function buildLedNextUrl(
  apiBaseUrl: string,
  code: string,
  options: { limit: number; replay: boolean },
): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    limit: String(Math.max(1, options.limit)),
    replay: options.replay ? "1" : "0",
    order: "desc",
  });
  return `${base}/api/led/${encodeURIComponent(code)}/next?${params.toString()}`;
}
