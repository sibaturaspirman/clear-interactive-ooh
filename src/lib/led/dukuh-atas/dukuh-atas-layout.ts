import { LED_CANVAS_BY_CODE } from "@/lib/led/location-specs";

/** Dukuh Atas LED canvas — matches `dukuh-atas-bg.jpg` (4096×295). */
export const DUKUH_ATAS_CANVAS = LED_CANVAS_BY_CODE["dukuh-atas"];

export const DUKUH_ATAS_STATIC_DURATION_MS = 5000;
/** Live filler when API queue is empty — same hold as intro static. */
export const DUKUH_ATAS_DUMMY_PLAY_MS = DUKUH_ATAS_STATIC_DURATION_MS;
export const DUKUH_ATAS_STATIC_FADE_IN_MS = 800;
export const DUKUH_ATAS_STATIC_FADE_OUT_MS = 700;
/** Brief bg-only beat after intro exit before live pack enters. */
export const DUKUH_ATAS_PACK_SWAP_GAP_MS = 100;
/** Gap after intro fade-out before live mounts (avoids talent double-image). */
export const DUKUH_ATAS_LIVE_HANDOFF_MS = 250;

/** Wall-clock from intro `staticExiting` until live may show (exit + gap). */
export const DUKUH_ATAS_PACK_LIVE_ENTER_DELAY_MS =
  DUKUH_ATAS_STATIC_FADE_OUT_MS + DUKUH_ATAS_PACK_SWAP_GAP_MS;

/** When `startBeiLiveQueue` runs relative to intro t=0. */
export const DUKUH_ATAS_LIVE_START_AT_MS =
  DUKUH_ATAS_STATIC_DURATION_MS + DUKUH_ATAS_PACK_SWAP_GAP_MS;
/** Slow zoom on intro talent — matches intro hold time. */
export const DUKUH_ATAS_STATIC_TALENT_ZOOM_MS = DUKUH_ATAS_STATIC_DURATION_MS;

/** Live layout motion (not tied to generic LED chrome / player.js). */
export const DUKUH_ATAS_LIVE_ENTER_MS = 900;
export const DUKUH_ATAS_LIVE_STAGGER_MS = 140;
/** Horizontal slide for pack / tagline enter & pack handoff. */
export const DUKUH_ATAS_LIVE_SLIDE_OFFSET_PX = 72;
export const DUKUH_ATAS_LIVE_LAYER_FADE_MS = 550;
/** Gentle vertical bob on live pack group (one full up→down cycle). */
export const DUKUH_ATAS_LIVE_PACK_FLOAT_CYCLE_MS = 5600;
/** Wait for pack layer enter before bob starts. */
export const DUKUH_ATAS_LIVE_PACK_FLOAT_DELAY_MS = DUKUH_ATAS_LIVE_ENTER_MS;
/** @deprecated use `DUKUH_ATAS_STATIC_FADE_OUT_MS` — live exit matches intro. */
export const DUKUH_ATAS_LIVE_TALENT_FADE_OUT_MS = DUKUH_ATAS_STATIC_FADE_OUT_MS;

/** Live talent — subtle Ken Burns (not intro-scale punch). */
export const DUKUH_ATAS_LIVE_TALENT_ZOOM_FROM = 0.985;
export const DUKUH_ATAS_LIVE_TALENT_ZOOM_TO = 1;
export const DUKUH_ATAS_LIVE_TALENT_FADE_IN_MS = 1000;
export const DUKUH_ATAS_LIVE_TALENT_ZOOM_MIN_MS = 2400;

export function dukuhAtasLiveTalentZoomMs(playMs: number): number {
  const holdMs = playMs - DUKUH_ATAS_STATIC_FADE_OUT_MS;
  return Math.max(DUKUH_ATAS_LIVE_TALENT_ZOOM_MIN_MS, holdMs);
}

export const DUKUH_ATAS_ASSETS = {
  background: "/images/led/dukuh-atas-bg.jpg",
  clear: "/images/led/dukuh-atas-clear.png",
  packGroup: "/images/led/dukuh-atas-clear-pack-group.png",
  pack: "/images/led/dukuh-atas-clear-pack.png",
  talent: "/images/led/dukuh-atas-talent.png",
  /** Empty-queue filler + `?debug=live` relayout placeholder. */
  layoutTalentDummy: "/images/led/talent-dummy.png",
  tagline: "/images/led/dukuh-atas-tagline.png",
  text: "/images/led/dukuh-atas-text.png",
  qrFrame: "/images/led/dukuh-atas-qr-frame.png",
  /** Pre-rendered QR → `{origin}/microsite/dukuh-atas` (see `npm run led:dukuh-atas-qr`). */
  qrCode: "/images/led/dukuh-atas-qr.png",
} as const;

/** Shared across static intro and live (same bg + dual Clear logos). */
export const DUKUH_ATAS_LAYOUT_SHARED = {
  clearLeft: { left: 184, top: 25, width: 654, height: 243 },
  clearRight: {
    left: 3158,
    top: 25,
    width: 654,
    height: 243,
  },
} as const;

/** Figma BEI 1 (13:127) — intro static, no QR. */
export const DUKUH_ATAS_LAYOUT_STATIC = {
  pack: { left: 941, top: 0, width: 162, height: 304 },
  talent: { left: 2406, top: 4, width: 532, height: 292 },
  text: { left: 1237, top: 60, width: 1731, height: 195 },
} as const;

/** Figma BEI 2 (13:150) — idle QR + queue playback (talent from API). */
export const DUKUH_ATAS_LAYOUT_LIVE = {
  /** Live only — relayout via `/led/dukuh-atas?debug=live` (bukan intro `DUKUH_ATAS_LAYOUT_STATIC.pack`). */
  packGroup: { left: 823, top: 0, width: 449, height: 304 },
  talent: { left: 1411, top: 0, width: 300, height: 300 },
  tagline: { left: 1903, top: 17, width: 538, height: 262 },
  qrFrame: { left: 2644, top: 16, width: 280, height: 271 },
  qrInset: { left: 0.23, top: 0.357, width: 0.545, height: 0.562 },
} as const;

/** @deprecated use DUKUH_ATAS_LAYOUT_STATIC / DUKUH_ATAS_LAYOUT_LIVE */
export const DUKUH_ATAS_LAYOUT = {
  clearLeft: DUKUH_ATAS_LAYOUT_SHARED.clearLeft,
  clearRight: DUKUH_ATAS_LAYOUT_SHARED.clearRight,
  packGroup: DUKUH_ATAS_LAYOUT_LIVE.packGroup,
  talent: DUKUH_ATAS_LAYOUT_LIVE.talent,
  tagline: DUKUH_ATAS_LAYOUT_LIVE.tagline,
  text: DUKUH_ATAS_LAYOUT_STATIC.text,
  qrFrame: DUKUH_ATAS_LAYOUT_LIVE.qrFrame,
  qrInset: DUKUH_ATAS_LAYOUT_LIVE.qrInset,
} as const;
