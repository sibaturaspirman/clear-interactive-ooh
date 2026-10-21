import Image from "next/image";

import { dukuhAtasBoxStyle, type DukuhAtasBox } from "@/lib/led/dukuh-atas/dukuh-atas-box";

type LedDukuhAtasLayerImageProps = {
  src: string;
  alt: string;
  box: DukuhAtasBox;
  className?: string;
  unoptimized?: boolean;
  /** Image fills parent slot (0,0) — use inside `LedDukuhAtasLiveAnimatedLayer`. */
  fillSlot?: boolean;
};

export function LedDukuhAtasLayerImage({
  src,
  alt,
  box,
  className,
  unoptimized,
  fillSlot = false,
}: LedDukuhAtasLayerImageProps) {
  const slotStyle = fillSlot
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : dukuhAtasBoxStyle(box);

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
