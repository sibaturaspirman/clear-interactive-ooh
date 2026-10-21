/** Fixed portrait used when `?test` bypasses fal.ai (saves FAL tokens during QA). */
export const MICROSITE_TEST_RESULT_URL =
  "https://v3b.fal.media/files/b/0aaf3886/FcoZ_nVXVIaMZOAKS-moU_0d0HS7RF.png";

export function parseMicrositeTestBypass(
  testParam: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(testParam) ? testParam[0] : testParam;
  if (raw === undefined) {
    return false;
  }
  if (raw === "" || raw === "1" || raw === "true") {
    return true;
  }
  return raw !== "0" && raw !== "false";
}

/** Server-only: honor client test flag when explicitly allowed. */
export function canBypassFalGeneration(clientRequested: boolean): boolean {
  if (!clientRequested) {
    return false;
  }
  const flag = process.env.MICROSITE_TEST_BYPASS?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") {
    return true;
  }
  return process.env.NODE_ENV === "development";
}
