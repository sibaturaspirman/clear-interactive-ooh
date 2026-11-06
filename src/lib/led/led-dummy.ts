import { LED_SEQUENCE } from "@/lib/led/led-sequence-loop";

/** One slot per face in the empty-queue filler (matches `submissionPlayMs` / Broadsign). */
export const LED_DUMMY_SLOT_MS = LED_SEQUENCE.submissionMs;

export type LedDummyRotationEntry = {
  /** Synthetic queue id (negative, never collides with API). */
  queueId: number;
  /** First word on LED name strip. */
  displayName: string;
  /** Same-origin path under /public. */
  assetPath: string;
};

/** Natasha → Fado → Dimas — 3s each, 9s total per live segment when queue is empty. */
export const LED_DUMMY_ROTATION: readonly LedDummyRotationEntry[] = [
  {
    queueId: -1,
    displayName: "Natasha",
    assetPath: "/images/led/talent-dummy-new-1.png",
  },
  {
    queueId: -2,
    displayName: "Fado",
    assetPath: "/images/led/talent-dummy-new-2.png",
  },
  {
    queueId: -3,
    displayName: "Dimas",
    assetPath: "/images/led/talent-dummy-new-3.png",
  },
] as const;

/** `?debug=live` / static-layer placeholder — first dummy face. */
export const LED_LAYOUT_TALENT_DUMMY_URL = LED_DUMMY_ROTATION[0]!.assetPath;

export const LED_DUMMY_QUEUE_IDS = LED_DUMMY_ROTATION.map((e) => e.queueId);

/** @deprecated use `LED_DUMMY_ROTATION[0].queueId` */
export const LED_DUMMY_QUEUE_ID = LED_DUMMY_ROTATION[0]!.queueId;

export function isLedDummyQueueId(queueId: number | null | undefined): boolean {
  if (queueId == null) return false;
  return LED_DUMMY_QUEUE_IDS.includes(queueId);
}

export function ledDummyRotationEntryForQueueId(
  queueId: number,
): LedDummyRotationEntry | undefined {
  return LED_DUMMY_ROTATION.find((e) => e.queueId === queueId);
}
