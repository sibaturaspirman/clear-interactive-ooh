"use client";

import { useEffect } from "react";

import { LedDukuhAtasScreen } from "@/components/led/dukuh-atas/LedDukuhAtasScreen";
import { DUKUH_ATAS_ASSETS } from "@/lib/led/dukuh-atas/dukuh-atas-layout";
import { preloadLedMediaUrl } from "@/lib/led/preload-led-media";
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
  useEffect(() => {
    void preloadLedMediaUrl(DUKUH_ATAS_ASSETS.end);
    void preloadLedMediaUrl(DUKUH_ATAS_ASSETS.clearLive);
  }, []);

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
