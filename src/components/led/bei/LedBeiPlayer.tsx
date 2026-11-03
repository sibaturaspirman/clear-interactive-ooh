"use client";

import { useEffect } from "react";

import { LedBeiScreen } from "@/components/led/bei/LedBeiScreen";
import { BEI_ASSETS } from "@/lib/led/bei/bei-layout";
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

export function LedBeiPlayer(props: LedLocationPlayerProps) {
  useEffect(() => {
    void preloadLedMediaUrl(BEI_ASSETS.end);
  }, []);

  return (
    <InteractiveLedPlayerFrame
      code={props.code}
      apiBaseUrl={props.apiBaseUrl}
      ledKey={props.ledKey}
      locationName={props.locationName}
      ledDebug={props.ledDebug}
      dummyTalentUrl={BEI_ASSETS.layoutTalentDummy}
      layoutTalentDummy={BEI_ASSETS.layoutTalentDummy}
      stageClassName="led-player-stage--bei"
      renderScreen={(screen: InteractiveLedScreenProps) => (
        <LedBeiScreen {...screen} />
      )}
    />
  );
}
