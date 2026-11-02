"use client";

import { LedSencyScreen } from "@/components/led/sency/LedSencyScreen";
import { SENCY_ASSETS } from "@/lib/led/sency/sency-layout";
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

export function LedSencyPlayer(props: LedLocationPlayerProps) {
  return (
    <InteractiveLedPlayerFrame
      code={props.code}
      apiBaseUrl={props.apiBaseUrl}
      ledKey={props.ledKey}
      locationName={props.locationName}
      ledDebug={props.ledDebug}
      dummyTalentUrl={SENCY_ASSETS.layoutTalentDummy}
      layoutTalentDummy={SENCY_ASSETS.layoutTalentDummy}
      stageClassName="led-player-stage--sency"
      renderScreen={(screen: InteractiveLedScreenProps) => (
        <LedSencyScreen {...screen} />
      )}
    />
  );
}
