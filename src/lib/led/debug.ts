/** LED layout/debug helpers (query params on `/led/[code]`). */

function readQueryFlag(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) {
    return false;
  }
  if (raw === "" || raw === "1" || raw === "true") {
    return true;
  }
  return raw !== "0" && raw !== "false";
}

export type LedDebugOptions = {
  /** No static↔live crossfade; talent swaps instantly (no fade). */
  disableAnimations: boolean;
  /** Skip BEI 3s intro — start on live layout (for relayout). */
  skipIntro: boolean;
  /** Stay on BEI static intro; never switch to live/API layout. */
  holdStatic: boolean;
  /** Frozen BEI live layout: no queue playback, dummy talent for relayout. */
  holdLiveLayout: boolean;
};

/** Sample name on `?debug=live` for relayout (`participantName` in `*_LAYOUT_LIVE`). */
export const LED_DEBUG_PARTICIPANT_NAME = "NAMA PESERTA";

const LED_DEBUG_OFF: LedDebugOptions = {
  disableAnimations: false,
  skipIntro: false,
  holdStatic: false,
  holdLiveLayout: false,
};

/**
 * `?debug` — disable animations + skip BEI intro (live layout).
 * `?debug=static` — stay on intro static forever (no live transition).
 * `?debug=live` — frozen live layout, no anim, dummy talent (relayout BEI 2).
 * `?debug=noanim` — animations off only (keep 3s static → live).
 * `?debug=intro` — skip intro only (keep animations).
 */
export function parseLedDebugOptions(
  debugParam: string | string[] | undefined,
): LedDebugOptions {
  const raw = Array.isArray(debugParam) ? debugParam[0] : debugParam;
  if (raw === undefined) {
    return LED_DEBUG_OFF;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === "static" || normalized === "intro-only") {
    return {
      disableAnimations: true,
      skipIntro: false,
      holdStatic: true,
      holdLiveLayout: false,
    };
  }
  if (
    normalized === "live" ||
    normalized === "layout" ||
    normalized === "live-static" ||
    normalized === "livestatic"
  ) {
    return {
      disableAnimations: true,
      skipIntro: true,
      holdStatic: false,
      holdLiveLayout: true,
    };
  }
  if (normalized === "noanim" || normalized === "no-anim") {
    return {
      disableAnimations: true,
      skipIntro: false,
      holdStatic: false,
      holdLiveLayout: false,
    };
  }
  if (normalized === "intro" || normalized === "nointro") {
    return {
      disableAnimations: false,
      skipIntro: true,
      holdStatic: false,
      holdLiveLayout: false,
    };
  }
  if (normalized === "0" || normalized === "false") {
    return LED_DEBUG_OFF;
  }

  const enabled = readQueryFlag(debugParam);
  return {
    disableAnimations: enabled,
    skipIntro: enabled,
    holdStatic: false,
    holdLiveLayout: false,
  };
}
