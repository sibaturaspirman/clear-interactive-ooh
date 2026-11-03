"use client";

import { useEffect, useState } from "react";

import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LED_OUTRO_FADE_IN_MS } from "@/lib/led/led-sequence-loop";

type LedEndJpgOutroScreenProps = {
  endSrc?: string;
  canvasWidth: number;
  active: boolean;
  disableAnimations?: boolean;
  cycleKey?: number;
  fadeInMs?: number;
};

/** Penutup — full-frame end JPG fade-in. */
export function LedEndJpgOutroScreen({
  endSrc,
  canvasWidth,
  active,
  disableAnimations = false,
  cycleKey = 0,
  fadeInMs = LED_OUTRO_FADE_IN_MS,
}: LedEndJpgOutroScreenProps) {
  const fadeMs = disableAnimations ? 0 : fadeInMs;
  const [visible, setVisible] = useState(disableAnimations && active);

  useEffect(() => {
    if (!active || !endSrc) {
      setVisible(false);
      return;
    }
    if (disableAnimations) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [active, disableAnimations, cycleKey, endSrc]);

  if (!endSrc || (!active && !visible)) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden transition-opacity ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${fadeMs}ms`,
        visibility: active ? "visible" : "hidden",
      }}
      aria-hidden={!active}
    >
      <LedPublicImage
        key={`outro-${cycleKey}`}
        src={endSrc}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${canvasWidth}px`}
      />
    </div>
  );
}
