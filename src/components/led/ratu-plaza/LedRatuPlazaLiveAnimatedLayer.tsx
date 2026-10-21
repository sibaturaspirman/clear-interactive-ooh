"use client";

import type { CSSProperties, ReactNode } from "react";

import { ratuPlazaBoxStyle, type RatuPlazaBox } from "@/lib/led/ratu-plaza/ratu-plaza-box";
import {
  RATU_PLAZA_LIVE_ENTER_MS,
  RATU_PLAZA_LIVE_LAYER_FADE_MS,
  RATU_PLAZA_LIVE_SLIDE_OFFSET_PX,
  RATU_PLAZA_LIVE_STAGGER_MS,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";

export type BeiLiveSlideEnter = "left" | "right";

type LedRatuPlazaLiveAnimatedLayerProps = {
  box: RatuPlazaBox;
  layerId?: string;
  enterOrder?: number;
  visible?: boolean;
  liveEntered: boolean;
  disableAnimations?: boolean;
  className?: string;
  /** Horizontal fade + slide on enter (replaces default rise-in). */
  slideEnter?: BeiLiveSlideEnter;
  /** Slide out to the left (e.g. packGroup before intro). */
  slideExitLeft?: boolean;
  exiting?: boolean;
  children: ReactNode;
};

export function LedRatuPlazaLiveAnimatedLayer({
  box,
  enterOrder = 0,
  visible = true,
  liveEntered,
  disableAnimations = false,
  className,
  layerId,
  slideEnter,
  slideExitLeft = false,
  exiting = false,
  children,
}: LedRatuPlazaLiveAnimatedLayerProps) {
  const motionOff = disableAnimations;
  const staggerMs = enterOrder * RATU_PLAZA_LIVE_STAGGER_MS;
  const slideVars = {
    "--bei-slide-offset": `${RATU_PLAZA_LIVE_SLIDE_OFFSET_PX}px`,
    "--bei-live-enter-ms": `${RATU_PLAZA_LIVE_ENTER_MS}ms`,
    "--bei-enter-delay": `${staggerMs}ms`,
  } as CSSProperties;

  let motionClass = "led-bei-live-layer";

  if (motionOff) {
    motionClass += visible ? " led-bei-live-layer--visible" : "";
  } else if (slideExitLeft && exiting) {
    motionClass += " led-bei-live-layer--slide-out-left";
  } else if (slideEnter && liveEntered && visible) {
    motionClass +=
      slideEnter === "right"
        ? " led-bei-live-layer--slide-in-right"
        : " led-bei-live-layer--slide-in-left";
  } else if (slideEnter && !liveEntered) {
    motionClass +=
      slideEnter === "right"
        ? " led-bei-live-layer--slide-pending-right"
        : " led-bei-live-layer--slide-pending-left";
  } else {
    motionClass += liveEntered
      ? " led-bei-live-layer--visible"
      : "";
  }

  const useSlide = Boolean(slideEnter) || slideExitLeft;
  const style: CSSProperties = {
    ...ratuPlazaBoxStyle(box),
    ...slideVars,
    ...(useSlide
      ? {
          animationDelay: motionOff ? "0ms" : `${staggerMs}ms`,
        }
      : {
          transitionDuration: motionOff
            ? "0ms"
            : `${RATU_PLAZA_LIVE_LAYER_FADE_MS}ms, ${RATU_PLAZA_LIVE_ENTER_MS}ms`,
          transitionDelay: motionOff ? "0ms" : `${staggerMs}ms, ${staggerMs}ms`,
          opacity: visible ? (motionOff || liveEntered ? 1 : 0) : 0,
        }),
    pointerEvents: visible ? undefined : "none",
  };

  return (
    <div
      className={`${motionClass}${className ? ` ${className}` : ""}`}
      style={style}
      data-bei-layer={layerId}
      data-bei-left={box.left}
      data-bei-top={box.top}
    >
      <div className="relative size-full">{children}</div>
    </div>
  );
}
