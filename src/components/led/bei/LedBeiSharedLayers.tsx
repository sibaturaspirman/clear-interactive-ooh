import Image from "next/image";

import { LedBeiLayerImage } from "@/components/led/bei/LedBeiLayerImage";
import {
  BEI_ASSETS,
  BEI_CANVAS,
  BEI_LAYOUT_SHARED,
} from "@/lib/led/bei/bei-layout";

/** Background + logo — same for intro static and live (no fade on transition). */
export function LedBeiSharedLayers() {
  return (
    <>
      <Image
        src={BEI_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${BEI_CANVAS.width}px`}
      />
      <LedBeiLayerImage
        src={BEI_ASSETS.clear}
        alt="Clear x Oracle Red Bull Racing"
        box={BEI_LAYOUT_SHARED.clear}
        className="object-contain object-left-top"
      />
    </>
  );
}
