import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LedRatuPlazaLayerImage } from "@/components/led/ratu-plaza/LedRatuPlazaLayerImage";
import {
  RATU_PLAZA_ASSETS,
  RATU_PLAZA_CANVAS,
  RATU_PLAZA_LAYOUT_SHARED,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";

type LedRatuPlazaSharedLayersProps = {
  /** Intro clear — hidden during live (`clearLive` on live screen). */
  showIntroClear?: boolean;
};

/** Background + optional intro clear logo. */
export function LedRatuPlazaSharedLayers({
  showIntroClear = true,
}: LedRatuPlazaSharedLayersProps) {
  return (
    <>
      <LedPublicImage
        src={RATU_PLAZA_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${RATU_PLAZA_CANVAS.width}px`}
      />
      {showIntroClear ? (
        <LedRatuPlazaLayerImage
          src={RATU_PLAZA_ASSETS.clear}
          alt="Clear x Oracle Red Bull Racing"
          box={RATU_PLAZA_LAYOUT_SHARED.clear}
          className="object-contain object-left-top"
        />
      ) : null}
    </>
  );
}
