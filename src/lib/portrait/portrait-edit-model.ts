import "server-only";

import type { PortraitAiProvider } from "@/lib/portrait/portrait-provider";

/** First step of portrait pipeline (talent + selfie → composite). */
export type PortraitEditModel = "nano-banana" | "seedream-v5-pro";

export const PORTRAIT_EDIT_MODEL_DEFAULT: PortraitEditModel = "nano-banana";

export function parsePortraitEditModel(
  raw: string | undefined | null,
): PortraitEditModel | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const value = raw.trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  if (
    value === "seedream" ||
    value === "seedream-v5" ||
    value === "seedream-v5-pro" ||
    value === "seedream-v5.0-pro" ||
    value === "bytedance/seedream-v5.0-pro" ||
    value === "bytedance/seedream-v5.0-pro/edit" ||
    value === "bytedance/seedream/v5/pro/edit"
  ) {
    return "seedream-v5-pro";
  }
  if (
    value === "nano" ||
    value === "nano-banana" ||
    value === "google/nano-banana-2.1/edit"
  ) {
    return "nano-banana";
  }
  return undefined;
}

export function getPortraitEditModel(): PortraitEditModel {
  return (
    parsePortraitEditModel(process.env.PORTRAIT_EDIT_MODEL) ??
    PORTRAIT_EDIT_MODEL_DEFAULT
  );
}

export function resolvePortraitEditModel(
  override: string | undefined | null,
): PortraitEditModel {
  return parsePortraitEditModel(override) ?? getPortraitEditModel();
}

export function portraitEditModelEndpoint(
  model: PortraitEditModel,
  provider: PortraitAiProvider,
): string {
  if (model === "seedream-v5-pro") {
    return provider === "wavespeed"
      ? "bytedance/seedream-v5.0-pro/edit"
      : "bytedance/seedream/v5/pro/edit";
  }
  return "google/nano-banana-2.1/edit";
}

export function portraitEditModelLabel(model: PortraitEditModel): string {
  return model === "seedream-v5-pro" ? "Seedream v5 Pro edit" : "Nano-banana 2.1 edit";
}
