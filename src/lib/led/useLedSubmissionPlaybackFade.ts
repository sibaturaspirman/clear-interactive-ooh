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
  /** Latest label from queue — applied on enter, not mid exit (matches talent `displaySrc`). */
  nama?: string;
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
  nama,
  disableAnimations = false,
  layoutDebug = false,
  fadeInMs = INTERACTIVE_LED_LIVE_TALENT_FADE_IN_MS,
  fadeOutMs = INTERACTIVE_LED_STATIC_FADE_OUT_MS,
}: UseLedSubmissionPlaybackFadeOptions) {
  const trimmedNama = nama?.trim() ?? "";

  const [displayNama, setDisplayNama] = useState(() => {
    if (layoutDebug) return trimmedNama;
    if (isSubmission) return trimmedNama;
    return "";
  });

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

  function beginEnter(durationMs: number, nextName: string) {
    setDisplayNama(nextName);
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
        setDisplayNama("");
        setFadeMode("hidden");
        return;
      }

      startExitPhase();
      swapRef.current = setTimeout(() => {
        setDisplayNama("");
        setFadeMode("hidden");
      }, fadeOutMs);
      return clearTimers;
    }

    const queueId = playbackQueueId!;
    const nextName = trimmedNama;

    if (disableAnimations) {
      prevQueueIdRef.current = queueId;
      setDisplayNama(nextName);
      setFadeMode("show");
      return;
    }

    const prevId = prevQueueIdRef.current;
    prevQueueIdRef.current = queueId;

    if (prevId != null && prevId !== queueId) {
      beginEnter(playMs, nextName);
      return clearTimers;
    }

    beginEnter(playMs, nextName);
    return clearTimers;
  }, [
    isSubmission,
    playbackQueueId,
    playMs,
    trimmedNama,
    disableAnimations,
    layoutDebug,
    fadeOutMs,
  ]);

  return { fadeMode, fadeInMs, fadeOutMs, displayNama };
}
