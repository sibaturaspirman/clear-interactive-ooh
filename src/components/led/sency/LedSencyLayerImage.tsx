import Image from "next/image";

import { sencyBoxStyle, type SencyBox } from "@/lib/led/sency/sency-box";

type LedSencyLayerImageProps = {
  src: string;
  alt: string;
  box: SencyBox;
  className?: string;
  unoptimized?: boolean;
  /** Image fills parent slot (0,0) — use inside `LedSencyLiveAnimatedLayer`. */
  fillSlot?: boolean;
};

export function LedSencyLayerImage({
  src,
  alt,
  box,
  className,
  unoptimized,
  fillSlot = false,
}: LedSencyLayerImageProps) {
  const slotStyle = fillSlot
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : sencyBoxStyle(box);

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
