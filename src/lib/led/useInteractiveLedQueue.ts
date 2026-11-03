"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { CITYVISION_PLAYABLE_MS } from "@/lib/led/cityvision/cityvision-timing";
import type { LedDebugOptions } from "@/lib/led/debug";
import {
  INTERACTIVE_LED_DUMMY_PLAY_MS,
  INTERACTIVE_LED_LIVE_START_AT_MS,
  INTERACTIVE_LED_STATIC_DURATION_MS,
  INTERACTIVE_LED_STATIC_FADE_OUT_MS,
} from "@/lib/led/interactive-led-timing";
import {
  MIB_LED_LIVE_START_AT_MS,
  MIB_LED_SEQUENCE,
  MIB_LED_STATIC_DURATION_MS,
  MIB_LED_STATIC_FADE_OUT_MS,
} from "@/lib/led/mib/mib-led-sequence";
import {
  liveSegmentPlayMsForSlotCount,
  liveSegmentSlotCount,
} from "@/lib/led/led-sequence-loop";
import type {
  LedConnectionStatus,
  LedPullResponse,
  LedQueueItem,
} from "@/lib/led/led-queue-types";
import {
  preloadLedMediaUrl,
  preloadLedQueueItems,
} from "@/lib/led/preload-led-media";

const DUMMY_QUEUE_ID = -1;

function isDummyQueueItem(item: LedQueueItem) {
  return item.queue_id === DUMMY_QUEUE_ID && item.submission_id === 0;
}

function createDummyQueueItem(url: string): LedQueueItem {
  return {
    queue_id: DUMMY_QUEUE_ID,
    submission_id: 0,
    nama: "",
    url,
    location_id: 0,
  };
}

function itemPlayMs(
  item: LedQueueItem | null | undefined,
  apiPlayMs: number,
  sencySequenceMode: boolean,
  sequenceLivePlayMs: number,
) {
  if (sencySequenceMode) {
    if (item && isDummyQueueItem(item)) return MIB_LED_SEQUENCE.liveMs;
    return sequenceLivePlayMs;
  }
  if (item && isDummyQueueItem(item)) return INTERACTIVE_LED_DUMMY_PLAY_MS;
  return apiPlayMs;
}

export type UseInteractiveLedQueueParams = {
  code: string;
  apiBaseUrl: string;
  ledKey: string;
  locationName: string;
  dummyTalentUrl: string;
  ledDebug?: LedDebugOptions;
  /** Cityvision Broadsign — 15s slot, no intro loop between idle segments. */
  cityvisionMode?: boolean;
  /** Sency — 4s intro / 9s live (3×3s) / 4s outro loop. */
  sencySequenceMode?: boolean;
  /** When false, hold first static frame until BroadSignPlay / ?autoplay=1. */
  playbackEnabled?: boolean;
};

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function isDuplicatePlayerMessage(message: string) {
  return /player|lain|terhubung|connected|session|sudah/i.test(message);
}

