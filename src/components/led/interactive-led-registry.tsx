import type { ComponentType } from "react";

import { LedBeiPlayer } from "@/components/led/bei/LedBeiPlayer";
import { LedDukuhAtasPlayer } from "@/components/led/dukuh-atas/LedDukuhAtasPlayer";
import { LedGbkPlayer } from "@/components/led/gbk/LedGbkPlayer";
import { LedRatuPlazaPlayer } from "@/components/led/ratu-plaza/LedRatuPlazaPlayer";
import { LedSencyPlayer } from "@/components/led/sency/LedSencyPlayer";
import type { LedLocationCode } from "@/lib/led/location-specs";

import type { LedLocationPlayerProps } from "@/components/led/bei/LedBeiPlayer";

export const INTERACTIVE_LED_PLAYERS: Record<
  LedLocationCode,
  ComponentType<LedLocationPlayerProps>
> = {
  bei: LedBeiPlayer,
  "dukuh-atas": LedDukuhAtasPlayer,
  gbk: LedGbkPlayer,
  "ratu-plaza": LedRatuPlazaPlayer,
  sency: LedSencyPlayer,
};
