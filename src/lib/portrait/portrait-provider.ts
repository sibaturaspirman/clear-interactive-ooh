import "server-only";

export type PortraitAiProvider = "fal" | "wavespeed";

/** Default when `PORTRAIT_PROVIDER` env is unset. */
export const PORTRAIT_PROVIDER_DEFAULT: PortraitAiProvider = "fal";

export function parsePortraitAiProvider(
  raw: string | undefined | null,
): PortraitAiProvider | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  if (value === "wavespeed" || value === "wave-speed" || value === "ws") {
    return "wavespeed";
  }
  if (value === "fal" || value === "fal.ai") {
    return "fal";
  }
  return undefined;
}

export function getPortraitProvider(): PortraitAiProvider {
  return parsePortraitAiProvider(process.env.PORTRAIT_PROVIDER) ?? PORTRAIT_PROVIDER_DEFAULT;
}
