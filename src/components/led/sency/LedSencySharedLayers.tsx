import Image from "next/image";

import { LedSencyLayerImage } from "@/components/led/sency/LedSencyLayerImage";
import {
  SENCY_ASSETS,
  SENCY_CANVAS,
  SENCY_LAYOUT_SHARED,
} from "@/lib/led/sency/sency-layout";

/** Background + logo — same for intro static and live (no fade on transition). */
export function LedSencySharedLayers() {
  return (
    <>
      <Image
        src={SENCY_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${SENCY_CANVAS.width}px`}
      />
      <LedSencyLayerImage
        src={SENCY_ASSETS.clear}
        alt="Clear x Oracle Red Bull Racing"
        box={SENCY_LAYOUT_SHARED.clear}
        className="object-contain object-left-top"
      />
    </>
  );
}
