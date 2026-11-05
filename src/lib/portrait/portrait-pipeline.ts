import "server-only";

import {
  getPortraitEditModel,
  portraitEditModelEndpoint,
} from "@/lib/portrait/portrait-edit-model";
import {
  getPortraitEditProvider,
  getPortraitRemoveBgProvider,
} from "@/lib/portrait/portrait-step-providers";

/** Microsite portrait after nano-banana (before remove-bg). */
export type PortraitPipelineMode = "with-face-swap" | "without-face-swap";

/**
 * Default face-swap step when env is unset.
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

function faceSwapEnvFlag(): boolean | undefined {
  return (
    parseEnvFaceSwapFlag(process.env.PORTRAIT_FACE_SWAP) ??
    parseEnvFaceSwapFlag(process.env.FAL_PORTRAIT_FACE_SWAP)
  );
}

/** Env `PORTRAIT_FACE_SWAP` / `FAL_PORTRAIT_FACE_SWAP` overrides default. */
export function getPortraitPipelineMode(): PortraitPipelineMode {
  const fromEnv = faceSwapEnvFlag();
  if (fromEnv === true) {
    return "with-face-swap";
  }
  if (fromEnv === false) {
    return "without-face-swap";
  }
  return PORTRAIT_PIPELINE_DEFAULT;
}

export function portraitPipelineUsesFaceSwap(): boolean {
  return getPortraitPipelineMode() === "with-face-swap";
}

/** @deprecated use {@link portraitPipelineUsesFaceSwap} */
export function portraitPipelineUsesFalFaceSwap(): boolean {
  return portraitPipelineUsesFaceSwap();
}

export function describePortraitPipeline(
  mode = getPortraitPipelineMode(),
): string {
  const editProvider = getPortraitEditProvider();
  const removeBgProvider = getPortraitRemoveBgProvider();
  const faceSwap = "wavespeed-ai/image-face-swap";
  const edit = portraitEditModelEndpoint(
    getPortraitEditModel(),
    editProvider,
  );
  const removeBg =
    removeBgProvider === "wavespeed"
      ? "ideogram-ai/remove-background"
      : "fal-ai/ideogram/remove-background";

  if (mode === "with-face-swap") {
    return `${edit} → ${faceSwap} → ${removeBg}`;
  }
  return `${edit} → ${removeBg}`;
}
