import Image from "next/image";

import { ratuPlazaBoxStyle, type RatuPlazaBox } from "@/lib/led/ratu-plaza/ratu-plaza-box";

type LedRatuPlazaLayerImageProps = {
  src: string;
  alt: string;
  box: RatuPlazaBox;
  className?: string;
  unoptimized?: boolean;
  /** Image fills parent slot (0,0) — use inside `LedRatuPlazaLiveAnimatedLayer`. */
  fillSlot?: boolean;
};

export function LedRatuPlazaLayerImage({
  src,
  alt,
  box,
  className,
  unoptimized,
  fillSlot = false,
}: LedRatuPlazaLayerImageProps) {
  const slotStyle = fillSlot
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : ratuPlazaBoxStyle(box);

  return (
    <div style={slotStyle} data-bei-fill-slot={fillSlot || undefined}>
      <div className="relative size-full">
        <Image
          src={src}
          alt={alt}
          fill
          className={className ?? "object-contain"}
          unoptimized={unoptimized}
          sizes={`${box.width}px`}
        />
      </div>
    </div>
  );
}
