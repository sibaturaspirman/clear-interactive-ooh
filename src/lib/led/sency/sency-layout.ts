import { ledStaticImage } from "@/lib/led/led-static-image";
import { participantNameSlot } from "@/lib/led/participant-name-layout";
import { LED_CANVAS_BY_CODE } from "@/lib/led/location-specs";

/** Sency LED canvas — matches `sency-bg.jpg` (1200×576). */
export const SENCY_CANVAS = LED_CANVAS_BY_CODE.sency;

/** Intro hold — loop: 4s intro → 9s live → 4s outro. */
export const SENCY_STATIC_DURATION_MS = 4000;
/** Live filler when API queue is empty (non-sequence / legacy). */
export const SENCY_DUMMY_PLAY_MS = 5000;
/** Full loop wall clock for Sency sequence player. */
export const SENCY_SEQUENCE = {
  introMs: 4000,
  liveMs: 9000,
  outroMs: 4000,
  submissionMs: 3000,
  slotMs: 17000,
} as const;
export const SENCY_OUTRO_FADE_IN_MS = 800;
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
export const SENCY_LIVE_SLIDE_OFFSET_PX = 45;
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
  background: "/images/led/sency-bg.jpg",
  clear: "/images/led/sency-clear.png",
  clearLive: "/images/led/sency-logo-clear-live.png",
  end: "/images/led/sency-end.jpg",
  packGroup: "/images/led/sency-clear-pack-group.png",
  pack: "/images/led/sency-clear-pack.png",
  talent: "/images/led/sency-talent.png",
  /** Empty-queue filler + `?debug=live` relayout placeholder. */
  layoutTalentDummy: "/images/led/talent-dummy.png",
  tagline: ledStaticImage("/images/led/sency-tagline.png"),
  text: "/images/led/sency-text.png",
  qrFrame: "/images/led/sency-qr-frame.png",
  /** Pre-rendered QR → `{origin}/microsite/sency` (see `npm run led:sency-qr`). */
  qrCode: ledStaticImage("/images/led/sency-qr.png"),
} as const;

/** Layer boxes scaled from prior 1920×922 — tune via `/led/sency?debug=live`. */
export const SENCY_LAYOUT_SHARED = {
  clear: { left: 29, top: 27, width: 273, height: 98 },
} as const;

/** Intro static, no QR. */
export const SENCY_LAYOUT_STATIC = {
  clear: SENCY_LAYOUT_SHARED.clear,
  pack: { left: 8, top: 149, width: 217, height: 420 },
  talent: { left: 247, top: 30, width: 953, height: 546 },
  text: { left: 216, top: 454, width: 820, height: 86 },
} as const;

/** Idle QR + queue playback (talent from API). */
export const SENCY_LAYOUT_LIVE = {
  clear: SENCY_LAYOUT_SHARED.clear,
  packGroup: { left: 1, top: 146, width: 360, height: 430 },
  talent: { left: 313, top: 37, width: 548, height: 547 },
  tagline: { left: 752, top: 29, width: 412, height: 201 },
  participantName: participantNameSlot({
    left: 744,
    top: 71,
    width: 251,
    height: 35,
    fontSize: 41,
    rotate: -6,
  }),
  qrFrame: { left: 814, top: 244, width: 299, height: 290 },
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
