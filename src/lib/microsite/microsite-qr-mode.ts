/**
 * LED / Broadsign microsite QR source.
 *
 * - `dynamic`: PNG from `/api/microsite/led-qr` (signed `?w=` in URL, rotates).
 * - `static`: pre-rendered asset in `public/images/led/*-qr.png` (same as before dynamic QR).
 *
 * Set at build/deploy time. Client components need the `NEXT_PUBLIC_*` name.
 * Server-only code can use `MICROSITE_LED_QR_MODE` instead.
 */
export type MicrositeLedQrMode = "dynamic" | "static";

type WindowWithQrMode = Window & {
  __CLEAR_MS_LED_QR_MODE?: string;
};

function modeFromRaw(
  raw: string | undefined,
): MicrositeLedQrMode {
  const v = (raw ?? "dynamic").toLowerCase();
  return v === "static" ? "static" : "dynamic";
}

/**
 * Effective mode. In the browser, prefers `window.__CLEAR_MS_LED_QR_MODE`
 * (set by `MicrositeLedQrModeBootstrap` on `/led/*`) so `MICROSITE_LED_QR_MODE`
 * matches server/Broadsign without requiring `NEXT_PUBLIC_*` in the client bundle.
 */
export function getMicrositeLedQrMode(): MicrositeLedQrMode {
  if (typeof window !== "undefined") {
    const w = (window as WindowWithQrMode).__CLEAR_MS_LED_QR_MODE;
    if (w === "static" || w === "dynamic") {
      return w;
    }
  }
  return modeFromRaw(
    process.env.NEXT_PUBLIC_MICROSITE_LED_QR_MODE?.trim() ||
      process.env.MICROSITE_LED_QR_MODE?.trim(),
  );
}

export function isDynamicMicrositeLedQrEnabled(): boolean {
  return getMicrositeLedQrMode() === "dynamic";
}

export function isStaticMicrositeLedQrEnabled(): boolean {
  return getMicrositeLedQrMode() === "static";
}

/** Dynamic QR encodes signed `?w=` → microsite exchange + submit ticket. Static QR does not. */
export function micrositeRequiresSessionFromQrMode(): boolean {
  return isDynamicMicrositeLedQrEnabled();
}
