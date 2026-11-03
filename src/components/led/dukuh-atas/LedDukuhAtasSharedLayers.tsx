import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LedDukuhAtasLayerImage } from "@/components/led/dukuh-atas/LedDukuhAtasLayerImage";
import {
  DUKUH_ATAS_ASSETS,
  DUKUH_ATAS_CANVAS,
  DUKUH_ATAS_LAYOUT_SHARED,
} from "@/lib/led/dukuh-atas/dukuh-atas-layout";

type LedDukuhAtasSharedLayersProps = {
  /** Intro dual clear — hidden during live (`clearLive` in live screen). */
  showIntroClear?: boolean;
};

/** Background + optional intro dual clear. */
export function LedDukuhAtasSharedLayers({
  showIntroClear = true,
}: LedDukuhAtasSharedLayersProps) {
  return (
    <>
      <LedPublicImage
        src={DUKUH_ATAS_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${DUKUH_ATAS_CANVAS.width}px`}
      />
      {showIntroClear ? (
        <>
          <LedDukuhAtasLayerImage
            src={DUKUH_ATAS_ASSETS.clear}
            alt=""
            box={DUKUH_ATAS_LAYOUT_SHARED.clearLeft}
            className="object-contain object-left-top"
          />
          <LedDukuhAtasLayerImage
            src={DUKUH_ATAS_ASSETS.clear}
            alt=""
            box={DUKUH_ATAS_LAYOUT_SHARED.clearRight}
            className="object-contain object-left-top"
          />
        </>
      ) : null}
    </>
  );
}
