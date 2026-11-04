import "server-only";

/** Microsite portrait after nano-banana (before remove-bg). */
export type PortraitPipelineMode = "with-face-swap" | "without-face-swap";

/**
 * Default pipeline when `FAL_PORTRAIT_FACE_SWAP` env is unset.
 * Flip this constant to switch mode in code (no env change).
 */
export const PORTRAIT_PIPELINE_DEFAULT: PortraitPipelineMode = "with-face-swap";

function parseEnvFaceSwapFlag(
  raw: string | undefined,
): boolean | undefined {
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }
  const value = raw.trim().toLowerCase();
  if (value === "1" || value === "true" || value === "yes" || value === "on") {
    return true;
  }
  if (value === "0" || value === "false" || value === "no" || value === "off") {
    return false;
  }
  return undefined;
}

/** Env `FAL_PORTRAIT_FACE_SWAP` overrides {@link PORTRAIT_PIPELINE_DEFAULT}. */
export function getPortraitPipelineMode(): PortraitPipelineMode {
  const fromEnv = parseEnvFaceSwapFlag(process.env.FAL_PORTRAIT_FACE_SWAP);
  if (fromEnv === true) {
    return "with-face-swap";
  }
  if (fromEnv === false) {
    return "without-face-swap";
  }
  return PORTRAIT_PIPELINE_DEFAULT;
}

export function portraitPipelineUsesFalFaceSwap(): boolean {
  return getPortraitPipelineMode() === "with-face-swap";
}

/** Human-readable steps for logs / docs. */
export function describePortraitPipeline(mode = getPortraitPipelineMode()): string {
  if (mode === "with-face-swap") {
    return "nano-banana-2.1/edit → fal-ai/face-swap → remove-background";
  }
  return "nano-banana-2.1/edit → remove-background";
}
