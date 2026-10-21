"use client";

import { InteractiveLedPlayerShell } from "@/components/led/InteractiveLedPlayerShell";
import { LedGbkScreen } from "@/components/led/gbk/LedGbkScreen";
import { GBK_ASSETS } from "@/lib/led/gbk/gbk-layout";
import type { LedDebugOptions } from "@/lib/led/debug";
import { useInteractiveLedQueue } from "@/lib/led/useInteractiveLedQueue";
import { getLedCanvas } from "@/lib/led/location-specs";

export type LedLocationPlayerProps = {
  code: string;
  apiBaseUrl: string;
  ledKey: string;
  locationName: string;
  micrositeUrl: string;
  ledDebug?: LedDebugOptions;
};

export function LedGbkPlayer({
  code,
  apiBaseUrl,
  ledKey,
  locationName,
  ledDebug,
}: LedLocationPlayerProps) {
  const queue = useInteractiveLedQueue({
    code,
    apiBaseUrl,
    ledKey,
    locationName,
    dummyTalentUrl: GBK_ASSETS.layoutTalentDummy,
    ledDebug,
  });

  const photoUrl =
    !queue.holdLiveLayout &&
    queue.liveReady &&
    queue.phase === "live" &&
    !queue.ui.idle
      ? queue.ui.playbackUrl
      : "";

  return (
    <InteractiveLedPlayerShell
      canvas={getLedCanvas(code)}
      stageClassName="led-player-stage--gbk"
      connectionStatus={queue.connectionStatus}
    >
      <LedGbkScreen
        phase={queue.phase}
        disableAnimations={ledDebug?.disableAnimations ?? false}
        debugActive={
          Boolean(ledDebug?.disableAnimations) ||
          Boolean(ledDebug?.skipIntro) ||
          Boolean(ledDebug?.holdStatic) ||
          Boolean(ledDebug?.holdLiveLayout)
        }
        holdStatic={queue.holdStatic}
        holdLiveLayout={queue.holdLiveLayout}
        idleTalentSrc={
          queue.holdLiveLayout ? GBK_ASSETS.layoutTalentDummy : undefined
        }
        staticExiting={queue.staticExiting}
        introCycleKey={queue.introCycleKey}
        liveReady={queue.liveReady}
        photoUrl={photoUrl || undefined}
        playbackQueueId={queue.ui.playbackQueueId}
        playMs={queue.ui.playMs}
        showQr
      />
    </InteractiveLedPlayerShell>
  );
}
