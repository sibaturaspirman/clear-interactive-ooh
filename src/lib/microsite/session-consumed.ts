import "server-only";

/** In-memory one-time submission tickets (use Redis in multi-instance production). */
const consumedJti = new Map<string, number>();
const PRUNE_EVERY_MS = 60 * 1000;
let lastPrune = 0;

function prune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_EVERY_MS) return;
  lastPrune = now;
  const cutoff = now - 25 * 60 * 1000;
  for (const [jti, at] of consumedJti) {
    if (at < cutoff) consumedJti.delete(jti);
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
