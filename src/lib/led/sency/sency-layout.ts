import { LED_CANVAS_BY_CODE } from "@/lib/led/location-specs";

/** BEI LED canvas — matches `bei-bg.jpg`. */
export const SENCY_CANVAS = LED_CANVAS_BY_CODE["sency"];

export const SENCY_STATIC_DURATION_MS = 5000;
/** Live filler when API queue is empty — same hold as intro static. */
export const SENCY_DUMMY_PLAY_MS = SENCY_STATIC_DURATION_MS;
export const SENCY_STATIC_FADE_IN_MS = 800;
export const SENCY_STATIC_FADE_OUT_MS = 700;
/** Brief bg-only beat after intro exit before live pack enters. */
export const SENCY_PACK_SWAP_GAP_MS = 100;
/** Gap after intro fade-out before live mounts (avoids talent double-image). */
export const SENCY_LIVE_HANDOFF_MS = 250;

/** Wall-clock from intro `staticExiting` until live may show (exit + gap). */
export const SENCY_PACK_LIVE_ENTER_DELAY_MS =
  SENCY_STATIC_FADE_OUT_MS + SENCY_PACK_SWAP_GAP_MS;

/** When `startBeiLiveQueue` runs relative to intro t=0. */
export const SENCY_LIVE_START_AT_MS =
  SENCY_STATIC_DURATION_MS + SENCY_PACK_SWAP_GAP_MS;
/** Slow zoom on intro talent — matches intro hold time. */
export const SENCY_STATIC_TALENT_ZOOM_MS = SENCY_STATIC_DURATION_MS;

/** Live layout motion (not tied to generic LED chrome / player.js). */
export const SENCY_LIVE_ENTER_MS = 900;
export const SENCY_LIVE_STAGGER_MS = 140;
/** Horizontal slide for pack / tagline enter & pack handoff. */
export const SENCY_LIVE_SLIDE_OFFSET_PX = 72;
export const SENCY_LIVE_LAYER_FADE_MS = 550;
/** Gentle vertical bob on live pack group (one full up→down cycle). */
export const SENCY_LIVE_PACK_FLOAT_CYCLE_MS = 5600;
/** Wait for pack layer enter before bob starts. */
export const SENCY_LIVE_PACK_FLOAT_DELAY_MS = SENCY_LIVE_ENTER_MS;
/** @deprecated use `SENCY_STATIC_FADE_OUT_MS` — live exit matches intro. */
export const SENCY_LIVE_TALENT_FADE_OUT_MS = SENCY_STATIC_FADE_OUT_MS;

/** Live talent — subtle Ken Burns (not intro-scale punch). */
export const SENCY_LIVE_TALENT_ZOOM_FROM = 0.985;
export const SENCY_LIVE_TALENT_ZOOM_TO = 1;
export const SENCY_LIVE_TALENT_FADE_IN_MS = 1000;
export const SENCY_LIVE_TALENT_ZOOM_MIN_MS = 2400;

export function sencyLiveTalentZoomMs(playMs: number): number {
  const holdMs = playMs - SENCY_STATIC_FADE_OUT_MS;
  return Math.max(SENCY_LIVE_TALENT_ZOOM_MIN_MS, holdMs);
}

export const SENCY_ASSETS = {
  background: "/images/led/bei-bg.jpg",
  clear: "/images/led/bei-clear.png",
  packGroup: "/images/led/bei-clear-pack-group.png",
  pack: "/images/led/bei-clear-pack.png",
  talent: "/images/led/bei-talent.png",
  /** Empty-queue filler + `?debug=live` relayout placeholder. */
  layoutTalentDummy: "/images/led/talent-dummy.png",
  tagline: "/images/led/bei-tagline.png",
  text: "/images/led/bei-text.png",
  qrFrame: "/images/led/bei-qr-frame.png",
  /** Pre-rendered QR → `{origin}/microsite/bei` (see `npm run led:bei-qr`). */
  qrCode: "/images/led/bei-qr.png",
} as const;

/** Shared across static intro and live (same bg + clear placement). */
export const SENCY_LAYOUT_SHARED = {
  clear: { left: 184, top: 94, width: 704, height: 261 },
} as const;

/** Figma BEI 1 (13:127) — intro static, no QR. */
export const SENCY_LAYOUT_STATIC = {
  clear: SENCY_LAYOUT_SHARED.clear,
  pack: { left: 184, top: 47, width: 1176, height: 1473 },
  talent: { left: 1444, top: 106, width: 2396, height: 1430 },
  text: { left: 881, top: 1117, width: 2563, height: 419 },
} as const;

/** Figma BEI 2 (13:150) — idle QR + queue playback (talent from API). */
export const SENCY_LAYOUT_LIVE = {
  clear: SENCY_LAYOUT_SHARED.clear,
  /** Live only — relayout via `/led/bei?debug=live` (bukan intro `SENCY_LAYOUT_STATIC.pack`). */
  packGroup: { left: 0, top: 384, width: 1065, height: 1124 },
  talent: { left: 960, top: 20, width: 1511, height: 1511 },
  tagline: { left: 2351, top: 71, width: 1162, height: 569 },
  qrFrame: { left: 2594, top: 668, width: 820, height: 795 },
  qrInset: { left: 0.23, top: 0.357, width: 0.545, height: 0.562 },
} as const;

/** @deprecated use SENCY_LAYOUT_STATIC / SENCY_LAYOUT_LIVE */
export const SENCY_LAYOUT = {
  clear: SENCY_LAYOUT_LIVE.clear,
  packGroup: SENCY_LAYOUT_LIVE.packGroup,
  talent: SENCY_LAYOUT_LIVE.talent,
  tagline: SENCY_LAYOUT_LIVE.tagline,
  text: SENCY_LAYOUT_STATIC.text,
  qrFrame: SENCY_LAYOUT_LIVE.qrFrame,
  qrInset: SENCY_LAYOUT_LIVE.qrInset,
} as const;
