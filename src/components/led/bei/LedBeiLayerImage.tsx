import Image from "next/image";

import { beiBoxStyle, type BeiBox } from "@/lib/led/bei/bei-box";

type LedBeiLayerImageProps = {
  src: string;
  alt: string;
  box: BeiBox;
  className?: string;
  unoptimized?: boolean;
  /** Image fills parent slot (0,0) — use inside `LedBeiLiveAnimatedLayer`. */
  fillSlot?: boolean;
};

export function LedBeiLayerImage({
  src,
  alt,
  box,
  className,
  unoptimized,
  fillSlot = false,
}: LedBeiLayerImageProps) {
  const slotStyle = fillSlot
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : beiBoxStyle(box);

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
