import { LED_CANVAS_BY_CODE } from "@/lib/led/location-specs";

/** GBK LED canvas — matches `gbk-bg.jpg` (1680×840). */
export const GBK_CANVAS = LED_CANVAS_BY_CODE.gbk;

export const GBK_STATIC_DURATION_MS = 5000;
/** Live filler when API queue is empty — same hold as intro static. */
export const GBK_DUMMY_PLAY_MS = GBK_STATIC_DURATION_MS;
export const GBK_STATIC_FADE_IN_MS = 800;
export const GBK_STATIC_FADE_OUT_MS = 700;
/** Brief bg-only beat after intro exit before live pack enters. */
export const GBK_PACK_SWAP_GAP_MS = 100;
/** Gap after intro fade-out before live mounts (avoids talent double-image). */
export const GBK_LIVE_HANDOFF_MS = 250;

/** Wall-clock from intro `staticExiting` until live may show (exit + gap). */
export const GBK_PACK_LIVE_ENTER_DELAY_MS =
  GBK_STATIC_FADE_OUT_MS + GBK_PACK_SWAP_GAP_MS;

/** When `startBeiLiveQueue` runs relative to intro t=0. */
export const GBK_LIVE_START_AT_MS =
  GBK_STATIC_DURATION_MS + GBK_PACK_SWAP_GAP_MS;
/** Slow zoom on intro talent — matches intro hold time. */
export const GBK_STATIC_TALENT_ZOOM_MS = GBK_STATIC_DURATION_MS;

/** Live layout motion (not tied to generic LED chrome / player.js). */
export const GBK_LIVE_ENTER_MS = 900;
export const GBK_LIVE_STAGGER_MS = 140;
/** Horizontal slide for pack / tagline enter & pack handoff. */
export const GBK_LIVE_SLIDE_OFFSET_PX = 72;
export const GBK_LIVE_LAYER_FADE_MS = 550;
/** Gentle vertical bob on live pack group (one full up→down cycle). */
export const GBK_LIVE_PACK_FLOAT_CYCLE_MS = 5600;
/** Wait for pack layer enter before bob starts. */
export const GBK_LIVE_PACK_FLOAT_DELAY_MS = GBK_LIVE_ENTER_MS;
/** @deprecated use `GBK_STATIC_FADE_OUT_MS` — live exit matches intro. */
export const GBK_LIVE_TALENT_FADE_OUT_MS = GBK_STATIC_FADE_OUT_MS;

/** Live talent — subtle Ken Burns (not intro-scale punch). */
export const GBK_LIVE_TALENT_ZOOM_FROM = 0.985;
export const GBK_LIVE_TALENT_ZOOM_TO = 1;
export const GBK_LIVE_TALENT_FADE_IN_MS = 1000;
export const GBK_LIVE_TALENT_ZOOM_MIN_MS = 2400;

export function gbkLiveTalentZoomMs(playMs: number): number {
  const holdMs = playMs - GBK_STATIC_FADE_OUT_MS;
  return Math.max(GBK_LIVE_TALENT_ZOOM_MIN_MS, holdMs);
}

export const GBK_ASSETS = {
  background: "/images/led/gbk-bg.jpg",
  clear: "/images/led/gbk-clear.png",
  packGroup: "/images/led/gbk-clear-pack-group.png",
  pack: "/images/led/gbk-clear-pack.png",
  talent: "/images/led/gbk-talent.png",
  /** Empty-queue filler + `?debug=live` relayout placeholder. */
  layoutTalentDummy: "/images/led/talent-dummy.png",
  tagline: "/images/led/gbk-tagline.png",
  text: "/images/led/gbk-text.png",
  qrFrame: "/images/led/gbk-qr-frame.png",
  /** Pre-rendered QR → `{origin}/microsite/gbk` (see `npm run led:gbk-qr`). */
  qrCode: "/images/led/gbk-qr.png",
} as const;

/** Shared across static intro and live (same bg + clear placement). */
export const GBK_LAYOUT_SHARED = {
  clear: { left: 39, top: 50, width: 389, height: 144 },
} as const;

/** Figma BEI 1 (13:127) — intro static, no QR. */
export const GBK_LAYOUT_STATIC = {
  clear: GBK_LAYOUT_SHARED.clear,
  pack: { left: 19, top: 263, width: 276, height: 542 },
  talent: { left: 343, top: 58, width: 1337, height: 782 },
  text: { left: 310, top: 653, width: 1135, height: 123 },
} as const;

/** Figma BEI 2 (13:150) — idle QR + queue playback (talent from API). */
export const GBK_LAYOUT_LIVE = {
  clear: GBK_LAYOUT_SHARED.clear,
  /** Live only — relayout via `/led/bei?debug=live` (bukan intro `GBK_LAYOUT_STATIC.pack`). */
  packGroup: { left: 2, top: 236, width: 509, height: 604 },
  talent: { left: 409, top: 76, width: 760, height: 760 },
  tagline: { left: 1028, top: 54, width: 595, height: 290 },
  qrFrame: { left: 1125, top: 375, width: 420, height: 408 },
  qrInset: { left: 0.23, top: 0.357, width: 0.545, height: 0.562 },
} as const;

/** @deprecated use GBK_LAYOUT_STATIC / GBK_LAYOUT_LIVE */
export const GBK_LAYOUT = {
  clear: GBK_LAYOUT_LIVE.clear,
  packGroup: GBK_LAYOUT_LIVE.packGroup,
  talent: GBK_LAYOUT_LIVE.talent,
  tagline: GBK_LAYOUT_LIVE.tagline,
  text: GBK_LAYOUT_STATIC.text,
  qrFrame: GBK_LAYOUT_LIVE.qrFrame,
  qrInset: GBK_LAYOUT_LIVE.qrInset,
} as const;
