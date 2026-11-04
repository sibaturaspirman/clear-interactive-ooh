/** Backdrop photo for `?overlay` (no camera required). */
export const MICROSITE_OVERLAY_PREVIEW_PHOTO = "/images/microsite/result.png";

export function parseMicrositeOverlayPreview(
  overlayParam: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(overlayParam) ? overlayParam[0] : overlayParam;
  if (raw === undefined) {
    return false;
  }
  if (raw === "" || raw === "1" || raw === "true") {
    return true;
  }
  return raw !== "0" && raw !== "false";
}
