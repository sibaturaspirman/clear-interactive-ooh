"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { CITYVISION_PLAYABLE_MS } from "@/lib/led/cityvision/cityvision-timing";
import type { LedDebugOptions } from "@/lib/led/debug";
import {
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
  LED_SEQUENCE,
  liveSegmentPlayMsForSlotCount,
  liveSegmentSlotCount,
} from "@/lib/led/led-sequence-loop";
import {
  LED_DUMMY_ROTATION,
  LED_DUMMY_SLOT_MS,
  isLedDummyQueueId,
} from "@/lib/led/led-dummy";
import { ledParticipantDisplayName } from "@/lib/led/led-participant-display-name";
import type {
  LedConnectionStatus,
  LedPullResponse,
  LedQueueItem,
} from "@/lib/led/led-queue-types";
import { buildLedNextUrl } from "@/lib/led/led-next-url";
import { replayItemsForPlayback } from "@/lib/led/replay-items-for-playback";
import {
  prepareLedPlaybackMediaElement,
  preloadLedMediaUrl,
  preloadLedQueueItems,
  waitUntilLedMediaReady,
} from "@/lib/led/preload-led-media";

function isDummyQueueItem(item: LedQueueItem) {
  return item.submission_id === 0 && isLedDummyQueueId(item.queue_id);
}

function buildDummyRotationQueueItems(): LedQueueItem[] {
  return LED_DUMMY_ROTATION.map((d) => ({
    queue_id: d.queueId,
    submission_id: 0,
    nama: d.displayName,
    url: d.assetPath,
    location_id: 0,
  }));
}