export function useInteractiveLedQueue({
  code,
  apiBaseUrl,
  ledKey,
  locationName,
  dummyTalentUrl,
  ledDebug = {
    disableAnimations: false,
    skipIntro: false,
    holdStatic: false,
    holdLiveLayout: false,
  },
  cityvisionMode = false,
  sencySequenceMode = false,
  playbackEnabled = true,
}: UseInteractiveLedQueueParams) {

  const mediaRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<LedConnectionStatus>("connecting");
  const [ui, setUi] = useState({
    idle: true,
    chrome: false,
    hint: false,
    nama: "",
    loc: locationName,
    pos: "",
    playbackUrl: "",
    playbackQueueId: null as number | null,
    playMs: 3000,
  });

  const stateRef = useRef({
    locationName,
    playMs: 3000,
    bufferSize: 5,
    current: null as LedQueueItem | null,
    upcoming: [] as LedQueueItem[],
    replayLoop: [] as LedQueueItem[],
    replaying: false,
    hint: false,
    queued: 0,
    pulling: false,
    startedAt: 0,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
  });

  const shownIdRef = useRef<number | null>(null);
  const bootedRef = useRef(false);
  const chainRef = useRef(Promise.resolve());
  const holdStatic = ledDebug.holdStatic;
  const holdLiveLayout = ledDebug.holdLiveLayout;
  const skipIntro = ledDebug.skipIntro && !holdStatic;
  const introDoneRef = useRef(skipIntro && !holdStatic);
  const [phase, setPhase] = useState<"static" | "live" | "outro">(() => {
    if (holdStatic) return "static";
    if (skipIntro) return "live";
    return "static";
  });
  const [staticExiting, setStaticExiting] = useState(false);
  const [introCycle, setIntroCycle] = useState(0);
  const [liveReady, setLiveReady] = useState(skipIntro && !holdStatic);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const liveHadPlaybackRef = useRef(false);
  const dummyPlayedThisLiveRef = useRef(false);
  const introTimersRef = useRef<{
    exit: ReturnType<typeof setTimeout> | null;
    live: ReturnType<typeof setTimeout> | null;
  }>({ exit: null, live: null });
  const slotStartRef = useRef(0);
  const slotEndTimerRef = useRef<ReturnType<typeof setTimeout> | 0>(0);
  const liveSegmentEndRef = useRef(0);
  const liveSegmentTimerRef = useRef<ReturnType<typeof setTimeout> | 0>(0);
  const outroTimerRef = useRef<ReturnType<typeof setTimeout> | 0>(0);
  const sequenceLivePlayMsRef = useRef<number>(MIB_LED_SEQUENCE.submissionMs);
  const [slotFrozen, setSlotFrozen] = useState(false);

  function planLiveSegmentPlayback() {
    const state = stateRef.current;
    const slots = liveSegmentSlotCount(
      state.upcoming.length,
      Boolean(state.current),
    );
    sequenceLivePlayMsRef.current = liveSegmentPlayMsForSlotCount(slots);
  }

  const staticDurationMs = sencySequenceMode
    ? MIB_LED_STATIC_DURATION_MS
    : INTERACTIVE_LED_STATIC_DURATION_MS;
  const staticFadeOutMs = sencySequenceMode
    ? MIB_LED_STATIC_FADE_OUT_MS
    : INTERACTIVE_LED_STATIC_FADE_OUT_MS;
  const liveStartAtMs = sencySequenceMode
    ? MIB_LED_LIVE_START_AT_MS
    : INTERACTIVE_LED_LIVE_START_AT_MS;

  const playerKey = `clear.led.playerId.${code}`;
  const storeKey = `clear.led.queue.${code}`;

  function enqueue(task: () => Promise<void>) {
    chainRef.current = chainRef.current.then(task, task).catch((error) => {
      console.error(error instanceof Error ? error.message : "Error player");
    });
  }

  function clearIntroTimers() {
    const timers = introTimersRef.current;
    if (timers.exit) clearTimeout(timers.exit);
    if (timers.live) clearTimeout(timers.live);
    introTimersRef.current = { exit: null, live: null };
  }

  function clearCityvisionSlotTimer() {
    if (slotEndTimerRef.current) {
      clearTimeout(slotEndTimerRef.current);
      slotEndTimerRef.current = 0;
    }
  }

  function clearSencySequenceTimers() {
    if (liveSegmentTimerRef.current) {
      clearTimeout(liveSegmentTimerRef.current);
      liveSegmentTimerRef.current = 0;
    }
    if (outroTimerRef.current) {
      clearTimeout(outroTimerRef.current);
      outroTimerRef.current = 0;
    }
    liveSegmentEndRef.current = 0;
  }

  function armSencySlotDeadline() {
    if (!sencySequenceMode) return;
    clearCityvisionSlotTimer();
    slotStartRef.current = Date.now();
    slotEndTimerRef.current = setTimeout(() => {
      if (ledDebug.holdStatic || ledDebug.holdLiveLayout) return;
      clearSencySequenceTimers();
      runIntroCycle();
    }, MIB_LED_SEQUENCE.slotMs);
  }

  function freezeCityvisionSlot() {
    if (!cityvisionMode || slotFrozen) {
      return;
    }
    setSlotFrozen(true);
    clearIntroTimers();
    clearCityvisionSlotTimer();
    const state = stateRef.current;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = 0;
    }
  }

  function armCityvisionSlotDeadline() {
    if (!cityvisionMode) {
      return;
    }
    clearCityvisionSlotTimer();
    if (!slotStartRef.current) {
      slotStartRef.current = Date.now();
    }
    slotEndTimerRef.current = setTimeout(
      freezeCityvisionSlot,
      CITYVISION_PLAYABLE_MS,
    );
  }

  function capPlayMsForCityvision(requested: number): number {
    if (!cityvisionMode || !slotStartRef.current) {
      return requested;
    }
    const elapsed = Date.now() - slotStartRef.current;
    const budget = CITYVISION_PLAYABLE_MS - elapsed;
    if (budget <= 0) {
      return 800;
    }
    return Math.max(800, Math.min(requested, budget));
  }

  function capPlayMsForSlot(requested: number): number {
    if (sencySequenceMode && liveSegmentEndRef.current) {
      const liveLeft = liveSegmentEndRef.current - Date.now();
      if (liveLeft <= 0) return 800;
      return Math.max(800, Math.min(requested, liveLeft));
    }
    return capPlayMsForCityvision(requested);
  }

  function resetPlaybackForIntro() {
    const state = stateRef.current;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = 0;
    }
    state.current = null;
    state.upcoming = [];
    state.replayLoop = [];
    state.replaying = false;
    state.hint = false;
    state.startedAt = 0;
    shownIdRef.current = null;
    persist();
    setUi({
      idle: true,
      chrome: false,
      hint: state.hint,
      nama: "",
      loc: state.locationName,
      pos: "",
      playbackUrl: "",
      playbackQueueId: null,
      playMs: state.playMs,
    });
  }

  function startLiveLayoutHold() {
    introDoneRef.current = true;
    bootedRef.current = true;
    setPhase("live");
    setStaticExiting(false);
    setLiveReady(true);
  }

  function startLiveQueue() {
    if (holdLiveLayout) {
      startLiveLayoutHold();
      return;
    }
    introDoneRef.current = true;
    bootedRef.current = true;
    setPhase("live");
    setStaticExiting(false);
    setLiveReady(true);
    if (sencySequenceMode) {
      clearSencySequenceTimers();
      const liveMs = MIB_LED_SEQUENCE.liveMs;
      liveSegmentEndRef.current = Date.now() + liveMs;
      liveSegmentTimerRef.current = setTimeout(
        endSencyLiveSegment,
        liveMs,
      );
    }
    enqueue(async () => {
      if (sencySequenceMode) {
        if (stateRef.current.upcoming.length === 0 && !stateRef.current.current) {
          await fillQueueDuringIntro();
        }
        planLiveSegmentPlayback();
      }
      await resume();
      render();
    });
  }

  function endSencyLiveSegment() {
    if (!sencySequenceMode) return;
    liveSegmentTimerRef.current = 0;
    liveSegmentEndRef.current = 0;
    const state = stateRef.current;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = 0;
    }
    const done = state.current;
    state.current = null;
    state.upcoming = [];
    state.startedAt = 0;
    shownIdRef.current = null;
    if (done && !state.replaying && !isDummyQueueItem(done)) {
      ack(done.queue_id);
    }
    introDoneRef.current = false;
    persist();
    render();
    runOutroPhase();
  }

  function runOutroPhase() {
    if (!sencySequenceMode) return;
    setPhase("outro");
    setLiveReady(false);
    if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
    outroTimerRef.current = setTimeout(() => {
      outroTimerRef.current = 0;
      runIntroCycle();
    }, MIB_LED_SEQUENCE.outroMs);
  }

  function runIntroCycle() {
    if (!playbackEnabled) {
      return;
    }
    clearIntroTimers();
    clearSencySequenceTimers();
    if (sencySequenceMode) {
      setSlotFrozen(false);
      armSencySlotDeadline();
    } else if (cityvisionMode) {
      setSlotFrozen(false);
      slotStartRef.current = Date.now();
      armCityvisionSlotDeadline();
    }
    introDoneRef.current = false;
    liveHadPlaybackRef.current = false;
    dummyPlayedThisLiveRef.current = false;
    setLiveReady(false);
    resetPlaybackForIntro();
    setIntroCycle((cycle) => cycle + 1);
    setPhase("static");
    setStaticExiting(false);
    const exitAt = Math.max(0, staticDurationMs - staticFadeOutMs);
    introTimersRef.current.exit = setTimeout(
      () => setStaticExiting(true),
      exitAt,
    );
    introTimersRef.current.live = setTimeout(startLiveQueue, liveStartAtMs);
    enqueue(async () => {
      await fillQueueDuringIntro();
    });
  }

  async function fillQueueDuringIntro() {
    if (introDoneRef.current) return;
    while (slots() > 0) {
      const before = stateRef.current.upcoming.length;
      await pull({ replay: false });
      if (stateRef.current.upcoming.length === before) break;
    }
    const state = stateRef.current;
    if (
      state.upcoming.length === 0 &&
      !state.current &&
      slots() > 0 &&
      !state.replaying
    ) {
      await pull({ replay: true });
    }
  }

  function fetchQueueDuringIntroOnly() {
    return introDoneRef.current;
  }

  function shouldPlayDummyFill() {
    if (sencySequenceMode) return true;
    return (
      !holdLiveLayout &&
      !ledDebug.holdStatic &&
      !ledDebug.holdLiveLayout
    );
  }

  function maybeScheduleIntroAfterIdle() {
    if (sencySequenceMode) {
      return;
    }
    if (slotFrozen) {
      return;
    }
    if (
      ledDebug.holdStatic ||
      ledDebug.skipIntro ||
      ledDebug.holdLiveLayout
    ) {
      return;
    }
    if (phaseRef.current !== "live") {
      return;
    }
    if (!liveHadPlaybackRef.current) {
      return;
    }
    const state = stateRef.current;
    if (state.current || state.upcoming.length > 0) {
      return;
    }
    runIntroCycle();
  }

  /** BEI plays one intro-fetched batch per live segment — no client replay loop. */
  function endLiveBatch() {
    const state = stateRef.current;
    state.replaying = false;
    state.replayLoop = [];
    state.hint = false;
  }

  function persist() {
    const state = stateRef.current;
    localStorage.setItem(
      storeKey,
      JSON.stringify({
        current: state.current,
        upcoming: state.upcoming,
        replayLoop: state.replayLoop,
        replaying: state.replaying,
        startedAt: state.startedAt,
        playMs: state.playMs,
      }),
    );
  }

  function loadStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey) || "null") as {
        current?: LedQueueItem | null;
        upcoming?: LedQueueItem[];
        replayLoop?: LedQueueItem[];
        replaying?: boolean;
        startedAt?: number;
        playMs?: number;
      } | null;
      if (!raw) return;
      const state = stateRef.current;
      state.current = raw.current || null;
      state.upcoming = Array.isArray(raw.upcoming) ? raw.upcoming : [];
      state.replayLoop = Array.isArray(raw.replayLoop) ? raw.replayLoop : [];
      state.replaying = Boolean(raw.replaying);
      state.startedAt = raw.startedAt || 0;
      if (raw.playMs) state.playMs = raw.playMs;
    } catch {
      localStorage.removeItem(storeKey);
    }
  }

  function slots() {
    const state = stateRef.current;
    const capacity = sencySequenceMode
      ? Math.min(state.bufferSize, 3)
      : state.bufferSize;
    return capacity - ((state.current ? 1 : 0) + state.upcoming.length);
  }

  function held(queueId: number) {
    const state = stateRef.current;
    if (state.current?.queue_id === queueId) return true;
    return state.upcoming.some((item) => item.queue_id === queueId);
  }

  function restartBar(remaining: number, durationMs: number) {
    const bar = barRef.current;
    if (!bar) return;
    const elapsed = Math.max(durationMs - remaining, 0);
    bar.style.animation = "none";
    void bar.offsetWidth;
    bar.style.animation = `led-shrink ${durationMs}ms linear forwards`;
    bar.style.animationDelay = `-${elapsed}ms`;
  }

  function mount(item: LedQueueItem, remaining: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.replaceChildren();
    if (isVideo(item.url)) {
      const video = document.createElement("video");
      video.src = item.url;
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
      media.append(video);
    } else {
      const img = document.createElement("img");
      img.alt = item.nama;
      img.src = item.url;
      media.append(img);
    }
    shownIdRef.current = item.queue_id;
    restartBar(
      remaining,
      itemPlayMs(
        item,
        stateRef.current.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
      ),
    );
  }

  function playbackBlocked() {
    if (!playbackEnabled) {
      return true;
    }
    if (slotFrozen) {
      return true;
    }
    if (holdLiveLayout) {
      return true;
    }
    return !introDoneRef.current;
  }

  function render(remaining?: number) {
    const state = stateRef.current;
    if (playbackBlocked()) {
      if (state.current) {
        state.current = null;
        state.startedAt = 0;
        shownIdRef.current = null;
        persist();
      }
      setUi({
        idle: true,
        chrome: false,
        hint: state.hint,
        nama: "",
        loc: state.locationName,
        pos: "",
        playbackUrl: "",
        playbackQueueId: null,
        playMs: state.playMs,
      });
      return;
    }
    if (!state.current) {
      shownIdRef.current = null;
      mediaRef.current?.replaceChildren();
      setUi({
        idle: true,
        chrome: false,
        hint: state.hint,
        nama: "",
        loc: state.locationName,
        pos: "",
        playbackUrl: "",
        playbackQueueId: null,
        playMs: state.playMs,
      });
      return;
    }

    setUi({
      idle: false,
      chrome: true,
      hint: state.hint,
      nama: state.current.nama,
      loc: state.locationName,
      pos: `${state.upcoming.length} di belakang`,
      playbackUrl: state.current.url,
      playbackQueueId: state.current.queue_id,
      playMs: itemPlayMs(
        state.current,
        state.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
      ),
    });

    if (shownIdRef.current !== state.current.queue_id) {
      const duration = capPlayMsForSlot(
        itemPlayMs(
          state.current,
          state.playMs,
          sencySequenceMode,
          sequenceLivePlayMsRef.current,
        ),
      );
      mount(state.current, remaining ?? duration);
    }
  }

  async function pull(options?: { replay?: boolean }) {
    const state = stateRef.current;
    if (state.pulling) return;
    if (fetchQueueDuringIntroOnly()) return;
    const free = slots();
    if (free <= 0) return;
    const askReplay = options?.replay ?? false;
    state.pulling = true;
    try {
      const base = apiBaseUrl.replace(/\/$/, "");
      const res = await fetch(
        `${base}/api/led/${encodeURIComponent(code)}/next?limit=${free}&replay=${askReplay ? "1" : "0"}`,
        { headers: { "x-led-key": ledKey } },
      );
      const data = (await res.json()) as LedPullResponse & { message?: string };
      if (!res.ok) {
        setConnectionStatus("error");
        throw new Error(data.message || "Gagal ambil antrian");
      }
      setConnectionStatus((prev) => (prev === "error" ? prev : "connected"));
      if (!sencySequenceMode) {
        state.playMs = data.play_ms || state.playMs;
      }
      state.bufferSize = data.buffer_size || state.bufferSize;
      const buffered: LedQueueItem[] = [];
      if (data.mode === "fresh") {
        state.replaying = false;
        state.replayLoop = [];
        state.hint = false;
        for (const item of data.items) {
          if (!held(item.queue_id) && slots() > 0) {
            state.upcoming.push(item);
            buffered.push(item);
          }
        }
      } else if (data.mode === "replay" && askReplay) {
        state.replaying = true;
        state.replayLoop = data.items.slice();
        state.upcoming = data.items.slice();
        state.hint = false;
        buffered.push(...data.items);
      }
      if (buffered.length > 0) {
        void preloadLedQueueItems(buffered);
      }
      persist();
    } finally {
      state.pulling = false;
    }
  }

  function ack(queueId: number) {
    const base = apiBaseUrl.replace(/\/$/, "");
    fetch(`${base}/api/led/${encodeURIComponent(code)}/played`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-led-key": ledKey,
      },
      body: JSON.stringify({ queue_ids: [queueId] }),
    }).catch(() => {});
  }

  function arm(remaining: number) {
    if (playbackBlocked()) {
      return;
    }
    const state = stateRef.current;
    if (state.timer) clearTimeout(state.timer);
    const duration = capPlayMsForSlot(
      itemPlayMs(
        state.current,
        state.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
      ),
    );
    const waitMs = Math.min(remaining, duration);
    state.startedAt = Date.now() - (duration - waitMs);
    persist();
    render(waitMs);
    state.timer = setTimeout(() => {
      enqueue(finish);
    }, waitMs);
  }

  async function startIfIdle() {
    const state = stateRef.current;
    const liveSegment = fetchQueueDuringIntroOnly();
    if (state.current) return;
    if (!state.upcoming.length) {
      if (state.replaying && state.replayLoop.length && !state.hint) {
        endLiveBatch();
      }
    }
    if (!state.upcoming.length) {
      if (shouldPlayDummyFill()) {
        if (state.queued > 0 && !sencySequenceMode) {
          runIntroCycle();
          return;
        }
        if (
          dummyPlayedThisLiveRef.current ||
          liveHadPlaybackRef.current
        ) {
          endLiveBatch();
          persist();
          render();
          maybeScheduleIntroAfterIdle();
          return;
        }
        state.current = createDummyQueueItem(dummyTalentUrl);
        dummyPlayedThisLiveRef.current = true;
        liveHadPlaybackRef.current = true;
        state.startedAt = Date.now();
        persist();
        arm(
          itemPlayMs(
            state.current,
            state.playMs,
            sencySequenceMode,
            sequenceLivePlayMsRef.current,
          ),
        );
        return;
      }
      persist();
      render();
      maybeScheduleIntroAfterIdle();
      return;
    }
    if (playbackBlocked()) {
      persist();
      return;
    }
    state.current = state.upcoming.shift() ?? null;
    if (state.current) {
      await preloadLedMediaUrl(state.current.url);
      liveHadPlaybackRef.current = true;
    }
    state.startedAt = Date.now();
    persist();
    void preloadLedQueueItems(state.upcoming);
    arm(
      itemPlayMs(
        state.current,
        state.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
      ),
    );
  }

  async function finish() {
    const state = stateRef.current;
    const done = state.current;
    if (done && !state.replaying && !isDummyQueueItem(done)) {
      ack(done.queue_id);
    }
    if (state.replaying && state.hint) {
      state.upcoming = [];
      state.replayLoop = [];
      state.replaying = false;
    }
    if (done && isDummyQueueItem(done)) {
      state.current = null;
      state.startedAt = 0;
      shownIdRef.current = null;
      persist();
      render();
      maybeScheduleIntroAfterIdle();
      return;
    }

    const nextUp =
      !playbackBlocked() && state.upcoming.length > 0
        ? state.upcoming[0]
        : null;
    if (nextUp) {
      await preloadLedMediaUrl(nextUp.url);
      state.current = state.upcoming.shift() ?? null;
      state.startedAt = Date.now();
      shownIdRef.current = null;
      persist();
      void preloadLedQueueItems(state.upcoming);
      liveHadPlaybackRef.current = true;
      arm(
        itemPlayMs(
          state.current,
          state.playMs,
          sencySequenceMode,
          sequenceLivePlayMsRef.current,
        ),
      );
      return;
    }

    state.current = null;
    state.startedAt = 0;
    shownIdRef.current = null;
    persist();
    await startIfIdle();
  }

  async function resume() {
    loadStore();
    const state = stateRef.current;
    void preloadLedQueueItems([
      ...(state.current ? [state.current] : []),
      ...state.upcoming,
    ]);
    if (!state.current) {
      await startIfIdle();
      return;
    }
    await preloadLedMediaUrl(state.current.url);
    const duration = itemPlayMs(
      state.current,
      state.playMs,
      sencySequenceMode,
      sequenceLivePlayMsRef.current,
    );
    const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
    const remaining = duration - elapsed;
    if (remaining < 250) await finish();
    else arm(remaining);
  }

  useEffect(() => {
    void preloadLedMediaUrl(dummyTalentUrl);
  }, [dummyTalentUrl]);

  useEffect(() => {
    stateRef.current.locationName = locationName;
    setUi((current) => ({ ...current, loc: locationName }));
  }, [locationName]);

  useEffect(() => {
    if (!playbackEnabled) {
      clearIntroTimers();
      clearCityvisionSlotTimer();
      introDoneRef.current = false;
      setPhase("static");
      setStaticExiting(false);
      setLiveReady(false);
      return;
    }

    if (ledDebug.holdStatic) {
      clearIntroTimers();
      introDoneRef.current = false;
      setPhase("static");
      if (cityvisionMode) {
        armCityvisionSlotDeadline();
      }
      return;
    }

    if (ledDebug.holdLiveLayout) {
      clearIntroTimers();
      if (cityvisionMode) {
        slotStartRef.current = Date.now();
        armCityvisionSlotDeadline();
      }
      startLiveLayoutHold();
      return;
    }

    if (ledDebug.skipIntro) {
      clearIntroTimers();
      if (cityvisionMode) {
        slotStartRef.current = Date.now();
        armCityvisionSlotDeadline();
      }
      startLiveQueue();
      return;
    }

    slotStartRef.current = 0;
    setSlotFrozen(false);
    runIntroCycle();
    return () => {
      clearIntroTimers();
      clearCityvisionSlotTimer();
      clearSencySequenceTimers();
    };
  }, [
    playbackEnabled,
    ledDebug.skipIntro,
    ledDebug.holdStatic,
    ledDebug.holdLiveLayout,
    cityvisionMode,
    sencySequenceMode,
  ]);


  useEffect(() => {
    let playerId = localStorage.getItem(playerKey);
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem(playerKey, playerId);
    }

    const socket: Socket = io(apiBaseUrl.replace(/\/$/, ""), {
      transports: ["websocket", "polling"],
    });

    socket.on("connect_error", () => {
      setConnectionStatus((prev) =>
        prev === "connected" ? "reconnecting" : prev,
      );
    });

    socket.on("connect", () => {
      setConnectionStatus((prev) =>
        prev === "reconnecting" || prev === "standby" || prev === "error"
          ? "reconnecting"
          : "connecting",
      );
      socket.emit("led:hello", { code, key: ledKey, playerId });
    });

    socket.on("led:ready", (msg: {
      location_name?: string;
      play_ms?: number;
      buffer_size?: number;
      queued?: number;
    }) => {
      enqueue(async () => {
        const state = stateRef.current;
        state.locationName = msg.location_name || locationName;
        state.playMs = msg.play_ms || state.playMs;
        state.bufferSize = msg.buffer_size || state.bufferSize;
        state.queued = msg.queued || 0;
        setConnectionStatus("connected");
        if (!bootedRef.current) {
          bootedRef.current = true;
          if (!holdLiveLayout && introDoneRef.current) {
            await resume();
          }
        }
        if (
          !holdLiveLayout &&
          !state.replaying &&
          slots() > 0 &&
          state.queued > 0
        ) {
          await fillQueueDuringIntro();
        }
        render();
      });
    });

    socket.on("led:error", (msg: { message?: string }) => {
      const message = msg.message ?? "";
      console.warn("[LED socket]", message);
      if (isDuplicatePlayerMessage(message)) {
        setConnectionStatus("standby");
      } else {
        setConnectionStatus("error");
      }
    });

    socket.on("queue:hint", (msg: { queued?: number }) => {
      enqueue(async () => {
        const state = stateRef.current;
        state.hint = true;
        state.queued = msg.queued ?? state.queued;
        if (introDoneRef.current) {
          if (sencySequenceMode) {
            render();
            return;
          }
          const queued = msg.queued ?? state.queued;
          if (
            !state.current &&
            !state.upcoming.length &&
            !state.replaying &&
            queued > 0
          ) {
            runIntroCycle();
            return;
          }
          render();
          return;
        }
        if (state.replaying) {
          render();
          return;
        }
        await fillQueueDuringIntro();
        if (!state.current) await startIfIdle();
        else render();
      });
    });

    socket.on("disconnect", () => {
      setConnectionStatus("reconnecting");
    });

    return () => {
      socket.disconnect();
      const state = stateRef.current;
      if (state.timer) clearTimeout(state.timer);
      clearCityvisionSlotTimer();
      clearSencySequenceTimers();
    };
  }, [apiBaseUrl, code, ledKey, locationName]);

  return {
    connectionStatus,
    ui,
    phase,
    staticExiting,
    introCycleKey: introCycle,
    liveReady,
    holdLiveLayout,
    holdStatic,
    slotFrozen,
    cityvisionMode,
    mediaRef,
    barRef,
  };
}
