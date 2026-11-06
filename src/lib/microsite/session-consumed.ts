import "server-only";

/** One-time submission tickets (jti) — use Redis in multi-instance production. */
const consumedJti = new Map<string, number>();

/**
 * Successful submits keyed by (location, window id, window issue time).
 * Same `w` (same iat) cannot be exchanged or used again after success.
 */
const windowSubmitConsumed = new Map<string, number>();

/** Windows with an in-flight submit — blocks second tab before Fal runs. */
const windowSubmitInflight = new Map<string, number>();

const PRUNE_EVERY_MS = 60 * 1000;
let lastPrune = 0;

function windowKey(
  locationCode: string,
  windowId: number,
  windowIssuedAt: number,
): string {
  return `${locationCode.toLowerCase()}:${windowId}:${windowIssuedAt}`;
}

function prune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_EVERY_MS) return;
  lastPrune = now;
  const cutoff = now - 25 * 60 * 1000;
  for (const [jti, at] of consumedJti) {
    if (at < cutoff) consumedJti.delete(jti);
  }
  for (const [key, at] of windowSubmitConsumed) {
    if (at < cutoff) windowSubmitConsumed.delete(key);
  }
  for (const [key, at] of windowSubmitInflight) {
    if (at < cutoff) windowSubmitInflight.delete(key);
  }
}

export function isSubmitTicketConsumed(jti: string): boolean {
  prune();
  return consumedJti.has(jti);
}

/** Claim ticket for this request (one tab wins). */
export function tryClaimSubmitTicket(jti: string): boolean {
  prune();
  if (consumedJti.has(jti)) {
    return false;
  }
  consumedJti.set(jti, Date.now());
  return true;
}

/** After failed submit — allow retry with same ticket. */
export function releaseSubmitTicket(jti: string): void {
  consumedJti.delete(jti);
}

export function isWindowSubmitConsumed(
  locationCode: string,
  windowId: number,
  windowIssuedAt: number,
): boolean {
  prune();
  return windowSubmitConsumed.has(
    windowKey(locationCode, windowId, windowIssuedAt),
  );
}

export function markWindowSubmitSucceeded(
  locationCode: string,
  windowId: number,
  windowIssuedAt: number,
): void {
  prune();
  const key = windowKey(locationCode, windowId, windowIssuedAt);
  windowSubmitConsumed.set(key, Date.now());
  windowSubmitInflight.delete(key);
}

/**
 * Before running Fal/CMS — reserve this window so another submit cannot start.
 * Returns false if another submit is in-flight or this window already succeeded.
 */
export function tryBeginWindowSubmit(
  locationCode: string,
  windowId: number,
  windowIssuedAt: number,
): boolean {
  prune();
  const key = windowKey(locationCode, windowId, windowIssuedAt);
  if (windowSubmitConsumed.has(key)) {
    return false;
  }
  if (windowSubmitInflight.has(key)) {
    return false;
  }
  windowSubmitInflight.set(key, Date.now());
  return true;
}

/** Clear in-flight reservation (failed submit before success). */
export function releaseWindowSubmit(
  locationCode: string,
  windowId: number,
  windowIssuedAt: number,
): void {
  windowSubmitInflight.delete(
    windowKey(locationCode, windowId, windowIssuedAt),
  );
}
