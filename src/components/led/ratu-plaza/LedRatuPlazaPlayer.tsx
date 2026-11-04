"use client";

import { useEffect } from "react";

import { LedRatuPlazaScreen } from "@/components/led/ratu-plaza/LedRatuPlazaScreen";
import { RATU_PLAZA_ASSETS } from "@/lib/led/ratu-plaza/ratu-plaza-layout";
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

export function LedRatuPlazaPlayer(props: LedLocationPlayerProps) {
  useEffect(() => {
    void preloadLedMediaUrl(RATU_PLAZA_ASSETS.end);
    void preloadLedMediaUrl(RATU_PLAZA_ASSETS.clearLive);
  }, []);

  return (
    <InteractiveLedPlayerFrame
      code={props.code}
      apiBaseUrl={props.apiBaseUrl}
      ledKey={props.ledKey}
      locationName={props.locationName}
      ledDebug={props.ledDebug}
      dummyTalentUrl={RATU_PLAZA_ASSETS.layoutTalentDummy}
      layoutTalentDummy={RATU_PLAZA_ASSETS.layoutTalentDummy}
      stageClassName="led-player-stage--ratu-plaza"
      renderScreen={(screen: InteractiveLedScreenProps) => (
        <LedRatuPlazaScreen {...screen} />
      )}
    />
  );
}
