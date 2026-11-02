/** Cityvision / Broadsign HTML5 start signal (doc §3). */

export type BroadSignStartHandler = () => void;

declare global {
  interface Window {
    BroadSignPlay?: () => void;
  }
}

export function isBroadsignAutoplayPreview(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("autoplay") === "1";
}

/** Idempotent start — safe to call from postMessage, BroadSignPlay(), and ?autoplay=1. */
export function createBroadSignStarter(onStart: BroadSignStartHandler): () => void {
  let started = false;
  return () => {
    if (started) {
      return;
    }
    started = true;
    onStart();
  };
}

export function installBroadSignPlay(
  start: () => void,
): () => void {
  const onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string } | null;
    if (data?.type === "BroadSignPlay") {
      start();
    }
  };

  window.addEventListener("message", onMessage);
  const previous = window.BroadSignPlay;
  window.BroadSignPlay = start;

  if (isBroadsignAutoplayPreview()) {
    start();
  }

  return () => {
    window.removeEventListener("message", onMessage);
    if (window.BroadSignPlay === start) {
      if (previous) {
        window.BroadSignPlay = previous;
      } else {
        delete window.BroadSignPlay;
      }
    }
  };
}
