import type { CSSProperties } from "react";
import Image from "next/image";

import { LedRatuPlazaLayerImage } from "@/components/led/ratu-plaza/LedRatuPlazaLayerImage";
import { ratuPlazaBoxStyle } from "@/lib/led/ratu-plaza/ratu-plaza-box";
import {
  RATU_PLAZA_ASSETS,
  RATU_PLAZA_LAYOUT_STATIC,
  RATU_PLAZA_LIVE_ENTER_MS,
  RATU_PLAZA_LIVE_SLIDE_OFFSET_PX,
  RATU_PLAZA_STATIC_FADE_OUT_MS,
  RATU_PLAZA_STATIC_TALENT_ZOOM_MS,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";

type LedRatuPlazaStaticScreenProps = {
  disableAnimations?: boolean;
  exiting?: boolean;
};

/** Intro-only layers (bg + clear live in `LedRatuPlazaSharedLayers`). */
export function LedRatuPlazaStaticScreen({
  disableAnimations = false,
  exiting = false,
}: LedRatuPlazaStaticScreenProps) {
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
          animationDuration: `${RATU_PLAZA_STATIC_TALENT_ZOOM_MS}ms`,
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
        "--bei-slide-offset": `${RATU_PLAZA_LIVE_SLIDE_OFFSET_PX}px`,
        "--bei-live-enter-ms": `${RATU_PLAZA_LIVE_ENTER_MS}ms`,
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
        style={{ ...ratuPlazaBoxStyle(RATU_PLAZA_LAYOUT_STATIC.pack), ...packSlideVars }}
      >
        <LedRatuPlazaLayerImage
          src={RATU_PLAZA_ASSETS.pack}
          alt=""
          box={RATU_PLAZA_LAYOUT_STATIC.pack}
          fillSlot
          className="object-contain object-left-top"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${contentExitClass}`.trim()}
        style={
          contentExitClass
            ? ({
                "--bei-static-fade-out-ms": `${RATU_PLAZA_STATIC_FADE_OUT_MS}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <div
          className={talentClass}
          style={{
            left: RATU_PLAZA_LAYOUT_STATIC.talent.left,
            top: RATU_PLAZA_LAYOUT_STATIC.talent.top,
            width: RATU_PLAZA_LAYOUT_STATIC.talent.width,
            height: RATU_PLAZA_LAYOUT_STATIC.talent.height,
            ...talentStyle,
          }}
        >
          <div className="relative size-full">
            <Image
              src={RATU_PLAZA_ASSETS.talent}
              alt=""
              fill
              className="object-contain object-bottom"
              sizes={`${RATU_PLAZA_LAYOUT_STATIC.talent.width}px`}
            />
          </div>
        </div>
        <div className="absolute" style={ratuPlazaBoxStyle(RATU_PLAZA_LAYOUT_STATIC.text)}>
          <LedRatuPlazaLayerImage
            src={RATU_PLAZA_ASSETS.text}
            alt="Official shampoo partner of Oracle Red Bull Racing"
            box={RATU_PLAZA_LAYOUT_STATIC.text}
            fillSlot
            className="object-contain object-left-bottom"
          />
        </div>
      </div>
    </div>
  );
}
