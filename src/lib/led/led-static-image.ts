/**
 * Bump when replacing files under `public/images/**` (same filename, new art).
 * Override at deploy: `NEXT_PUBLIC_LED_ASSET_VERSION`.
 */
export const LED_STATIC_ASSET_VERSION = "3";

/** Path without query — safe to pass into `ledStaticImage`. */
export function publicAssetPath(src: string): string {
  return src.split("?")[0] ?? src;
}

export function isPublicStaticAsset(src: string): boolean {
  return publicAssetPath(src).startsWith("/images/");
}

export function ledStaticImage(path: string): string {
  const version =
    process.env.NEXT_PUBLIC_LED_ASSET_VERSION?.trim() ||
    LED_STATIC_ASSET_VERSION;
  const base = publicAssetPath(path);
  if (!version) {
    return base;
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${encodeURIComponent(version)}`;
}

/** Cache-bust local `public/images` URLs (layout constants + `<Image src>`). */
export function ledAssetUrl(src: string): string {
  if (!isPublicStaticAsset(src)) {
    return src;
  }
  return ledStaticImage(publicAssetPath(src));
}
