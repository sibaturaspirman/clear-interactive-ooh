import { isCityvisionLedLocation } from "@/lib/led/led-vendors";

/**
 * Intro 4s → live 9s → outro 4s — all sequence-loop LED sites.
 * Live fill: 0 items → dummy 9s; 1 → 9s; 2 → 4.5s×2; 3+ → 3s×3.
 */
export const LED_SEQUENCE = {
  introMs: 4000,
  liveMs: 9000,
  outroMs: 4000,
  submissionMs: 3000,
  slotMs: 17000,
} as const;

export const LED_OUTRO_FADE_IN_MS = 800;
export const LED_SEQUENCE_STATIC_DURATION_MS = LED_SEQUENCE.introMs;
export const LED_SEQUENCE_STATIC_FADE_OUT_MS = 700;
export const LED_SEQUENCE_PACK_SWAP_GAP_MS = 100;
export const LED_SEQUENCE_LIVE_START_AT_MS =
  LED_SEQUENCE_STATIC_DURATION_MS + LED_SEQUENCE_PACK_SWAP_GAP_MS;

const MIB_ONLY_CODES = new Set(["sency", "gbk"]);

export function isMibLedSequenceCode(code: string): boolean {
  return MIB_ONLY_CODES.has(code);
}

/** MIB + Cityvision interactive / Broadsign loop. */
export function isLedSequenceLoopCode(code: string): boolean {
  return isMibLedSequenceCode(code) || isCityvisionLedLocation(code);
}

/** Per-item hold during the 9s live segment from buffered submission count. */
export function liveSegmentPlayMsForSlotCount(slotCount: number): number {
  const liveMs = LED_SEQUENCE.liveMs;
  const slots = Math.max(1, Math.min(3, slotCount));
  if (slots === 1) return liveMs;
  if (slots === 2) return liveMs / 2;
  return LED_SEQUENCE.submissionMs;
}

/** Slots to play this live segment (0 API items → 1 dummy slot). */
export function liveSegmentSlotCount(
  upcomingLen: number,
  hasCurrent: boolean,
): number {
  const queued = upcomingLen + (hasCurrent ? 1 : 0);
  return queued === 0 ? 1 : Math.min(3, queued);
}
