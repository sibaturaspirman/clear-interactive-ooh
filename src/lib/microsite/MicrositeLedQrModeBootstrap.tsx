/**
 * Injects `window.__CLEAR_MS_LED_QR_MODE` before interactive LED scripts run so
 * `getMicrositeLedQrMode()` matches server (reads `MICROSITE_LED_QR_MODE` at
 * build which is not available in the client JS bundle otherwise).
 */
export function MicrositeLedQrModeBootstrap() {
  const raw =
    process.env.NEXT_PUBLIC_MICROSITE_LED_QR_MODE?.trim() ||
    process.env.MICROSITE_LED_QR_MODE?.trim() ||
    "dynamic";
  const mode = raw.toLowerCase() === "static" ? "static" : "dynamic";
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__CLEAR_MS_LED_QR_MODE=${JSON.stringify(mode)};`,
      }}
    />
  );
}
