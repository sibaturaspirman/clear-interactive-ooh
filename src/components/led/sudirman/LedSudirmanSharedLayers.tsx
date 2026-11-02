import { LedPublicImage } from "@/components/led/LedPublicImage";
import {
  SUDIRMAN_ASSETS,
  SUDIRMAN_CANVAS,
} from "@/lib/led/sudirman/sudirman-layout";

/** Background only — Clear logo is per phase (static vs live). */
export function LedSudirmanSharedLayers() {
  return (
    <LedPublicImage
      src={SUDIRMAN_ASSETS.background}
      alt=""
      fill
      className="object-cover"
      priority
      sizes={`${SUDIRMAN_CANVAS.width}px`}
    />
  );
}
