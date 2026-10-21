"use client";

import { useEffect, useRef, useState } from "react";

import {
  INTERACTIVE_LED_LIVE_TALENT_FADE_IN_MS,
  INTERACTIVE_LED_STATIC_FADE_OUT_MS,
} from "@/lib/led/interactive-led-timing";

export type LedSubmissionFadeMode = "hidden" | "show" | "in" | "out";

type UseLedSubmissionPlaybackFadeOptions = {
  /** Queue submission (sync with live talent photo). */
  isSubmission: boolean;
  playbackQueueId: number | null | undefined;
  playMs: number;
  disableAnimations?: boolean;
  /** Relayout / debug — hold visible, no cycle. */
  layoutDebug?: boolean;
  fadeInMs?: number;
  fadeOutMs?: number;
};

/** Same enter → hold → exit timing as `*TalentCrossfade`. */
export function useLedSubmissionPlaybackFade({
  isSubmission,
  playbackQueueId,
  playMs,
  disableAnimations = false,
  layoutDebug = false,
  fadeInMs = INTERACTIVE_LED_LIVE_TALENT_FADE_IN_MS,
  fadeOutMs = INTERACTIVE_LED_STATIC_FADE_OUT_MS,
}: UseLedSubmissionPlaybackFadeOptions) {
  const [fadeMode, setFadeMode] = useState<LedSubmissionFadeMode>(() => {
    if (layoutDebug) return "show";
    if (isSubmission) return disableAnimations ? "show" : "in";
    return "hidden";
  });

  const prevQueueIdRef = useRef<number | null>(null);
  const exitAtRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (exitAtRef.current) clearTimeout(exitAtRef.current);
    if (swapRef.current) clearTimeout(swapRef.current);
    exitAtRef.current = null;
    swapRef.current = null;
  }

  function startExitPhase() {
    setFadeMode("out");
  }

  function beginEnter(durationMs: number) {
    setFadeMode("in");
    exitAtRef.current = setTimeout(() => {
      startExitPhase();
    }, Math.max(0, durationMs - fadeOutMs));
  }

  useEffect(() => {
    clearTimers();

    if (layoutDebug) {
      prevQueueIdRef.current = null;
      setFadeMode("show");
      return;
    }

    if (!isSubmission) {
      const hadPlayback = prevQueueIdRef.current != null;
      prevQueueIdRef.current = null;

      if (disableAnimations || !hadPlayback) {
        setFadeMode("hidden");
        return;
      }

      startExitPhase();
      swapRef.current = setTimeout(() => {
        setFadeMode("hidden");
      }, fadeOutMs);
      return clearTimers;
    }

    const queueId = playbackQueueId!;

    if (disableAnimations) {
      prevQueueIdRef.current = queueId;
      setFadeMode("show");
      return;
    }

    const prevId = prevQueueIdRef.current;
    prevQueueIdRef.current = queueId;

    if (prevId != null && prevId !== queueId) {
      startExitPhase();
      swapRef.current = setTimeout(() => {
        beginEnter(playMs);
      }, fadeOutMs);
      return clearTimers;
    }

    beginEnter(playMs);
    return clearTimers;
  }, [
    isSubmission,
    playbackQueueId,
    playMs,
    disableAnimations,
    layoutDebug,
    fadeOutMs,
  ]);

  return { fadeMode, fadeInMs, fadeOutMs };
}
