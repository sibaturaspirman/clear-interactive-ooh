"use client";

import type { ReactNode } from "react";

import { InteractiveLedPlayerShell } from "@/components/led/InteractiveLedPlayerShell";
import {
  LED_DEBUG_PARTICIPANT_NAME,
  type LedDebugOptions,
} from "@/lib/led/debug";
import { useInteractiveLedPlayer } from "@/lib/led/useInteractiveLedPlayer";
import { getLedCanvas } from "@/lib/led/location-specs";

export type InteractiveLedScreenProps = {
  phase: "static" | "live";
  disableAnimations?: boolean;
  debugActive?: boolean;
  holdStatic?: boolean;
  staticExiting?: boolean;
  introCycleKey?: number;
  liveReady?: boolean;
  photoUrl?: string;
  participantName?: string;
  playbackQueueId?: number | null;
  playMs?: number;
  showQr?: boolean;
  holdLiveLayout?: boolean;
  idleTalentSrc?: string;
};

type InteractiveLedPlayerFrameProps = {
  code: string;
  apiBaseUrl: string;
  ledKey: string;
  locationName: string;
  ledDebug?: LedDebugOptions;
  dummyTalentUrl: string;
  stageClassName: string;
  layoutTalentDummy: string;
  renderScreen: (props: InteractiveLedScreenProps) => ReactNode;
};

export function InteractiveLedPlayerFrame({
  code,
  apiBaseUrl,
  ledKey,
  locationName,
  ledDebug,
  dummyTalentUrl,
  stageClassName,
  layoutTalentDummy,
  renderScreen,
}: InteractiveLedPlayerFrameProps) {
  const { queue, cityvision, motionEnabled } = useInteractiveLedPlayer({
    code,
    apiBaseUrl,
    ledKey,
    locationName,
    dummyTalentUrl,
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

  const disableAnimations =
    !motionEnabled || Boolean(ledDebug?.disableAnimations);

  const debugActive =
    Boolean(ledDebug?.disableAnimations) ||
    Boolean(ledDebug?.skipIntro) ||
    Boolean(ledDebug?.holdStatic) ||
    Boolean(ledDebug?.holdLiveLayout);

  return (
    <InteractiveLedPlayerShell
      canvas={getLedCanvas(code)}
      stageClassName={stageClassName}
      connectionStatus={queue.connectionStatus}
      cityvision={cityvision}
    >
      {renderScreen({
        phase: queue.phase,
        disableAnimations,
        debugActive,
        holdStatic: queue.holdStatic,
        holdLiveLayout: queue.holdLiveLayout,
        idleTalentSrc: queue.holdLiveLayout ? layoutTalentDummy : undefined,
        staticExiting: queue.staticExiting,
        introCycleKey: queue.introCycleKey,
        liveReady: queue.liveReady,
        photoUrl: photoUrl || undefined,
        participantName,
        playbackQueueId: queue.ui.playbackQueueId,
        playMs: queue.ui.playMs,
        showQr: true,
      })}
    </InteractiveLedPlayerShell>
  );
}
