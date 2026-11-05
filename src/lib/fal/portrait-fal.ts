import "server-only";

import { fal } from "@fal-ai/client";

import { getFalKey } from "@/lib/env";
import {
  FACE_SWAP_SYSTEM_PROMPT,
  FACE_SWAP_USER_PROMPT,
} from "@/lib/fal/prompts";
import { portraitEditCombinedPrompt } from "@/lib/portrait/portrait-edit-prompt";
import {
  type PortraitEditModel,
  getPortraitEditModel,
} from "@/lib/portrait/portrait-edit-model";

type NanoBananaResult = {
  images?: Array<{ url?: string }>;
};

type RemoveBackgroundResult = {
  image?: { url?: string };
};

let falConfigured = false;

function ensureFalClient() {
  if (falConfigured) {
    return;
  }
  fal.config({ credentials: getFalKey() });
  falConfigured = true;
}

function assertPrompts() {
  const user = FACE_SWAP_USER_PROMPT.trim();
  const system = FACE_SWAP_SYSTEM_PROMPT.trim();
  if (user.length < 3) {
    throw new Error("Konfigurasi AI: prompt user kosong atau terlalu pendek.");
  }
  if (system.length < 3) {
    throw new Error("Konfigurasi AI: system prompt kosong atau terlalu pendek.");
  }
}

async function runSeedreamEditFal(
  baseImageUrl: string,
  faceReferenceUrl: string,
): Promise<string> {
  const result = await fal.subscribe("bytedance/seedream/v5/pro/edit", {
    input: {
      prompt: portraitEditCombinedPrompt(),
      image_urls: [baseImageUrl, faceReferenceUrl],
      image_size: "auto_1K",
      output_format: "png",
      enhance_prompt_mode: "standard",
    },
    logs: true,
  });

  const url = (result.data as NanoBananaResult)?.images?.[0]?.url;
  if (!url) {
    throw new Error("Seedream edit gagal: tidak ada gambar dari fal.");
  }
  return url;
}

async function runNanoBananaEditFal(
  baseImageUrl: string,
  faceReferenceUrl: string,
): Promise<string> {
  const faceSwap = await fal.subscribe("google/nano-banana-2.1/edit", {
    input: {
      prompt: FACE_SWAP_USER_PROMPT,
      system_prompt: FACE_SWAP_SYSTEM_PROMPT,
      image_urls: [baseImageUrl, faceReferenceUrl],
      aspect_ratio: "auto",
      resolution: "1K",
      output_format: "png",
      safety_tolerance: "5",
      limit_generations: true,
    },
    logs: true,
  });

  const swappedUrl = (faceSwap.data as NanoBananaResult)?.images?.[0]?.url;
  if (!swappedUrl) {
    throw new Error("Nano-banana gagal: tidak ada gambar dari fal.");
  }
  return swappedUrl;
}

export async function runPortraitEditStepFal(
  baseImageUrl: string,
  faceReferenceUrl: string,
  editModel: PortraitEditModel = getPortraitEditModel(),
): Promise<string> {
  ensureFalClient();
  assertPrompts();

  if (editModel === "seedream-v5-pro") {
    return runSeedreamEditFal(baseImageUrl, faceReferenceUrl);
  }
  return runNanoBananaEditFal(baseImageUrl, faceReferenceUrl);
}

export async function runRemoveBackgroundFal(imageUrl: string): Promise<string> {
  ensureFalClient();

  const removedBg = await fal.subscribe("fal-ai/ideogram/remove-background", {
    input: {
      image_url: imageUrl,
    },
  });

  const finalUrl = (removedBg.data as RemoveBackgroundResult)?.image?.url;
  if (!finalUrl) {
    throw new Error("Remove background gagal: tidak ada URL hasil.");
  }
  return finalUrl;
}
