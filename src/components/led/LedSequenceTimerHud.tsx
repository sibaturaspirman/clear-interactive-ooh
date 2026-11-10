"use client";

import { useEffect, useState } from "react";

import type { InteractiveLedPlaybackPhase } from "@/components/led/interactive-led-player-shared";
import { LED_SEQUENCE } from "@/lib/led/led-sequence-loop";

type LedSequenceTimerHudProps = {
  phase: InteractiveLedPlaybackPhase;
  /** Bumps when a new intro cycle starts — resets cycle clock. */
  introCycleKey?: number;
};

type TimerSnapshot = {
  phase: InteractiveLedPlaybackPhase;
  introCycleKey: number;
  phaseStartedAt: number;
  cycleStartedAt: number;
  now: number;
};

const PHASE_LABEL: Record<InteractiveLedPlaybackPhase, string> = {
  static: "INTRO",
  live: "LIVE",
  outro: "END",
};

function expectedMs(phase: InteractiveLedPlaybackPhase): number {
  if (phase === "static") return LED_SEQUENCE.introMs;
  if (phase === "live") return LED_SEQUENCE.liveMs;
  return LED_SEQUENCE.outroMs;
}

function formatSec(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(2);
}

/**
 * Wall-clock proof for sequence loop: intro / live / end durations.
 * Enable with `/led/[code]?timer` (or Broadsign `?timer`).
 */
export function LedSequenceTimerHud({
  phase,
  introCycleKey = 0,
}: LedSequenceTimerHudProps) {
  const [snap, setSnap] = useState<TimerSnapshot | null>(null);

  useEffect(() => {
    const tick = () => {
      setSnap((prev) => {
        const t = Date.now();
        if (!prev) {
          return {
            phase,
            introCycleKey,
            phaseStartedAt: t,
            cycleStartedAt: t,
            now: t,
          };
        }

        let phaseStartedAt = prev.phaseStartedAt;
        let cycleStartedAt = prev.cycleStartedAt;
        if (prev.introCycleKey !== introCycleKey) {
          cycleStartedAt = t;
          phaseStartedAt = t;
        } else if (prev.phase !== phase) {
          phaseStartedAt = t;
        }

        return {
          phase,
          introCycleKey,
          phaseStartedAt,
          cycleStartedAt,
          now: t,
        };
      });
    };

    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [phase, introCycleKey]);

  if (!snap) {
    return null;
  }

  const expect = expectedMs(snap.phase);
  const phaseElapsed = snap.now - snap.phaseStartedAt;
  const phaseRemain = expect - phaseElapsed;
  const cycleElapsed = snap.now - snap.cycleStartedAt;
  const over = phaseElapsed > expect + 80;

  return (
    <div
      className={`led-sequence-timer led-sequence-timer--${snap.phase}${over ? " led-sequence-timer--over" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="led-sequence-timer__title">SEQUENCE TIMER</div>
      <div className="led-sequence-timer__phase">
        {PHASE_LABEL[snap.phase]}
      </div>
      <div className="led-sequence-timer__row">
        <span>phase</span>
        <strong>
          {formatSec(phaseElapsed)} / {formatSec(expect)}s
        </strong>
      </div>
      <div className="led-sequence-timer__row">
        <span>remain</span>
        <strong>{formatSec(phaseRemain)}s</strong>
      </div>
      <div className="led-sequence-timer__row">
        <span>cycle</span>
        <strong>
          {formatSec(cycleElapsed)} / {formatSec(LED_SEQUENCE.slotMs)}s
        </strong>
      </div>
      <div className="led-sequence-timer__expect">
        expect {formatSec(LED_SEQUENCE.introMs)}/
        {formatSec(LED_SEQUENCE.liveMs)}/
        {formatSec(LED_SEQUENCE.outroMs)}s
      </div>
    </div>
  );
}
