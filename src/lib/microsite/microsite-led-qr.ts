/** Same-origin API — PNG encodes fresh `?w=` for LED displays. */
export function micrositeLedQrImageUrl(code: string): string {
  return `/api/microsite/led-qr?code=${encodeURIComponent(code)}`;
}

/** Refresh before 5-minute window rotation so scan gets a valid `w`. */
export const MICROSITE_LED_QR_REFRESH_MS = 3 * 60 * 1000;
