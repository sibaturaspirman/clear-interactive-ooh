import Image from "next/image";

import { LedRatuPlazaLayerImage } from "@/components/led/ratu-plaza/LedRatuPlazaLayerImage";
import {
  RATU_PLAZA_ASSETS,
  RATU_PLAZA_CANVAS,
  RATU_PLAZA_LAYOUT_SHARED,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";

/** Background + logo — same for intro static and live (no fade on transition). */
export function LedRatuPlazaSharedLayers() {
  return (
    <>
      <Image
        src={RATU_PLAZA_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${RATU_PLAZA_CANVAS.width}px`}
      />
      <LedRatuPlazaLayerImage
        src={RATU_PLAZA_ASSETS.clear}
        alt="Clear x Oracle Red Bull Racing"
        box={RATU_PLAZA_LAYOUT_SHARED.clear}
        className="object-contain object-left-top"
      />
    </>
  );
}
