"use client";

import { bypassBroadSignForLedDebug } from "@/lib/led/cityvision/broadsign-bypass";
import { useBroadSignPlay } from "@/lib/led/cityvision/useBroadSignPlay";
import { isCityvisionLedLocation } from "@/lib/led/led-vendors";
import {
  useInteractiveLedQueue,
  type UseInteractiveLedQueueParams,
} from "@/lib/led/useInteractiveLedQueue";

export type UseInteractiveLedPlayerParams = UseInteractiveLedQueueParams & {
  code: string;
};

export function useInteractiveLedPlayer({
  code,
  ...queueParams
}: UseInteractiveLedPlayerParams) {
  const cityvision = isCityvisionLedLocation(code);
  const broadSignGate =
    cityvision && !bypassBroadSignForLedDebug(queueParams.ledDebug);
  const { broadSignStarted } = useBroadSignPlay(broadSignGate);
  const playbackEnabled = !broadSignGate || broadSignStarted;

  const queue = useInteractiveLedQueue({
    code,
    ...queueParams,
    cityvisionMode: cityvision,
    playbackEnabled,
  });

  const motionEnabled =
    playbackEnabled && !queue.slotFrozen && !queueParams.ledDebug?.disableAnimations;

  return {
    queue,
    cityvision,
    playbackEnabled,
    motionEnabled,
  };
}
