import { ledStaticImage } from "@/lib/led/led-static-image";
import { participantNameSlot } from "@/lib/led/participant-name-layout";
import { LED_CANVAS_BY_CODE } from "@/lib/led/location-specs";

/** Sudirman LED canvas — matches `sudirman-bg.jpg` (4200×1200). */
export const SUDIRMAN_CANVAS = LED_CANVAS_BY_CODE.sudirman;

export const SUDIRMAN_STATIC_DURATION_MS = 4000;
/** Live filler when API queue is empty (legacy). */
export const SUDIRMAN_DUMMY_PLAY_MS = 5000;
export const SUDIRMAN_STATIC_FADE_IN_MS = 800;
export const SUDIRMAN_STATIC_FADE_OUT_MS = 700;
/** Brief bg-only beat after intro exit before live pack enters. */
export const SUDIRMAN_PACK_SWAP_GAP_MS = 100;
/** Gap after intro fade-out before live mounts (avoids talent double-image). */
export const SUDIRMAN_LIVE_HANDOFF_MS = 250;

/** Wall-clock from intro `staticExiting` until live may show (exit + gap). */
export const SUDIRMAN_PACK_LIVE_ENTER_DELAY_MS =
  SUDIRMAN_STATIC_FADE_OUT_MS + SUDIRMAN_PACK_SWAP_GAP_MS;

/** When `startBeiLiveQueue` runs relative to intro t=0. */
export const SUDIRMAN_LIVE_START_AT_MS =
  SUDIRMAN_STATIC_DURATION_MS + SUDIRMAN_PACK_SWAP_GAP_MS;
/** Slow zoom on intro talent — matches intro hold time. */
export const SUDIRMAN_STATIC_TALENT_ZOOM_MS = SUDIRMAN_STATIC_DURATION_MS;

/** Live layout motion (not tied to generic LED chrome / player.js). */
export const SUDIRMAN_LIVE_ENTER_MS = 900;
export const SUDIRMAN_LIVE_STAGGER_MS = 140;
/** Horizontal slide for pack / tagline enter & pack handoff. */
export const SUDIRMAN_LIVE_SLIDE_OFFSET_PX = 72;
export const SUDIRMAN_LIVE_LAYER_FADE_MS = 550;
/** Gentle vertical bob on live pack group (one full up→down cycle). */
export const SUDIRMAN_LIVE_PACK_FLOAT_CYCLE_MS = 5600;
/** Wait for pack layer enter before bob starts. */
export const SUDIRMAN_LIVE_PACK_FLOAT_DELAY_MS = SUDIRMAN_LIVE_ENTER_MS;
/** @deprecated use `SUDIRMAN_STATIC_FADE_OUT_MS` — live exit matches intro. */
export const SUDIRMAN_LIVE_TALENT_FADE_OUT_MS = SUDIRMAN_STATIC_FADE_OUT_MS;

/** Live talent — subtle Ken Burns (not intro-scale punch). */
export const SUDIRMAN_LIVE_TALENT_ZOOM_FROM = 0.985;
export const SUDIRMAN_LIVE_TALENT_ZOOM_TO = 1;
export const SUDIRMAN_LIVE_TALENT_FADE_IN_MS = 1000;
export const SUDIRMAN_LIVE_TALENT_ZOOM_MIN_MS = 2400;

export function sudirmanLiveTalentZoomMs(playMs: number): number {
  const holdMs = playMs - SUDIRMAN_STATIC_FADE_OUT_MS;
  return Math.max(SUDIRMAN_LIVE_TALENT_ZOOM_MIN_MS, holdMs);
}

export const SUDIRMAN_ASSETS = {
  background: "/images/led/sudirman-bg.jpg",
  /** Intro static — relayout via `?debug=static`. */
  clearStatic: "/images/led/sudirman-clear-static.png",
  /** Live / QR — relayout via `?debug=live`. */
  clearLive: "/images/led/sudirman-clear-live.png",
  packGroup: "/images/led/sudirman-clear-pack-group.png",
  pack: "/images/led/sudirman-clear-pack.png",
  talent: "/images/led/sudirman-talent.png",
  /** Empty-queue filler + `?debug=live` relayout placeholder. */
  layoutTalentDummy: "/images/led/talent-dummy.png",
  tagline: ledStaticImage("/images/led/sudirman-tagline.png"),
  text: "/images/led/sudirman-text.png",
  qrFrame: "/images/led/sudirman-qr-frame.png",
  /** Pre-rendered QR → `{origin}/microsite/sudirman` (see `npm run led:sudirman-qr`). */
  qrCode: ledStaticImage("/images/led/sudirman-qr.png"),
  end: "/images/led/sudirman-end.jpg",
} as const;

/** Intro static — relayout via `?debug=static`. */
export const SUDIRMAN_LAYOUT_STATIC = {
  clear: { left: 288, top: 70, width: 574, height: 213 },
  pack: { left: 341, top: 316, width: 433, height: 851 },
  talent: { left: 1968, top: 56, width: 2203, height: 1144 },
  text: { left: 965, top: 758, width: 2812, height: 356 },
} as const;

/** Live + QR — relayout via `/led/sudirman?debug=live`. */
export const SUDIRMAN_LAYOUT_LIVE = {
  clear: { left: 354, top: 66, width: 491, height: 208 },
  packGroup: { left: 64, top: 242, width: 1078, height: 1051 },
  talent: { left: 939, top: 21, width: 1179, height: 1179 },
  tagline: { left: 1856, top: 333, width: 1434, height: 614 },
  participantName: participantNameSlot({
    left: 1924,
    top: 490,
    width: 774,
    height: 80,
    fontSize: 157,
    rotate: -6,
  }),
  qrFrame: { left: 3242, top: 309, width: 701, height: 680 },
  qrInset: { left: 0.23, top: 0.357, width: 0.545, height: 0.562 },
} as const;

/** @deprecated use SUDIRMAN_LAYOUT_STATIC / SUDIRMAN_LAYOUT_LIVE */
export const SUDIRMAN_LAYOUT = {
  clear: SUDIRMAN_LAYOUT_LIVE.clear,
  packGroup: SUDIRMAN_LAYOUT_LIVE.packGroup,
  talent: SUDIRMAN_LAYOUT_LIVE.talent,
  tagline: SUDIRMAN_LAYOUT_LIVE.tagline,
  text: SUDIRMAN_LAYOUT_STATIC.text,
  qrFrame: SUDIRMAN_LAYOUT_LIVE.qrFrame,
  qrInset: SUDIRMAN_LAYOUT_LIVE.qrInset,
} as const;
