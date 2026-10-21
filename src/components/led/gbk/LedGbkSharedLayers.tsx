import Image from "next/image";

import { LedGbkLayerImage } from "@/components/led/gbk/LedGbkLayerImage";
import {
  GBK_ASSETS,
  GBK_CANVAS,
  GBK_LAYOUT_SHARED,
} from "@/lib/led/gbk/gbk-layout";

/** Background + logo — same for intro static and live (no fade on transition). */
export function LedGbkSharedLayers() {
  return (
    <>
      <Image
        src={GBK_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${GBK_CANVAS.width}px`}
      />
      <LedGbkLayerImage
        src={GBK_ASSETS.clear}
        alt="Clear x Oracle Red Bull Racing"
        box={GBK_LAYOUT_SHARED.clear}
        className="object-contain object-left-top"
      />
    </>
  );
}
