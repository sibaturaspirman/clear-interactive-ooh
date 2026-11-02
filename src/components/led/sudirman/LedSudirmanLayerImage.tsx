import { LedPublicImage } from "@/components/led/LedPublicImage";
import { sudirmanBoxStyle, type SudirmanBox } from "@/lib/led/sudirman/sudirman-box";

type LedSudirmanLayerImageProps = {
  src: string;
  alt: string;
  box: SudirmanBox;
  className?: string;
  unoptimized?: boolean;
  /** Image fills parent slot (0,0) — use inside `LedSudirmanLiveAnimatedLayer`. */
  fillSlot?: boolean;
};

export function LedSudirmanLayerImage({
  src,
  alt,
  box,
  className,
  unoptimized,
  fillSlot = false,
}: LedSudirmanLayerImageProps) {
  const slotStyle = fillSlot
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : sudirmanBoxStyle(box);

  return (
    <div style={slotStyle} data-bei-fill-slot={fillSlot || undefined}>
      <div className="relative size-full">
        <LedPublicImage
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
