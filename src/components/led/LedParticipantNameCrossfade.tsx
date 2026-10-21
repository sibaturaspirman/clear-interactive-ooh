"use client";

import type { CSSProperties } from "react";

import { LedParticipantNameText } from "@/components/led/LedParticipantNameText";
import {
  participantNameSlotBox,
  type LedParticipantNameSlot,
} from "@/lib/led/participant-name-layout";
import { useLedSubmissionPlaybackFade } from "@/lib/led/useLedSubmissionPlaybackFade";

type LedParticipantNameCrossfadeProps = {
  slot: LedParticipantNameSlot;
  nama?: string;
  playbackQueueId?: number | null;
  playMs?: number;
  disableAnimations?: boolean;
  /** `?debug=live` — show name without queue-driven fade. */
  layoutDebug?: boolean;
};

export function LedParticipantNameCrossfade({
  slot,
  nama,
  playbackQueueId = null,
  playMs = 3000,
  disableAnimations = false,
  layoutDebug = false,
}: LedParticipantNameCrossfadeProps) {
  const display = nama?.trim();
  const isSubmission = Boolean(display && playbackQueueId != null);

  const { fadeMode, fadeInMs, fadeOutMs } = useLedSubmissionPlaybackFade({
    isSubmission,
    playbackQueueId,
    playMs,
    disableAnimations,
    layoutDebug: layoutDebug && Boolean(display),
  });

  if (!display) {
    return null;
  }

  if (!layoutDebug && !isSubmission && fadeMode === "hidden") {
    return null;
  }

  const fadeClass =
    fadeMode === "in"
      ? "led-bei-live-talent-fade led-bei-live-talent-fade--in-subtle"
      : fadeMode === "out"
        ? "led-bei-live-talent-fade led-bei-live-talent-fade--out"
        : fadeMode === "show"
          ? "led-bei-live-talent-fade led-bei-live-talent-fade--show"
          : "led-bei-live-talent-fade";

  return (
    <div
      className="pointer-events-none absolute z-[4]"
      style={participantNameSlotBox(slot) as CSSProperties}
      data-led-layer="participantName"
    >
      <div
        className={`size-full ${fadeClass}`}
        style={
          fadeMode === "in"
            ? ({
                "--bei-live-talent-fade-in-ms": `${fadeInMs}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <LedParticipantNameText
          nama={display}
          fontSize={slot.fontSize}
          rotate={slot.rotate}
        />
      </div>
    </div>
  );
}
