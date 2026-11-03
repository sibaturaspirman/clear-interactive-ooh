/** MIB LED sites (Sency, GBK, …) — intro 4s → live 9s → outro 4s loop. */
export const MIB_LED_SEQUENCE = {
  introMs: 4000,
  liveMs: 9000,
  outroMs: 4000,
  submissionMs: 3000,
  slotMs: 17000,
} as const;

export const MIB_LED_OUTRO_FADE_IN_MS = 800;
export const MIB_LED_STATIC_DURATION_MS = MIB_LED_SEQUENCE.introMs;
export const MIB_LED_STATIC_FADE_OUT_MS = 700;
export const MIB_LED_PACK_SWAP_GAP_MS = 100;
export const MIB_LED_LIVE_START_AT_MS =
  MIB_LED_STATIC_DURATION_MS + MIB_LED_PACK_SWAP_GAP_MS;

const MIB_SEQUENCE_CODES = new Set(["sency", "gbk"]);

export function isMibLedSequenceCode(code: string): boolean {
  return MIB_SEQUENCE_CODES.has(code);
}
