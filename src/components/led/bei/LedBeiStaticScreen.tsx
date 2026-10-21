import type { CSSProperties } from "react";
import Image from "next/image";

import { LedBeiLayerImage } from "@/components/led/bei/LedBeiLayerImage";
import { beiBoxStyle } from "@/lib/led/bei/bei-box";
import {
  BEI_ASSETS,
  BEI_LAYOUT_STATIC,
  BEI_LIVE_ENTER_MS,
  BEI_LIVE_SLIDE_OFFSET_PX,
  BEI_STATIC_FADE_OUT_MS,
  BEI_STATIC_TALENT_ZOOM_MS,
} from "@/lib/led/bei/bei-layout";

type LedBeiStaticScreenProps = {
  disableAnimations?: boolean;
  exiting?: boolean;
};

/** Intro-only layers (bg + clear live in `LedBeiSharedLayers`). */
export function LedBeiStaticScreen({
  disableAnimations = false,
  exiting = false,
}: LedBeiStaticScreenProps) {
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
          animationDuration: `${BEI_STATIC_TALENT_ZOOM_MS}ms`,
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
        "--bei-slide-offset": `${BEI_LIVE_SLIDE_OFFSET_PX}px`,
        "--bei-live-enter-ms": `${BEI_LIVE_ENTER_MS}ms`,
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
        style={{ ...beiBoxStyle(BEI_LAYOUT_STATIC.pack), ...packSlideVars }}
      >
        <LedBeiLayerImage
          src={BEI_ASSETS.pack}
          alt=""
          box={BEI_LAYOUT_STATIC.pack}
          fillSlot
          className="object-contain object-left-top"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${contentExitClass}`.trim()}
        style={
          contentExitClass
            ? ({
                "--bei-static-fade-out-ms": `${BEI_STATIC_FADE_OUT_MS}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <div
          className={talentClass}
          style={{
            left: BEI_LAYOUT_STATIC.talent.left,
            top: BEI_LAYOUT_STATIC.talent.top,
            width: BEI_LAYOUT_STATIC.talent.width,
            height: BEI_LAYOUT_STATIC.talent.height,
            ...talentStyle,
          }}
        >
          <div className="relative size-full">
            <Image
              src={BEI_ASSETS.talent}
              alt=""
              fill
              className="object-contain object-bottom"
              sizes={`${BEI_LAYOUT_STATIC.talent.width}px`}
            />
          </div>
        </div>
        <div className="absolute" style={beiBoxStyle(BEI_LAYOUT_STATIC.text)}>
          <LedBeiLayerImage
            src={BEI_ASSETS.text}
            alt="Official shampoo partner of Oracle Red Bull Racing"
            box={BEI_LAYOUT_STATIC.text}
            fillSlot
            className="object-contain object-left-bottom"
          />
        </div>
      </div>
    </div>
  );
}
