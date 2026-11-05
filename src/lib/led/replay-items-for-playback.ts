import type { LedQueueItem } from "@/lib/led/led-queue-types";
import { LED_SEQUENCE } from "@/lib/led/led-sequence-loop";

/** Max submission slots in one 9s live segment (MIB + Cityvision loop). */
export const LED_SEQUENCE_LIVE_SUBMISSION_SLOTS = Math.ceil(
  LED_SEQUENCE.liveMs / LED_SEQUENCE.submissionMs,
);

/**
 * Normalize replay payloads: newest `queue_id` first.
 * Sequence-loop sites only play 3 submissions per live window — keep the 3 newest.
 */
export function replayItemsForPlayback(
  items: LedQueueItem[],
  sequenceLoopMode: boolean,
): LedQueueItem[] {
  const sorted = [...items].sort((a, b) => b.queue_id - a.queue_id);
  if (!sequenceLoopMode) return sorted;
  return sorted.slice(0, LED_SEQUENCE_LIVE_SUBMISSION_SLOTS);
}
