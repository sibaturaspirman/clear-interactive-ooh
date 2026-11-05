export function parseMicrositeFotoDebug(
  fotoParam: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(fotoParam) ? fotoParam[0] : fotoParam;
  if (raw === undefined) {
    return false;
  }
  if (raw === "" || raw === "1" || raw === "true") {
    return true;
  }
  return raw !== "0" && raw !== "false";
}

/** Server-only: allow `?foto` pipeline (runs paid AI). */
export function canRunMicrositeFotoDebug(): boolean {
  const fotoFlag = process.env.MICROSITE_FOTO_DEBUG?.trim().toLowerCase();
  if (fotoFlag === "1" || fotoFlag === "true" || fotoFlag === "yes") {
    return true;
  }
  const testFlag = process.env.MICROSITE_TEST_BYPASS?.trim().toLowerCase();
  if (testFlag === "1" || testFlag === "true" || testFlag === "yes") {
    return true;
  }
  return process.env.NODE_ENV === "development";
}
