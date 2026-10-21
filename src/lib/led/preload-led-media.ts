import type { LedQueueItem } from "@/lib/led/led-queue-types";

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

const preloadByUrl = new Map<string, Promise<void>>();

/** Warm browser cache for LED talent URLs (shared across queue items). */
export function preloadLedMediaUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) {
    return Promise.resolve();
  }

  const cached = preloadByUrl.get(trimmed);
  if (cached) {
    return cached;
  }

  const task = new Promise<void>((resolve) => {
    if (isVideo(trimmed)) {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      const done = () => resolve();
      video.addEventListener("loadeddata", done, { once: true });
      video.addEventListener("error", done, { once: true });
      video.src = trimmed;
      video.load();
      return;
    }

    const img = new Image();
    img.decoding = "async";
    const done = () => resolve();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    img.src = trimmed;
  });

  preloadByUrl.set(trimmed, task);
  return task;
}

export function preloadLedQueueItems(items: LedQueueItem[]) {
  return Promise.all(items.map((item) => preloadLedMediaUrl(item.url)));
}
