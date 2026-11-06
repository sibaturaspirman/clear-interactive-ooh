"use client";

import { useEffect, useState, type ReactNode } from "react";

import { InteractiveLedPlayerShell } from "@/components/led/InteractiveLedPlayerShell";
import {
  LED_DEBUG_PARTICIPANT_NAME,
  type LedDebugOptions,
} from "@/lib/led/debug";
import {
  LED_DUMMY_ROTATION,
  LED_DUMMY_SLOT_MS,
  isLedDummyQueueId,
} from "@/lib/led/led-dummy";
import { useInteractiveLedPlayer } from "@/lib/led/useInteractiveLedPlayer";
import { getLedCanvas } from "@/lib/led/location-specs";

export type InteractiveLedPlaybackPhase = "static" | "live" | "outro";

export type InteractiveLedScreenProps = {
  /** Location code — drives dynamic microsite QR (`?w=`). */
  locationCode: string;
  phase: InteractiveLedPlaybackPhase;
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
  /** Relayout / debug — hold participant name on screen without queue-driven fade. */
  nameLayoutDebug?: boolean;
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

  const showLiveQueueUi =
    !queue.holdLiveLayout && queue.liveReady && queue.phase === "live";

  /** Socket down — queue `render()` may lag one frame; don't strip dummy faces or block fade. */
  const networkDown =
    queue.connectionStatus === "reconnecting" ||
    queue.connectionStatus === "error";

  /** Row from queue (incl. dummy -1..-3). Do not require `!ui.idle` — it can be true briefly while `current` exists. */
  const hasQueueRow =
    Boolean(queue.ui.playbackUrl?.trim()) &&
    queue.ui.playbackQueueId != null;

  const hasLiveTalentPlayback = showLiveQueueUi && hasQueueRow;

  /** Offline / error before `render` fills UI — still drive `*TalentCrossfade` as submission so fade-in runs. */
  const useOfflineDummyFallback =
    showLiveQueueUi && networkDown && !hasQueueRow;

  const [offlineDummyIndex, setOfflineDummyIndex] = useState(0);

  useEffect(() => {
    if (!useOfflineDummyFallback) {
      setOfflineDummyIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setOfflineDummyIndex((i) => (i + 1) % LED_DUMMY_ROTATION.length);
    }, LED_DUMMY_SLOT_MS);
    return () => clearInterval(id);
  }, [useOfflineDummyFallback]);

  const offlineDummy = LED_DUMMY_ROTATION[offlineDummyIndex]!;

  const photoUrl = hasLiveTalentPlayback
    ? queue.ui.playbackUrl
    : useOfflineDummyFallback
      ? offlineDummy.assetPath
      : "";

  const participantName = queue.holdLiveLayout
    ? LED_DEBUG_PARTICIPANT_NAME
    : hasLiveTalentPlayback
      ? queue.ui.nama
      : useOfflineDummyFallback
        ? offlineDummy.displayName
        : undefined;

  const playbackQueueIdForUi = hasLiveTalentPlayback
    ? queue.ui.playbackQueueId
    : useOfflineDummyFallback
      ? offlineDummy.queueId
      : null;

  /**
   * Each dummy face uses 3s (`LED_DUMMY_SLOT_MS`). `queue.ui.playMs` can lag at API default after a real submission.
   */
  const playMsForUi = isLedDummyQueueId(playbackQueueIdForUi)
    ? LED_DUMMY_SLOT_MS
    : queue.ui.playMs;

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
        locationCode: code,
        phase: queue.phase,
        disableAnimations,
        debugActive,
        holdStatic: queue.holdStatic,
        holdLiveLayout: queue.holdLiveLayout,
        idleTalentSrc: queue.holdLiveLayout
          ? layoutTalentDummy
          : dummyTalentUrl,
        staticExiting: queue.staticExiting,
        introCycleKey: queue.introCycleKey,
        liveReady: queue.liveReady,
        photoUrl: photoUrl || undefined,
        participantName,
        playbackQueueId: playbackQueueIdForUi,
        playMs: playMsForUi,
        showQr: true,
      })}
    </InteractiveLedPlayerShell>
  );
}
