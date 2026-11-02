import Image, { type ImageProps } from "next/image";

import {
  isPublicStaticAsset,
  ledAssetUrl,
} from "@/lib/led/led-static-image";

type LedPublicImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** Local `/images/**` assets get `?v=` + `unoptimized` so file swaps show without clearing `.next`. */
export function LedPublicImage({ src, unoptimized, ...props }: LedPublicImageProps) {
  const resolved = ledAssetUrl(src);
  const local = isPublicStaticAsset(src);

  return (
    <Image
      src={resolved}
      unoptimized={local ? true : unoptimized}
      {...props}
    />
  );
}
