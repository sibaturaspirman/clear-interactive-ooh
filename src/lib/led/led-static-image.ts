/**
 * Bump when replacing files under `public/images/led/` (same filename, new art).
 * Override at deploy: `NEXT_PUBLIC_LED_ASSET_VERSION`.
 */
export const LED_STATIC_ASSET_VERSION = "2";

export function ledStaticImage(path: string): string {
  const version =
    process.env.NEXT_PUBLIC_LED_ASSET_VERSION?.trim() ||
    LED_STATIC_ASSET_VERSION;
  if (!version) {
    return path;
  }
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${encodeURIComponent(version)}`;
}
