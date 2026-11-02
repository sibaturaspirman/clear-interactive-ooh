import type { CSSProperties } from "react";
import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LedSudirmanLayerImage } from "@/components/led/sudirman/LedSudirmanLayerImage";
import { sudirmanBoxStyle } from "@/lib/led/sudirman/sudirman-box";
import {
  SUDIRMAN_ASSETS,
  SUDIRMAN_LAYOUT_STATIC,
  SUDIRMAN_LIVE_ENTER_MS,
  SUDIRMAN_LIVE_SLIDE_OFFSET_PX,
  SUDIRMAN_STATIC_FADE_OUT_MS,
  SUDIRMAN_STATIC_TALENT_ZOOM_MS,
} from "@/lib/led/sudirman/sudirman-layout";

type LedSudirmanStaticScreenProps = {
  disableAnimations?: boolean;
  exiting?: boolean;
};

/** Intro-only layers (bg in `LedSudirmanSharedLayers`). */
export function LedSudirmanStaticScreen({
  disableAnimations = false,
  exiting = false,
}: LedSudirmanStaticScreenProps) {
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
          animationDuration: `${SUDIRMAN_STATIC_TALENT_ZOOM_MS}ms`,
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
        "--bei-slide-offset": `${SUDIRMAN_LIVE_SLIDE_OFFSET_PX}px`,
        "--bei-live-enter-ms": `${SUDIRMAN_LIVE_ENTER_MS}ms`,
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
        style={{ ...sudirmanBoxStyle(SUDIRMAN_LAYOUT_STATIC.pack), ...packSlideVars }}
      >
        <LedSudirmanLayerImage
          src={SUDIRMAN_ASSETS.pack}
          alt=""
          box={SUDIRMAN_LAYOUT_STATIC.pack}
          fillSlot
          className="object-contain object-left-top"
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${contentExitClass}`.trim()}
        style={
          contentExitClass
            ? ({
                "--bei-static-fade-out-ms": `${SUDIRMAN_STATIC_FADE_OUT_MS}ms`,
              } as CSSProperties)
            : undefined
        }
      >
        <LedSudirmanLayerImage
          src={SUDIRMAN_ASSETS.clearStatic}
          alt="Clear x Oracle Red Bull Racing"
          box={SUDIRMAN_LAYOUT_STATIC.clear}
          className="object-contain object-left-top"
        />
        <div
          className={talentClass}
          style={{
            left: SUDIRMAN_LAYOUT_STATIC.talent.left,
            top: SUDIRMAN_LAYOUT_STATIC.talent.top,
            width: SUDIRMAN_LAYOUT_STATIC.talent.width,
            height: SUDIRMAN_LAYOUT_STATIC.talent.height,
            ...talentStyle,
          }}
        >
          <div className="relative size-full">
            <LedPublicImage
              src={SUDIRMAN_ASSETS.talent}
              alt=""
              fill
              className="object-contain object-bottom"
              sizes={`${SUDIRMAN_LAYOUT_STATIC.talent.width}px`}
            />
          </div>
        </div>
        <div className="absolute" style={sudirmanBoxStyle(SUDIRMAN_LAYOUT_STATIC.text)}>
          <LedSudirmanLayerImage
            src={SUDIRMAN_ASSETS.text}
            alt="Official shampoo partner of Oracle Red Bull Racing"
            box={SUDIRMAN_LAYOUT_STATIC.text}
            fillSlot
            className="object-contain object-left-bottom"
          />
        </div>
      </div>
    </div>
  );
}
