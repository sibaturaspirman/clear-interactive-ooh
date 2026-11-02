/** Cityvision Broadsign slot (doc §2) — resolution per site unchanged in code. */
export const CITYVISION_SLOT_MS = 15_000;

/** Animation must finish this early before slot end (doc §4.1). */
export const CITYVISION_SLOT_END_BUFFER_MS = 500;

export const CITYVISION_PLAYABLE_MS =
  CITYVISION_SLOT_MS - CITYVISION_SLOT_END_BUFFER_MS;
