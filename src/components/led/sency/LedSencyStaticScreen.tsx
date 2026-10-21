import type { CSSProperties } from "react";
import Image from "next/image";

import { LedSencyLayerImage } from "@/components/led/sency/LedSencyLayerImage";
import { sencyBoxStyle } from "@/lib/led/sency/sency-box";
import {
  SENCY_ASSETS,
  SENCY_LAYOUT_STATIC,
  SENCY_LIVE_ENTER_MS,
  SENCY_LIVE_SLIDE_OFFSET_PX,
  SENCY_STATIC_FADE_OUT_MS,
  SENCY_STATIC_TALENT_ZOOM_MS,
} from "@/lib/led/sency/sency-layout";

type LedSencyStaticScreenProps = {
  disableAnimations?: boolean;
  exiting?: boolean;
};

/** Intro-only layers (bg + clear live in `LedSencySharedLayers`). */
export function LedSencyStaticScreen({
  disableAnimations = false,
  exiting = false,
}: LedSencyStaticScreenProps) {
  const layerClass = disableAnimations
    ? "led-bei-static-layer led-bei-static-layer--instant absolute inset-0"
    : exiting
      ? "led-bei-static-layer led-bei-static-layer--instant absolute inset-0"
      : "led-bei-static-layer led-bei-static-layer--enter absolute inset-0";

  const talentStyle = disableAnimations
    ? undefined
    : exiting
      ? undefined
      : ({
          animationDuration: `${SENCY_STATIC_TALENT_ZOOM_MS}ms`,
        } as CSSProperties);

  const contentExitClass =
    exiting && !disableAnimations ? "led-bei-static-exit-fade" : "";

  const packMotionClass = disableAnimations
    ? "led-bei-static-pack-motion"
    : exiting
      ? "led-bei-static-pack-motion led-bei-static-pack-motion--out-left"
      : "led-bei-static-pack-motion led-bei-static-pack-motion--in-right";

  const packSlideVars = disableAnimations
    ? undefined
    : ({
        "--bei-slide-offset": `${SENCY_LIVE_SLIDE_OFFSET_PX}px`,
        "--bei-live-enter-ms": `${SENCY_LIVE_ENTER_MS}ms`,
      } as CSSProperties);

  const talentClass = disableAnimations
    ? "absolute"
    : exiting
      ? "led-bei-talent-zoom led-bei-talent-zoom--hold absolute"
      : "led-bei-talent-zoom absolute";

  return (
    <div className={layerClass}>
      <div
        className={packMotionClass}
        style={{ ...sencyBoxStyle(SENCY_LAYOUT_STATIC.pack), ...packSlideVars }}
      >
        <LedSencyLayerImage
          src={SENCY_ASSETS.pack}
          alt=""
          box={SENCY_LAYOUT_STATIC.pack}
          fillSlot
          className="object-contain object-left-top"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${contentExitClass}`.trim()}
        style={
          contentExitClass
            ? ({
                "--bei-static-fade-out-ms": `${SENCY_STATIC_FADE_OUT_MS}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <div
          className={talentClass}
          style={{
            left: SENCY_LAYOUT_STATIC.talent.left,
            top: SENCY_LAYOUT_STATIC.talent.top,
            width: SENCY_LAYOUT_STATIC.talent.width,
            height: SENCY_LAYOUT_STATIC.talent.height,
            ...talentStyle,
          }}
        >
          <div className="relative size-full">
            <Image
              src={SENCY_ASSETS.talent}
              alt=""
              fill
              className="object-contain object-bottom"
              sizes={`${SENCY_LAYOUT_STATIC.talent.width}px`}
            />
          </div>
        </div>
        <div className="absolute" style={sencyBoxStyle(SENCY_LAYOUT_STATIC.text)}>
          <LedSencyLayerImage
            src={SENCY_ASSETS.text}
            alt="Official shampoo partner of Oracle Red Bull Racing"
            box={SENCY_LAYOUT_STATIC.text}
            fillSlot
            className="object-contain object-left-bottom"
          />
        </div>
      </div>
    </div>
  );
}
