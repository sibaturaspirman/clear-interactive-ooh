import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LedSencyLayerImage } from "@/components/led/sency/LedSencyLayerImage";
import {
  SENCY_ASSETS,
  SENCY_CANVAS,
  SENCY_LAYOUT_SHARED,
} from "@/lib/led/sency/sency-layout";

type LedSencySharedLayersProps = {
  /** Intro clear logo — hidden during live (live uses `clearLive`). */
  showIntroClear?: boolean;
};

/** Background + optional intro clear logo. */
export function LedSencySharedLayers({
  showIntroClear = true,
}: LedSencySharedLayersProps) {
  return (
    <>
      <LedPublicImage
        src={SENCY_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${SENCY_CANVAS.width}px`}
      />
      {showIntroClear ? (
        <LedSencyLayerImage
          src={SENCY_ASSETS.clear}
          alt="Clear x Oracle Red Bull Racing"
          box={SENCY_LAYOUT_SHARED.clear}
          className="object-contain object-left-top"
        />
      ) : null}
    </>
  );
}
