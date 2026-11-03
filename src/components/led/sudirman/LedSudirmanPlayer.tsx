"use client";

import { useEffect } from "react";

import { LedSudirmanScreen } from "@/components/led/sudirman/LedSudirmanScreen";
import { SUDIRMAN_ASSETS } from "@/lib/led/sudirman/sudirman-layout";
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

export function LedSudirmanPlayer(props: LedLocationPlayerProps) {
  useEffect(() => {
    void preloadLedMediaUrl(SUDIRMAN_ASSETS.end);
  }, []);

  return (
    <InteractiveLedPlayerFrame
      code={props.code}
      apiBaseUrl={props.apiBaseUrl}
      ledKey={props.ledKey}
      locationName={props.locationName}
      ledDebug={props.ledDebug}
      dummyTalentUrl={SUDIRMAN_ASSETS.layoutTalentDummy}
      layoutTalentDummy={SUDIRMAN_ASSETS.layoutTalentDummy}
      stageClassName="led-player-stage--sudirman"
      renderScreen={(screen: InteractiveLedScreenProps) => (
        <LedSudirmanScreen {...screen} />
      )}
    />
  );
}
