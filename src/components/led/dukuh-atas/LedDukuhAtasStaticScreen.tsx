import type { CSSProperties } from "react";
import Image from "next/image";

import { LedDukuhAtasLayerImage } from "@/components/led/dukuh-atas/LedDukuhAtasLayerImage";
import { dukuhAtasBoxStyle } from "@/lib/led/dukuh-atas/dukuh-atas-box";
import {
  DUKUH_ATAS_ASSETS,
  DUKUH_ATAS_LAYOUT_STATIC,
  DUKUH_ATAS_LIVE_ENTER_MS,
  DUKUH_ATAS_LIVE_SLIDE_OFFSET_PX,
  DUKUH_ATAS_STATIC_FADE_OUT_MS,
  DUKUH_ATAS_STATIC_TALENT_ZOOM_MS,
} from "@/lib/led/dukuh-atas/dukuh-atas-layout";

type LedDukuhAtasStaticScreenProps = {
  disableAnimations?: boolean;
  exiting?: boolean;
};

/** Intro-only layers (bg + clear live in `LedDukuhAtasSharedLayers`). */
export function LedDukuhAtasStaticScreen({
  disableAnimations = false,
  exiting = false,
}: LedDukuhAtasStaticScreenProps) {
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
          animationDuration: `${DUKUH_ATAS_STATIC_TALENT_ZOOM_MS}ms`,
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
        "--bei-slide-offset": `${DUKUH_ATAS_LIVE_SLIDE_OFFSET_PX}px`,
        "--bei-live-enter-ms": `${DUKUH_ATAS_LIVE_ENTER_MS}ms`,
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
        style={{ ...dukuhAtasBoxStyle(DUKUH_ATAS_LAYOUT_STATIC.pack), ...packSlideVars }}
      >
        <LedDukuhAtasLayerImage
          src={DUKUH_ATAS_ASSETS.pack}
          alt=""
          box={DUKUH_ATAS_LAYOUT_STATIC.pack}
          fillSlot
          className="object-contain object-left-top"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${contentExitClass}`.trim()}
        style={
          contentExitClass
            ? ({
                "--bei-static-fade-out-ms": `${DUKUH_ATAS_STATIC_FADE_OUT_MS}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <div
          className={talentClass}
          style={{
            left: DUKUH_ATAS_LAYOUT_STATIC.talent.left,
            top: DUKUH_ATAS_LAYOUT_STATIC.talent.top,
            width: DUKUH_ATAS_LAYOUT_STATIC.talent.width,
            height: DUKUH_ATAS_LAYOUT_STATIC.talent.height,
            ...talentStyle,
          }}
        >
          <div className="relative size-full">
            <Image
              src={DUKUH_ATAS_ASSETS.talent}
              alt=""
              fill
              className="object-contain object-bottom"
              sizes={`${DUKUH_ATAS_LAYOUT_STATIC.talent.width}px`}
            />
          </div>
        </div>
        <div className="absolute" style={dukuhAtasBoxStyle(DUKUH_ATAS_LAYOUT_STATIC.text)}>
          <LedDukuhAtasLayerImage
            src={DUKUH_ATAS_ASSETS.text}
            alt="Official shampoo partner of Oracle Red Bull Racing"
            box={DUKUH_ATAS_LAYOUT_STATIC.text}
            fillSlot
            className="object-contain object-left-bottom"
          />
        </div>
      </div>
    </div>
  );
}