function itemPlayMs(
  item: LedQueueItem | null | undefined,
  apiPlayMs: number,
  sencySequenceMode: boolean,
  sequenceLivePlayMs: number,
  cityvisionModeFlag: boolean,
) {
  if (sencySequenceMode) {
    if (item && isDummyQueueItem(item)) return LED_DUMMY_SLOT_MS;
    return sequenceLivePlayMs;
  }
  if (item && isDummyQueueItem(item)) {
    return LED_DUMMY_SLOT_MS;
  }
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
    preferFresh: false,
    pulling: false,
    startedAt: 0,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
  });

  const shownIdRef = useRef<number | null>(null);
  /** Invalidate in-flight async mount when switching items or going idle */
  const mountGenerationRef = useRef(0);
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
  /** True once we've started the 3×dummy rotation this live segment. */
  const dummyPlayedThisLiveRef = useRef(false);
  const dummyRotationIndexRef = useRef(0);
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
  /** Wall clock when socket disconnected — shift `startedAt` on reconnect so clip duration excludes offline time. */
  const disconnectWallRef = useRef(0);

  /**
   * Same gates as `arm()` — NOT `playbackBlocked()` (slot freeze must not block dummy slot timers).
   */
  function timerArmBlocked() {
    if (!playbackEnabled || holdLiveLayout || !introDoneRef.current) {
      return true;
    }
    const state = stateRef.current;
    if (
      slotFrozen &&
      !(state.current && isDummyQueueItem(state.current))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Continue the current clip after a timer clear (e.g. disconnect). Without this, offline dummy
   * rotation stalls because `finish` never runs.
   */
  function scheduleFinishFromElapsed() {
    const state = stateRef.current;
    if (timerArmBlocked() || !state.current) {
      return;
    }
    const duration = capPlayMsForSlot(
      itemPlayMs(
        state.current,
        state.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
        cityvisionMode,
      ),
    );
    const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
    const remaining = duration - elapsed;
    if (remaining < 250) {
      enqueue(async () => {
        await finish();
      });
    } else {
      arm(remaining);
    }
  }

  function freezePlaybackForNetworkLoss() {
    if (disconnectWallRef.current) return;
    disconnectWallRef.current = Date.now();
    const state = stateRef.current;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = 0;
    }
    persist();
    render();
    scheduleFinishFromElapsed();
  }

  function resumePlaybackAfterNetworkRestore() {
    const lostAt = disconnectWallRef.current;
    disconnectWallRef.current = 0;
    if (!lostAt) return;
    const state = stateRef.current;
    if (state.current && state.startedAt) {
      state.startedAt += Date.now() - lostAt;
      persist();
    }
    if (!introDoneRef.current || !playbackEnabled || holdLiveLayout || !state.current) {
      render();
      return;
    }
    scheduleFinishFromElapsed();
  }

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
    // Run after the previous step whether it fulfilled or rejected so the chain never stalls.
    // Swallow task errors so timers/socket handlers keep scheduling `finish` / `startIfIdle`.
    chainRef.current = chainRef.current
      .then(
        () => task(),
        () => task(),
      )
      .catch((error: unknown) => {
        console.warn(
          "[LED player]",
          error instanceof Error ? error.message : String(error),
        );
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
    mountGenerationRef.current += 1;
    mediaRef.current?.replaceChildren();
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
        if (
          stateRef.current.upcoming.length === 0 &&
          !stateRef.current.current
        ) {
          await fillQueueDuringIntro({ force: true });
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
    mountGenerationRef.current += 1;
    mediaRef.current?.replaceChildren();
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
    dummyRotationIndexRef.current = 0;
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

  async function fillQueueDuringIntro(options?: { force?: boolean }) {
    if (!options?.force && introDoneRef.current) return;
    while (slots() > 0) {
      const before = stateRef.current.upcoming.length;
      await pull({ replay: false, force: options?.force });
      if (stateRef.current.upcoming.length === before) break;
    }
    const state = stateRef.current;
    const mayReplay =
      !state.preferFresh && state.queued === 0 && !state.replaying;
    if (
      state.upcoming.length === 0 &&
      !state.current &&
      slots() > 0 &&
      mayReplay
    ) {
      await pull({ replay: true, force: options?.force });
    }
  }

  /** Pull fresh when socket reports new queue items (all locations). */
  async function pullFreshWhenHinted() {
    const state = stateRef.current;
    if (state.pulling || state.queued <= 0) return;
    state.preferFresh = true;
    if (state.replaying) {
      state.replaying = false;
      state.replayLoop = [];
      if (!state.current) {
        state.upcoming = [];
      }
    }
    while (slots() > 0) {
      const before = state.upcoming.length;
      await pull({ replay: false, force: true });
      if (stateRef.current.upcoming.length === before) break;
    }
    persist();
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

  /**
   * Do not mount submission until remote `url` is decodeable (avoids empty talent on bad OOH links).
   * On repeated failure, rotate item to back of queue so others can play.
   */
  async function takeNextReadyQueueItem(): Promise<LedQueueItem | null> {
    const state = stateRef.current;
    const maxAttempts = Math.max(state.upcoming.length * 3, 3);
    for (let attempt = 0; state.upcoming.length > 0; attempt++) {
      if (attempt >= maxAttempts) {
        return state.upcoming.shift() ?? null;
      }
      const next = state.upcoming[0];
      if (!next) {
        return null;
      }
      if (isDummyQueueItem(next) || !next.url?.trim()) {
        return state.upcoming.shift() ?? null;
      }
      const ok = await waitUntilLedMediaReady(next.url, { maxWaitMs: 60_000 });
      if (ok) {
        return state.upcoming.shift() ?? null;
      }
      const failed = state.upcoming.shift();
      if (failed) {
        state.upcoming.push(failed);
      }
    }
    return state.upcoming.shift() ?? null;
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

  async function mount(item: LedQueueItem, remaining: number) {
    const media = mediaRef.current;
    if (!media) return;
    const myGen = ++mountGenerationRef.current;
    const { element, whenReady } = prepareLedPlaybackMediaElement(item.url, {
      alt: ledParticipantDisplayName(item.nama),
    });
    try {
      await whenReady;
    } catch {
      if (mountGenerationRef.current !== myGen) return;
      const recovered = await waitUntilLedMediaReady(item.url, {
        maxWaitMs: 45_000,
      });
      if (!recovered || mountGenerationRef.current !== myGen) return;
    }
    if (mountGenerationRef.current !== myGen) return;
    if (stateRef.current.current?.queue_id !== item.queue_id) return;
    media.replaceChildren();
    if (element instanceof HTMLVideoElement) {
      element.muted = true;
      element.playsInline = true;
      element.autoplay = true;
      element.play().catch(() => {});
    }
    media.append(element);
    shownIdRef.current = item.queue_id;
    restartBar(
      remaining,
      itemPlayMs(
        item,
        stateRef.current.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
        cityvisionMode,
      ),
    );
  }

  /** Pauses timers / pulls (Cityvision end-of-slot freeze, Broadsign gate, etc.). */
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

  /**
   * Only gate React queue UI + talent mount — must NOT clear queue when `slotFrozen`, or the screen
   * falls back to `useOfflineDummyFallback` (always Natasha) while refs still hold a stalled rotation.
   */
  function renderPlaybackBlocked() {
    if (!playbackEnabled) {
      return true;
    }
    if (holdLiveLayout) {
      return true;
    }
    return !introDoneRef.current;
  }

  function render(remaining?: number) {
    const state = stateRef.current;
    if (renderPlaybackBlocked()) {
      mountGenerationRef.current += 1;
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
      mountGenerationRef.current += 1;
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
      nama: ledParticipantDisplayName(state.current.nama),
      loc: state.locationName,
      pos: `${state.upcoming.length} di belakang`,
      playbackUrl: state.current.url,
      playbackQueueId: state.current.queue_id,
      playMs: itemPlayMs(
        state.current,
        state.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
        cityvisionMode,
      ),
    });

    if (shownIdRef.current !== state.current.queue_id) {
      const duration = capPlayMsForSlot(
        itemPlayMs(
          state.current,
          state.playMs,
          sencySequenceMode,
          sequenceLivePlayMsRef.current,
          cityvisionMode,
        ),
      );
      enqueue(async () => {
        await mount(state.current!, remaining ?? duration);
      });
    }
  }

  async function pull(options?: { replay?: boolean; force?: boolean }) {
    const state = stateRef.current;
    if (state.pulling) return;
    if (!options?.force && fetchQueueDuringIntroOnly()) return;
    const free = slots();
    if (free <= 0) return;
    const askReplay = options?.replay ?? false;
    if (askReplay && state.preferFresh && state.queued > 0) {
      return;
    }
    state.pulling = true;
    try {
      const res = await fetch(
        buildLedNextUrl(apiBaseUrl, code, { limit: free, replay: askReplay }),
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
        state.preferFresh = false;
        for (const item of data.items) {
          if (!held(item.queue_id) && slots() > 0) {
            state.upcoming.push(item);
            buffered.push(item);
          }
        }
      } else if (data.mode === "replay" && askReplay) {
        const replayItems = replayItemsForPlayback(
          data.items,
          sencySequenceMode,
        );
        state.replaying = true;
        state.replayLoop = replayItems;
        state.upcoming = replayItems.slice();
        state.hint = false;
        buffered.push(...replayItems);
      }
      if (buffered.length > 0) {
        void preloadLedQueueItems(buffered);
      }
      persist();
      await kickQueueAfterPull();
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
    if (timerArmBlocked()) {
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
        cityvisionMode,
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

  /**
   * After a successful `/next` pull during live, move off dummy/idle if we now have real items.
   * (During intro, `fillQueueDuringIntro` uses `pull({ force: true })`; live segment used to skip
   * pull entirely so reconnect could leave dummy/filler on screen with items stuck in API queue.)
   */
  async function kickQueueAfterPull() {
    if (!introDoneRef.current || playbackBlocked()) return;
    const state = stateRef.current;
    if (!state.upcoming.length) return;
    if (!state.current) {
      await startIfIdle();
      return;
    }
    if (!isDummyQueueItem(state.current)) return;

    mountGenerationRef.current += 1;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = 0;
    }

    const next = await takeNextReadyQueueItem();
    if (!next) return;

    state.current = next;
    state.startedAt = Date.now();
    shownIdRef.current = null;
    if (!isDummyQueueItem(next)) {
      liveHadPlaybackRef.current = true;
    }
    if (state.current?.url?.trim()) {
      void preloadLedMediaUrl(state.current.url);
    }
    persist();
    void preloadLedQueueItems(state.upcoming);
    arm(
      itemPlayMs(
        state.current,
        state.playMs,
        sencySequenceMode,
        sequenceLivePlayMsRef.current,
        cityvisionMode,
      ),
    );
    render();
  }

  async function startIfIdle() {
    const state = stateRef.current;
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
        const rotation = buildDummyRotationQueueItems();
        state.current = rotation[0]!;
        state.upcoming = rotation.slice(1);
        dummyPlayedThisLiveRef.current = true;
        liveHadPlaybackRef.current = true;
        state.startedAt = Date.now();
        persist();
        void preloadLedQueueItems(state.upcoming);
        for (const d of rotation) {
          void preloadLedMediaUrl(d.url);
        }
        arm(
          itemPlayMs(
            state.current,
            state.playMs,
            sencySequenceMode,
            sequenceLivePlayMsRef.current,
            cityvisionMode,
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
    state.current = await takeNextReadyQueueItem();
    if (state.current && !isDummyQueueItem(state.current)) {
      liveHadPlaybackRef.current = true;
    }
    if (state.current?.url?.trim()) {
      void preloadLedMediaUrl(state.current.url);
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
        cityvisionMode,
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
      mountGenerationRef.current += 1;
      mediaRef.current?.replaceChildren();
      if (state.upcoming.length > 0) {
        const nextInRotation = state.upcoming.shift()!;
        state.current = nextInRotation;
        state.startedAt = Date.now();
        shownIdRef.current = null;
        persist();
        if (nextInRotation.url?.trim()) {
          void preloadLedMediaUrl(nextInRotation.url);
        }
        arm(
          itemPlayMs(
            state.current,
            state.playMs,
            sencySequenceMode,
            sequenceLivePlayMsRef.current,
            cityvisionMode,
          ),
        );
        render();
        return;
      }
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
      state.current = await takeNextReadyQueueItem();
      state.startedAt = Date.now();
      shownIdRef.current = null;
      persist();
      if (!state.current) {
        mountGenerationRef.current += 1;
        await startIfIdle();
        return;
      }
      void preloadLedQueueItems(state.upcoming);
      if (state.current && !isDummyQueueItem(state.current)) {
        liveHadPlaybackRef.current = true;
      }
      if (state.current?.url?.trim()) {
        void preloadLedMediaUrl(state.current.url);
      }
      arm(
        itemPlayMs(
          state.current,
          state.playMs,
          sencySequenceMode,
          sequenceLivePlayMsRef.current,
          cityvisionMode,
        ),
      );
      return;
    }

    mountGenerationRef.current += 1;
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
    if (state.current.url?.trim() && !isDummyQueueItem(state.current)) {
      await waitUntilLedMediaReady(state.current.url, { maxWaitMs: 60_000 });
    }
    const duration = itemPlayMs(
      state.current,
      state.playMs,
      sencySequenceMode,
      sequenceLivePlayMsRef.current,
      cityvisionMode,
    );
    const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
    const remaining = duration - elapsed;
    if (remaining < 250) await finish();
    else arm(remaining);
  }

  useEffect(() => {
    void preloadLedMediaUrl(dummyTalentUrl);
    for (const d of LED_DUMMY_ROTATION) {
      void preloadLedMediaUrl(d.assetPath);
    }
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
      freezePlaybackForNetworkLoss();
    });

    socket.on("connect", () => {
      setConnectionStatus((prev) =>
        prev === "reconnecting" || prev === "standby" || prev === "error"
          ? "reconnecting"
          : "connecting",
      );
      resumePlaybackAfterNetworkRestore();
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
        resumePlaybackAfterNetworkRestore();
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
          if (introDoneRef.current) {
            const st = stateRef.current;
            while (slots() > 0) {
              const before = st.upcoming.length;
              await pull({ replay: false, force: true });
              if (st.upcoming.length === before) break;
            }
            await kickQueueAfterPull();
          } else {
            await fillQueueDuringIntro();
          }
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
        const queued = msg.queued ?? state.queued;
        state.queued = queued;
        if (queued > 0) {
          state.preferFresh = true;
        }
        if (introDoneRef.current) {
          if (queued > 0) {
            await pullFreshWhenHinted();
          }
          if (
            !sencySequenceMode &&
            !state.current &&
            !state.upcoming.length &&
            !state.replaying &&
            queued > 0
          ) {
            runIntroCycle();
            return;
          }
          render();
          if (!state.current) await startIfIdle();
          return;
        }
        if (state.replaying && queued > 0) {
          state.replaying = false;
          state.replayLoop = [];
        }
        await fillQueueDuringIntro();
        if (!state.current) await startIfIdle();
        else render();
      });
    });

    socket.on("disconnect", () => {
      setConnectionStatus("reconnecting");
      freezePlaybackForNetworkLoss();
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
