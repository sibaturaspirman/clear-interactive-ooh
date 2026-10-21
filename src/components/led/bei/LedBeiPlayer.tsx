"use client";

import { InteractiveLedPlayerShell } from "@/components/led/InteractiveLedPlayerShell";
import { LedBeiScreen } from "@/components/led/bei/LedBeiScreen";
import { BEI_ASSETS } from "@/lib/led/bei/bei-layout";
import {
  LED_DEBUG_PARTICIPANT_NAME,
  type LedDebugOptions,
} from "@/lib/led/debug";
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

export function LedBeiPlayer({
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
    dummyTalentUrl: BEI_ASSETS.layoutTalentDummy,
    ledDebug,
  });

  const livePlayback =
    !queue.holdLiveLayout &&
    queue.liveReady &&
    queue.phase === "live" &&
    !queue.ui.idle;

  const photoUrl = livePlayback ? queue.ui.playbackUrl : "";
  const participantName = queue.holdLiveLayout
    ? LED_DEBUG_PARTICIPANT_NAME
    : livePlayback && queue.ui.playbackQueueId != null
      ? queue.ui.nama
      : undefined;

  return (
    <InteractiveLedPlayerShell
      canvas={getLedCanvas(code)}
      stageClassName="led-player-stage--bei"
      connectionStatus={queue.connectionStatus}
    >
      <LedBeiScreen
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
          queue.holdLiveLayout ? BEI_ASSETS.layoutTalentDummy : undefined
        }
        staticExiting={queue.staticExiting}
        introCycleKey={queue.introCycleKey}
        liveReady={queue.liveReady}
        photoUrl={photoUrl || undefined}
        participantName={participantName}
        playbackQueueId={queue.ui.playbackQueueId}
        playMs={queue.ui.playMs}
        showQr
      />
    </InteractiveLedPlayerShell>
  );
}
