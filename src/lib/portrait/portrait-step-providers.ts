import "server-only";

import {
  PORTRAIT_PROVIDER_DEFAULT,
  type PortraitAiProvider,
  getPortraitProvider,
  parsePortraitAiProvider,
} from "@/lib/portrait/portrait-provider";

/** Portrait edit (nano / seedream). Falls back to `PORTRAIT_PROVIDER`. */
export function getPortraitEditProvider(): PortraitAiProvider {
  return (
    parsePortraitAiProvider(process.env.PORTRAIT_EDIT_PROVIDER) ??
    getPortraitProvider()
  );
}

/** Face-swap step — WaveSpeed only (`wavespeed-ai/image-face-swap`). */
export function getPortraitFaceSwapProvider(): PortraitAiProvider {
  const raw = parsePortraitAiProvider(process.env.PORTRAIT_FACE_SWAP_PROVIDER);
  if (raw && raw !== "wavespeed") {
    return "wavespeed";
  }
  return "wavespeed";
}

/** Remove background. Falls back to `PORTRAIT_PROVIDER`. */
export function getPortraitRemoveBgProvider(): PortraitAiProvider {
  return (
    parsePortraitAiProvider(process.env.PORTRAIT_REMOVE_BG_PROVIDER) ??
    getPortraitProvider()
  );
}

export type PortraitStepProviders = {
  edit: PortraitAiProvider;
  faceSwap: PortraitAiProvider;
  removeBg: PortraitAiProvider;
};

export function getPortraitStepProviders(): PortraitStepProviders {
  return {
    edit: getPortraitEditProvider(),
    faceSwap: getPortraitFaceSwapProvider(),
    removeBg: getPortraitRemoveBgProvider(),
  };
}

export function resolvePortraitEditProvider(
  override: string | undefined | null,
): PortraitAiProvider {
  return parsePortraitAiProvider(override) ?? getPortraitEditProvider();
}

export { PORTRAIT_PROVIDER_DEFAULT };
