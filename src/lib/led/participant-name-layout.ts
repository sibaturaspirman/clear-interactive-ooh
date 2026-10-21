export type LedLayoutBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LedParticipantNameSlot = LedLayoutBox & {
  /** Canvas px — tune per location in `*_LAYOUT_LIVE.participantName`. */
  fontSize: number;
  /** Degrees clockwise. */
  rotate: number;
};

export type ParticipantNameSlotConfig = LedLayoutBox & {
  fontSize: number;
  rotate?: number;
};

/** Explicit box + font + rotate (preferred for `?debug=live` relayout). */
export function participantNameSlot(
  config: ParticipantNameSlotConfig,
): LedParticipantNameSlot {
  return {
    rotate: 0,
    ...config,
  };
}

function defaultFontSizeForHeight(height: number): number {
  return Math.max(14, Math.round(height * 0.52));
}

export function participantNameSlotBox(slot: LedParticipantNameSlot): LedLayoutBox {
  return {
    left: slot.left,
    top: slot.top,
    width: slot.width,
    height: slot.height,
  };
}

/** Optional anchor below tagline — override with `left` / `top` in opts when set. */
export function boxBelowTagline(
  tagline: LedLayoutBox,
  opts?: {
    gap?: number;
    height?: number;
    fontSize?: number;
    left?: number;
    top?: number;
    width?: number;
  },
): LedParticipantNameSlot {
  const gap = opts?.gap ?? 16;
  const height = opts?.height ?? 72;
  const fontSize = opts?.fontSize ?? defaultFontSizeForHeight(height);
  return {
    left: opts?.left ?? tagline.left,
    top: opts?.top ?? tagline.top + tagline.height + gap,
    width: opts?.width ?? tagline.width,
    height,
    fontSize,
    rotate: 0,
  };
}

/** Short canvases — name on lower band of tagline art; optional `left` / `top`. */
export function boxOnTaglineLowerBand(
  tagline: LedLayoutBox,
  bandHeight: number,
  opts?: {
    fontSize?: number;
    left?: number;
    top?: number;
    width?: number;
    rotate?: number;
  },
): LedParticipantNameSlot {
  const fontSize = opts?.fontSize ?? defaultFontSizeForHeight(bandHeight);
  return {
    left: opts?.left ?? tagline.left,
    top: opts?.top ?? tagline.top + tagline.height - bandHeight,
    width: opts?.width ?? tagline.width,
    height: bandHeight,
    fontSize,
    rotate: opts?.rotate ?? 0,
  };
}
