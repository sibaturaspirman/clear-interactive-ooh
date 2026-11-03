"use client";

import { useEffect, useState } from "react";

import { LedPublicImage } from "@/components/led/LedPublicImage";
import {
  GBK_ASSETS,
  GBK_CANVAS,
  GBK_OUTRO_FADE_IN_MS,
} from "@/lib/led/gbk/gbk-layout";

type LedGbkOutroScreenProps = {
  active: boolean;
  disableAnimations?: boolean;
  cycleKey?: number;
};

/** Penutup — full-frame `gbk-end.jpg` fade-in. */
export function LedGbkOutroScreen({
  active,
  disableAnimations = false,
  cycleKey = 0,
}: LedGbkOutroScreenProps) {
  const fadeMs = disableAnimations ? 0 : GBK_OUTRO_FADE_IN_MS;
  const [visible, setVisible] = useState(disableAnimations && active);

  useEffect(() => {
    if (!active) {
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
  }, [active, disableAnimations, cycleKey]);

  if (!active && !visible) {
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
        src={GBK_ASSETS.end}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${GBK_CANVAS.width}px`}
      />
    </div>
  );
}
