"use client";

import { LedDukuhAtasScreen } from "@/components/led/dukuh-atas/LedDukuhAtasScreen";
import { DUKUH_ATAS_ASSETS } from "@/lib/led/dukuh-atas/dukuh-atas-layout";
import {
  InteractiveLedPlayerFrame,
  type InteractiveLedScreenProps,
} from "@/components/led/interactive-led-player-shared";

export type LedLocationPlayerProps = {
  code: string;
  apiBaseUrl: string;
  ledKey: string;
  locationName: string;
  micrositeUrl: string;
  ledDebug?: import("@/lib/led/debug").LedDebugOptions;
};

export function LedDukuhAtasPlayer(props: LedLocationPlayerProps) {
  return (
    <InteractiveLedPlayerFrame
      code={props.code}
      apiBaseUrl={props.apiBaseUrl}
      ledKey={props.ledKey}
      locationName={props.locationName}
      ledDebug={props.ledDebug}
      dummyTalentUrl={DUKUH_ATAS_ASSETS.layoutTalentDummy}
      layoutTalentDummy={DUKUH_ATAS_ASSETS.layoutTalentDummy}
      stageClassName="led-player-stage--dukuh-atas"
      renderScreen={(screen: InteractiveLedScreenProps) => (
        <LedDukuhAtasScreen {...screen} />
      )}
    />
  );
}
