import type { LedDebugOptions } from "@/lib/led/debug";

/** Layout/debug modes that must run without waiting for BroadSignPlay. */
export function bypassBroadSignForLedDebug(
  ledDebug?: LedDebugOptions,
): boolean {
  if (!ledDebug) {
    return false;
  }
  return ledDebug.holdStatic || ledDebug.holdLiveLayout;
}
