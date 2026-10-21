import "server-only";

import { fal } from "@fal-ai/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getFalKey } from "@/lib/env";
import { FACE_SWAP_PROMPT } from "@/lib/fal/prompts";

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

async function uploadTalentBaseImage(): Promise<string> {
  const talentPath = path.join(
    process.cwd(),
    "public",
    "images",
    "microsite",
    "talent.jpg",
  );
  const buffer = await readFile(talentPath);
  const file = new File([buffer], "talent.jpg", { type: "image/jpeg" });
  return fal.storage.upload(file);
}

export async function generatePortraitAssetUrl(selfie: File): Promise<string> {
  ensureFalClient();

  const [baseImageUrl, faceReferenceUrl] = await Promise.all([
    uploadTalentBaseImage(),
    fal.storage.upload(selfie),
  ]);

  const faceSwap = await fal.subscribe("google/nano-banana-2.1/edit", {
    input: {
      prompt: FACE_SWAP_PROMPT,
      image_urls: [baseImageUrl, faceReferenceUrl],
      aspect_ratio: "1:1",
      resolution: "1K",
      output_format: "png",
    },
  });

  const swappedUrl = (faceSwap.data as NanoBananaResult)?.images?.[0]?.url;
  if (!swappedUrl) {
    throw new Error("Face swap gagal: tidak ada gambar dari fal.");
  }

  const removedBg = await fal.subscribe("fal-ai/ideogram/remove-background", {
    input: {
      image_url: swappedUrl,
    },
  });

  const finalUrl = (removedBg.data as RemoveBackgroundResult)?.image?.url;
  if (!finalUrl) {
    throw new Error("Remove background gagal: tidak ada URL hasil.");
  }

  return finalUrl;
}
