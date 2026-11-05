import "server-only";

import { portraitEditCombinedPrompt } from "@/lib/portrait/portrait-edit-prompt";
import {
  type PortraitEditModel,
  getPortraitEditModel,
} from "@/lib/portrait/portrait-edit-model";
import { wavespeedRunModel } from "@/lib/wavespeed/client";

async function runSeedreamEditWaveSpeed(
  baseImageUrl: string,
  faceReferenceUrl: string,
): Promise<string> {
  return wavespeedRunModel("bytedance/seedream-v5.0-pro/edit", {
    prompt: portraitEditCombinedPrompt(),
    images: [baseImageUrl, faceReferenceUrl],
    resolution: "1k",
    output_format: "png",
    prompt_optimization_mode: "standard",
  });
}

async function runNanoBananaEditWaveSpeed(
  baseImageUrl: string,
  faceReferenceUrl: string,
): Promise<string> {
  return wavespeedRunModel("google/nano-banana-2.1/edit", {
    prompt: portraitEditCombinedPrompt(),
    images: [baseImageUrl, faceReferenceUrl],
    resolution: "1k",
    output_format: "png",
    enable_web_search: false,
    enable_image_search: false,
  });
}

export async function runPortraitEditStepWaveSpeed(
  baseImageUrl: string,
  faceReferenceUrl: string,
  editModel: PortraitEditModel = getPortraitEditModel(),
): Promise<string> {
  if (editModel === "seedream-v5-pro") {
    return runSeedreamEditWaveSpeed(baseImageUrl, faceReferenceUrl);
  }
  return runNanoBananaEditWaveSpeed(baseImageUrl, faceReferenceUrl);
}

export async function runFaceSwapWaveSpeed(
  baseImageUrl: string,
  faceReferenceUrl: string,
): Promise<string> {
  return wavespeedRunModel("wavespeed-ai/image-face-swap", {
    image: baseImageUrl,
    face_image: faceReferenceUrl,
    target_index: 0,
    target_gender: "all",
    output_format: "png",
  });
}

export async function runRemoveBackgroundWaveSpeed(
  imageUrl: string,
): Promise<string> {
  return wavespeedRunModel("ideogram-ai/remove-background", {
    image: imageUrl,
  });
}
