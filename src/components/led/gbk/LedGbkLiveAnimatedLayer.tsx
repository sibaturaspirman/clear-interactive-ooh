"use client";

import type { CSSProperties, ReactNode } from "react";

import { gbkBoxStyle, type GbkBox } from "@/lib/led/gbk/gbk-box";
import {
  GBK_LIVE_ENTER_MS,
  GBK_LIVE_LAYER_FADE_MS,
  GBK_LIVE_SLIDE_OFFSET_PX,
  GBK_LIVE_STAGGER_MS,
} from "@/lib/led/gbk/gbk-layout";

export type BeiLiveSlideEnter = "left" | "right";

type LedGbkLiveAnimatedLayerProps = {
  box: GbkBox;
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

export function LedGbkLiveAnimatedLayer({
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
}: LedGbkLiveAnimatedLayerProps) {
  const motionOff = disableAnimations;
  const staggerMs = enterOrder * GBK_LIVE_STAGGER_MS;
  const slideVars = {
    "--bei-slide-offset": `${GBK_LIVE_SLIDE_OFFSET_PX}px`,
    "--bei-live-enter-ms": `${GBK_LIVE_ENTER_MS}ms`,
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
    ...gbkBoxStyle(box),
    ...slideVars,
    ...(useSlide
      ? {
          animationDelay: motionOff ? "0ms" : `${staggerMs}ms`,
        }
      : {
          transitionDuration: motionOff
            ? "0ms"
            : `${GBK_LIVE_LAYER_FADE_MS}ms, ${GBK_LIVE_ENTER_MS}ms`,
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
