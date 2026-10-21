import Image from "next/image";

import { gbkBoxStyle, type GbkBox } from "@/lib/led/gbk/gbk-box";

type LedGbkLayerImageProps = {
  src: string;
  alt: string;
  box: GbkBox;
  className?: string;
  unoptimized?: boolean;
  /** Image fills parent slot (0,0) — use inside `LedGbkLiveAnimatedLayer`. */
  fillSlot?: boolean;
};

export function LedGbkLayerImage({
  src,
  alt,
  box,
  className,
  unoptimized,
  fillSlot = false,
}: LedGbkLayerImageProps) {
  const slotStyle = fillSlot
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : gbkBoxStyle(box);

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
