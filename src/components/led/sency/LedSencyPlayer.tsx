"use client";

import { InteractiveLedPlayerShell } from "@/components/led/InteractiveLedPlayerShell";
import { LedSencyScreen } from "@/components/led/sency/LedSencyScreen";
import { SENCY_ASSETS } from "@/lib/led/sency/sency-layout";
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

export function LedSencyPlayer({
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
    dummyTalentUrl: SENCY_ASSETS.layoutTalentDummy,
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
      stageClassName="led-player-stage--sency"
      connectionStatus={queue.connectionStatus}
    >
      <LedSencyScreen
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
          queue.holdLiveLayout ? SENCY_ASSETS.layoutTalentDummy : undefined
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
