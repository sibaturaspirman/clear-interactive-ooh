import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LedGbkLayerImage } from "@/components/led/gbk/LedGbkLayerImage";
import {
  GBK_ASSETS,
  GBK_CANVAS,
  GBK_LAYOUT_SHARED,
} from "@/lib/led/gbk/gbk-layout";

type LedGbkSharedLayersProps = {
  showIntroClear?: boolean;
};

/** Background + optional intro clear logo. */
export function LedGbkSharedLayers({
  showIntroClear = true,
}: LedGbkSharedLayersProps) {
  return (
    <>
      <LedPublicImage
        src={GBK_ASSETS.background}
        alt=""
        fill
        className="object-cover"
        priority
        sizes={`${GBK_CANVAS.width}px`}
      />
      {showIntroClear ? (
        <LedGbkLayerImage
          src={GBK_ASSETS.clear}
          alt="Clear x Oracle Red Bull Racing"
          box={GBK_LAYOUT_SHARED.clear}
          className="object-contain object-left-top"
        />
      ) : null}
    </>
  );
}
