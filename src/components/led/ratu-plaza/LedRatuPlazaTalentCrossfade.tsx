"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { ratuPlazaBoxStyle } from "@/lib/led/ratu-plaza/ratu-plaza-box";
import {
  RATU_PLAZA_ASSETS,
  RATU_PLAZA_LAYOUT_LIVE,
  RATU_PLAZA_LIVE_STAGGER_MS,
  RATU_PLAZA_LIVE_TALENT_FADE_IN_MS,
  RATU_PLAZA_STATIC_FADE_OUT_MS,
  ratuPlazaLiveTalentZoomMs,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";

type FadeMode = "show" | "in" | "out";

type LedRatuPlazaTalentCrossfadeProps = {
  photoUrl?: string;
  /** Changes per queue item — drives fade/zoom cycle. */
  playbackQueueId?: number | null;
  playMs?: number;
  /** Idle placeholder when no API photo (e.g. layout dummy). */
  idleTalentSrc?: string;
  disableAnimations?: boolean;
  liveEntered?: boolean;
  enterOrder?: number;
};

/** Live talent — same motion language as intro: fade + slow 0.94→1 zoom, hold, fade out. */
export function LedRatuPlazaTalentCrossfade({
  photoUrl,
  playbackQueueId = null,
  playMs = 3000,
  idleTalentSrc,
  disableAnimations = false,
  liveEntered = true,
  enterOrder = 1,
}: LedRatuPlazaTalentCrossfadeProps) {
  const box = RATU_PLAZA_LAYOUT_LIVE.talent;
  const placeholder = idleTalentSrc || RATU_PLAZA_ASSETS.talent;
  const isSubmission = Boolean(photoUrl && playbackQueueId != null);

  const [displaySrc, setDisplaySrc] = useState(
    isSubmission ? photoUrl! : placeholder,
  );
  const [fadeMode, setFadeMode] = useState<FadeMode>(
    isSubmission ? "in" : "show",
  );
  const [zoomHold, setZoomHold] = useState(false);
  const [zoomGeneration, setZoomGeneration] = useState(0);
  const [zoomMs, setZoomMs] = useState(() => ratuPlazaLiveTalentZoomMs(playMs));

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
    setZoomHold(true);
    setFadeMode("out");
  }

  function beginEnter(url: string, durationMs: number) {
    const zoomDuration = ratuPlazaLiveTalentZoomMs(durationMs);
    setZoomMs(zoomDuration);
    setDisplaySrc(url);
    setZoomHold(false);
    setFadeMode("in");
    setZoomGeneration((gen) => gen + 1);
    exitAtRef.current = setTimeout(() => {
      startExitPhase();
    }, Math.max(0, durationMs - RATU_PLAZA_STATIC_FADE_OUT_MS));
  }

  useEffect(() => {
    clearTimers();

    if (!isSubmission) {
      const hadPlayback = prevQueueIdRef.current != null;
      prevQueueIdRef.current = null;

      if (disableAnimations || !hadPlayback) {
        setDisplaySrc(placeholder);
        setFadeMode("show");
        setZoomHold(false);
        return;
      }

      startExitPhase();
      swapRef.current = setTimeout(() => {
        setDisplaySrc(placeholder);
        setFadeMode("show");
        setZoomHold(false);
      }, RATU_PLAZA_STATIC_FADE_OUT_MS);
      return clearTimers;
    }

    const queueId = playbackQueueId!;
    const url = photoUrl!;

    if (disableAnimations) {
      prevQueueIdRef.current = queueId;
      setDisplaySrc(url);
      setFadeMode("show");
      setZoomHold(false);
      return;
    }

    const prevId = prevQueueIdRef.current;
    prevQueueIdRef.current = queueId;

    if (prevId != null && prevId !== queueId) {
      startExitPhase();
      swapRef.current = setTimeout(() => {
        beginEnter(url, playMs);
      }, RATU_PLAZA_STATIC_FADE_OUT_MS);
      return clearTimers;
    }

    beginEnter(url, playMs);
    return clearTimers;
  }, [
    isSubmission,
    photoUrl,
    playbackQueueId,
    playMs,
    placeholder,
    disableAnimations,
  ]);

  const isRemote = displaySrc.startsWith("http");
  const layerClass = [
    "led-bei-live-layer",
    disableAnimations || liveEntered ? "led-bei-live-layer--visible" : "",
    isSubmission ? "led-bei-live-talent-slot" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const fadeClass =
    fadeMode === "in"
      ? isSubmission
        ? "led-bei-live-talent-fade led-bei-live-talent-fade--in-subtle"
        : "led-bei-live-talent-fade led-bei-live-talent-fade--in"
      : fadeMode === "out"
        ? "led-bei-live-talent-fade led-bei-live-talent-fade--out"
        : "led-bei-live-talent-fade led-bei-live-talent-fade--show";

  const zoomClass =
    disableAnimations || (fadeMode === "show" && !isSubmission)
      ? "relative size-full"
      : isSubmission
        ? `led-bei-live-talent-zoom relative size-full${zoomHold ? " led-bei-live-talent-zoom--hold" : ""}`
        : `led-bei-talent-zoom relative size-full${zoomHold ? " led-bei-talent-zoom--hold" : ""}`;

  return (
    <div
      className={layerClass}
      style={{
        ...ratuPlazaBoxStyle(box),
        ...(isSubmission
          ? ({
              "--bei-live-talent-fade-in-ms": `${RATU_PLAZA_LIVE_TALENT_FADE_IN_MS}ms`,
            } as CSSProperties)
          : undefined),
        transitionDelay:
          disableAnimations || isSubmission
            ? "0ms"
            : `${enterOrder * RATU_PLAZA_LIVE_STAGGER_MS}ms, ${enterOrder * RATU_PLAZA_LIVE_STAGGER_MS}ms`,
      }}
      data-bei-layer="talent"
      data-bei-left={box.left}
      data-bei-top={box.top}
    >
      <div className="relative size-full overflow-hidden">
        <div className={fadeClass}>
          <div
            key={isSubmission ? zoomGeneration : displaySrc}
            className={zoomClass}
            style={
              isSubmission && !disableAnimations && !zoomHold
                ? ({
                    "--bei-live-talent-zoom-ms": `${zoomMs}ms`,
                  } as CSSProperties)
                : undefined
            }
          >
            <Image
              src={displaySrc}
              alt=""
              fill
              className="object-contain object-bottom"
              unoptimized={isRemote}
              sizes={`${box.width}px`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
