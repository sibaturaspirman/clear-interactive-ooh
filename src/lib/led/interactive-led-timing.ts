/** Shared intro/live queue timing — all interactive LED locations (layout files stay per site). */

export const INTERACTIVE_LED_STATIC_DURATION_MS = 5000;
export const INTERACTIVE_LED_DUMMY_PLAY_MS = INTERACTIVE_LED_STATIC_DURATION_MS;
export const INTERACTIVE_LED_STATIC_FADE_OUT_MS = 700;
/** Live submission talent / participant name fade-in (matches `*_LIVE_TALENT_FADE_IN_MS`). */
export const INTERACTIVE_LED_LIVE_TALENT_FADE_IN_MS = 1000;
export const INTERACTIVE_LED_PACK_SWAP_GAP_MS = 100;
export const INTERACTIVE_LED_LIVE_START_AT_MS =
  INTERACTIVE_LED_STATIC_DURATION_MS + INTERACTIVE_LED_PACK_SWAP_GAP_MS;
