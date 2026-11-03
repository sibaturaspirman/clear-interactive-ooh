"use client";

import { useEffect } from "react";

import { LedGbkScreen } from "@/components/led/gbk/LedGbkScreen";
import { GBK_ASSETS } from "@/lib/led/gbk/gbk-layout";
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

export function LedGbkPlayer(props: LedLocationPlayerProps) {
  useEffect(() => {
    void preloadLedMediaUrl(GBK_ASSETS.end);
    void preloadLedMediaUrl(GBK_ASSETS.clearLive);
  }, []);

  return (
    <InteractiveLedPlayerFrame
      code={props.code}
      apiBaseUrl={props.apiBaseUrl}
      ledKey={props.ledKey}
      locationName={props.locationName}
      ledDebug={props.ledDebug}
      dummyTalentUrl={GBK_ASSETS.layoutTalentDummy}
      layoutTalentDummy={GBK_ASSETS.layoutTalentDummy}
      stageClassName="led-player-stage--gbk"
      renderScreen={(screen: InteractiveLedScreenProps) => (
        <LedGbkScreen {...screen} />
      )}
    />
  );
}
