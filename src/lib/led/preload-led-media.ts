import type { LedQueueItem } from "@/lib/led/led-queue-types";

export function isLedVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

/** Shared in-flight / last-result preload — key removed on failure so retries work. */
const preloadByUrl = new Map<string, Promise<boolean>>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try once to load media into cache. **false** on error — do not start playback on false.
 * (Older code resolved on error too, which caused empty frames on bad networks.)
 */
export function preloadLedMediaUrl(url: string): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) {
    return Promise.resolve(false);
  }

  const cached = preloadByUrl.get(trimmed);
  if (cached) {
    return cached;
  }

  const task = new Promise<boolean>((resolve) => {
    if (isLedVideoUrl(trimmed)) {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      const ok = () => resolve(true);
      const fail = () => {
        preloadByUrl.delete(trimmed);
        resolve(false);
      };
      video.addEventListener("loadeddata", ok, { once: true });
      video.addEventListener("error", fail, { once: true });
      video.src = trimmed;
      video.load();
      return;
    }

    const img = new Image();
    img.decoding = "async";
    const onLoad = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(
          () => resolve(true),
          () => resolve(true),
        );
        return;
      }
      resolve(true);
    };
    const onError = () => {
      preloadByUrl.delete(trimmed);
      resolve(false);
    };
    img.addEventListener("load", onLoad, { once: true });
    img.addEventListener("error", onError, { once: true });
    img.src = trimmed;
  });

  preloadByUrl.set(trimmed, task);
  return task;
}

/**
 * Block until `url` loads or until attempts exhausted (no spinner — same frame as before).
 * Uses exponential backoff for flaky OOH links.
 */
export async function waitUntilLedMediaReady(
  url: string,
  options?: { maxWaitMs?: number },
): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  const maxWaitMs = options?.maxWaitMs ?? 90_000;
  const started = Date.now();
  let gap = 250;
  for (;;) {
    const ok = await preloadLedMediaUrl(trimmed);
    if (ok) {
      return true;
    }
    if (Date.now() - started >= maxWaitMs) {
      return false;
    }
    await sleep(gap);
    gap = Math.min(Math.floor(gap * 1.4), 3000);
  }
}

export function preloadLedQueueItems(items: LedQueueItem[]) {
  return Promise.all(items.map((item) => preloadLedMediaUrl(item.url)));
}

/**
 * Build an `<img>` or `<video>` off-DOM; resolves when pixels are ready to show.
 * Use with **replaceChildren** only **after** `whenReady` — keeps previous frame visible meanwhile.
 */
export function prepareLedPlaybackMediaElement(
  url: string,
  options?: { alt?: string },
): { element: HTMLImageElement | HTMLVideoElement; whenReady: Promise<void> } {
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      element: document.createElement("img"),
      whenReady: Promise.reject(new Error("empty url")),
    };
  }

  if (isLedVideoUrl(trimmed)) {
    const video = document.createElement("video");
    video.src = trimmed;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.autoplay = false;
    const whenReady = new Promise<void>((resolve, reject) => {
      video.addEventListener("canplay", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(new Error("video load error")), {
        once: true,
      });
    });
    video.load();
    return { element: video, whenReady };
  }

  const img = document.createElement("img");
  img.alt = options?.alt ?? "";
  img.decoding = "async";
  const whenReady = new Promise<void>((resolve, reject) => {
    img.addEventListener(
      "load",
      () => {
        if (typeof img.decode === "function") {
          void img.decode().then(
            () => resolve(),
            () => resolve(),
          );
        } else {
          resolve();
        }
      },
      { once: true },
    );
    img.addEventListener("error", () => reject(new Error("image load error")), {
      once: true,
    });
  });
  img.src = trimmed;
  return { element: img, whenReady };
}
