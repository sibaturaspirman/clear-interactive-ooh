/** Physical LED canvas size per location (px). Each site uses its own asset set. */
export const LED_LOCATION_CODES = [
  "bei",
  "dukuh-atas",
  "gbk",
  "ratu-plaza",
  "sency",
] as const;

export type LedLocationCode = (typeof LED_LOCATION_CODES)[number];

export type LedCanvasSpec = {
  width: number;
  height: number;
};

export const LED_CANVAS_BY_CODE: Record<LedLocationCode, LedCanvasSpec> = {
  bei: { width: 3840, height: 1536 },
  "dukuh-atas": { width: 4096, height: 295 },
  gbk: { width: 1680, height: 840 },
  "ratu-plaza": { width: 4096, height: 1170 },
  sency: { width: 1920, height: 922 },
};

export function isLedLocationCode(code: string): code is LedLocationCode {
  return Object.hasOwn(LED_CANVAS_BY_CODE, code);
}

export function getLedCanvas(code: string): LedCanvasSpec {
  if (isLedLocationCode(code)) {
    return LED_CANVAS_BY_CODE[code];
  }
  return LED_CANVAS_BY_CODE.bei;
}
