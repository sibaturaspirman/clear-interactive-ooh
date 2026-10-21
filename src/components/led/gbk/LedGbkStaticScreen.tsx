import type { CSSProperties } from "react";
import Image from "next/image";

import { LedGbkLayerImage } from "@/components/led/gbk/LedGbkLayerImage";
import { gbkBoxStyle } from "@/lib/led/gbk/gbk-box";
import {
  GBK_ASSETS,
  GBK_LAYOUT_STATIC,
  GBK_LIVE_ENTER_MS,
  GBK_LIVE_SLIDE_OFFSET_PX,
  GBK_STATIC_FADE_OUT_MS,
  GBK_STATIC_TALENT_ZOOM_MS,
} from "@/lib/led/gbk/gbk-layout";

type LedGbkStaticScreenProps = {
  disableAnimations?: boolean;
  exiting?: boolean;
};

/** Intro-only layers (bg + clear live in `LedGbkSharedLayers`). */
export function LedGbkStaticScreen({
  disableAnimations = false,
  exiting = false,
}: LedGbkStaticScreenProps) {
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
          animationDuration: `${GBK_STATIC_TALENT_ZOOM_MS}ms`,
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
        "--bei-slide-offset": `${GBK_LIVE_SLIDE_OFFSET_PX}px`,
        "--bei-live-enter-ms": `${GBK_LIVE_ENTER_MS}ms`,
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
        style={{ ...gbkBoxStyle(GBK_LAYOUT_STATIC.pack), ...packSlideVars }}
      >
        <LedGbkLayerImage
          src={GBK_ASSETS.pack}
          alt=""
          box={GBK_LAYOUT_STATIC.pack}
          fillSlot
          className="object-contain object-left-top"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${contentExitClass}`.trim()}
        style={
          contentExitClass
            ? ({
                "--bei-static-fade-out-ms": `${GBK_STATIC_FADE_OUT_MS}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <div
          className={talentClass}
          style={{
            left: GBK_LAYOUT_STATIC.talent.left,
            top: GBK_LAYOUT_STATIC.talent.top,
            width: GBK_LAYOUT_STATIC.talent.width,
            height: GBK_LAYOUT_STATIC.talent.height,
            ...talentStyle,
          }}
        >
          <div className="relative size-full">
            <Image
              src={GBK_ASSETS.talent}
              alt=""
              fill
              className="object-contain object-bottom"
              sizes={`${GBK_LAYOUT_STATIC.talent.width}px`}
            />
          </div>
        </div>
        <div className="absolute" style={gbkBoxStyle(GBK_LAYOUT_STATIC.text)}>
          <LedGbkLayerImage
            src={GBK_ASSETS.text}
            alt="Official shampoo partner of Oracle Red Bull Racing"
            box={GBK_LAYOUT_STATIC.text}
            fillSlot
            className="object-contain object-left-bottom"
          />
        </div>
      </div>
    </div>
  );
}
