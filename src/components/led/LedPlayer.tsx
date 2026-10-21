"use client";

import { INTERACTIVE_LED_PLAYERS } from "@/components/led/interactive-led-registry";
import { isInteractiveLedLocation } from "@/lib/led/interactive-led-locations";
import type { LedDebugOptions } from "@/lib/led/debug";

export type LedPlayerProps = {
  code: string;
  apiBaseUrl: string;
  ledKey: string;
  locationName: string;
  micrositeUrl: string;
  ledDebug?: LedDebugOptions;
};

/** Routes to per-location interactive player (layout duplicated per site, queue logic shared). */
export function LedPlayer(props: LedPlayerProps) {
  if (!isInteractiveLedLocation(props.code)) {
    return null;
  }

  const LocationPlayer = INTERACTIVE_LED_PLAYERS[props.code];
  return <LocationPlayer {...props} />;
}
