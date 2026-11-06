import { LED_LAYOUT_TALENT_DUMMY_URL } from "@/lib/led/led-dummy";
import { ledStaticImage } from "@/lib/led/led-static-image";
import { participantNameSlot } from "@/lib/led/participant-name-layout";
import { LED_CANVAS_BY_CODE } from "@/lib/led/location-specs";

/** Dukuh Atas LED canvas — matches `dukuh-atas-bg.jpg` (6000×432). */
export const DUKUH_ATAS_CANVAS = LED_CANVAS_BY_CODE["dukuh-atas"];

export const DUKUH_ATAS_STATIC_DURATION_MS = 4000;
/** Live filler when API queue is empty (legacy). */
export const DUKUH_ATAS_DUMMY_PLAY_MS = 5000;
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
export const DUKUH_ATAS_LIVE_SLIDE_OFFSET_PX = 105;
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
  clearLive: "/images/led/dukuh-atas-logo-clear-live.png",
  packGroup: "/images/led/dukuh-atas-clear-pack-group.png",
  pack: "/images/led/dukuh-atas-clear-pack.png",
  talent: "/images/led/dukuh-atas-talent.png",
  /** Empty-queue filler + `?debug=live` relayout placeholder. */
  layoutTalentDummy: LED_LAYOUT_TALENT_DUMMY_URL,
  tagline: ledStaticImage("/images/led/dukuh-atas-tagline.png"),
  text: "/images/led/dukuh-atas-text.png",
  qrFrame: "/images/led/dukuh-atas-qr-frame.png",
  /** Pre-rendered QR → `{origin}/microsite/dukuh-atas` (see `npm run led:dukuh-atas-qr`). */
  qrCode: ledStaticImage("/images/led/dukuh-atas-qr.png"),
  end: "/images/led/dukuh-atas-end.jpg",
} as const;

/** Dual Clear logos — scaled from 4096×295; tune via debug modes. */
export const DUKUH_ATAS_LAYOUT_SHARED = {
  clearLeft: { left: 270, top: 37, width: 958, height: 356 },
  clearRight: { left: 4626, top: 37, width: 958, height: 356 },
} as const;

/** Intro static, no QR. */
export const DUKUH_ATAS_LAYOUT_STATIC = {
  pack: { left: 1378, top: 0, width: 237, height: 445 },
  talent: { left: 3524, top: 6, width: 779, height: 428 },
  text: { left: 1812, top: 88, width: 2536, height: 286 },
} as const;

/** Idle QR + queue playback (talent from API). */
export const DUKUH_ATAS_LAYOUT_LIVE = {
  clearLeft: DUKUH_ATAS_LAYOUT_SHARED.clearLeft,
  clearRight: DUKUH_ATAS_LAYOUT_SHARED.clearRight,
  packGroup: { left: 1206, top: 0, width: 658, height: 445 },
  talent: { left: 2067, top: 0, width: 439, height: 439 },
  tagline: { left: 2788, top: 25, width: 788, height: 384 },
  participantName: participantNameSlot({
    left: 2776,
    top: 85,
    width: 451,
    height: 67,
    fontSize: 92,
    rotate: -6,
  }),
  qrFrame: { left: 3873, top: 23, width: 410, height: 397 },
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
