import Image from "next/image";

import { LedDukuhAtasLayerImage } from "@/components/led/dukuh-atas/LedDukuhAtasLayerImage";
import {
  DUKUH_ATAS_ASSETS,
  DUKUH_ATAS_CANVAS,
  DUKUH_ATAS_LAYOUT_SHARED,
} from "@/lib/led/dukuh-atas/dukuh-atas-layout";

/** Background + logo — same for intro static and live (no fade on transition). */
export function LedDukuhAtasSharedLayers() {
  return (
    <>
      <Image
        src={DUKUH_ATAS_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${DUKUH_ATAS_CANVAS.width}px`}
      />
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
  );
}
