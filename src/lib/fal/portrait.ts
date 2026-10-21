import "server-only";

import { fal } from "@fal-ai/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getFalKey } from "@/lib/env";
import {
  FACE_SWAP_SYSTEM_PROMPT,
  FACE_SWAP_USER_PROMPT,
} from "@/lib/fal/prompts";

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

function formatFalError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Generate AI gagal.";
  }
  const anyErr = error as Error & {
    body?: unknown;
    status?: number;
    detail?: unknown;
  };
  const parts = [anyErr.message];
  if (anyErr.detail != null) {
    parts.push(String(anyErr.detail));
  }
  if (anyErr.body != null) {
    try {
      parts.push(
        typeof anyErr.body === "string"
          ? anyErr.body
          : JSON.stringify(anyErr.body),
      );
    } catch {
      parts.push("[fal response body]");
    }
  }
  const text = parts.filter(Boolean).join(" — ");
  if (/prompt unavailable/i.test(text)) {
    return (
      "Prompt ditolak atau tidak terbaca oleh model fal (prompt unavailable). " +
      "Coba lagi; jika berulang, periksa FAL_KEY dan log request di fal.ai dashboard."
    );
  }
  return text || "Generate AI gagal.";
}

async function readTalentBaseFile(): Promise<File> {
  const root = path.join(process.cwd(), "public");
  const candidates = [
    { path: path.join(root, "images/microsite/talent.jpg"), name: "talent.jpg", type: "image/jpeg" },
    { path: path.join(root, "images/microsite/talent.png"), name: "talent.png", type: "image/png" },
    {
      path: path.join(root, "images/led/bei-talent.png"),
      name: "bei-talent.png",
      type: "image/png",
    },
  ];

  for (const candidate of candidates) {
    try {
      const buffer = await readFile(candidate.path);
      return new File([buffer], candidate.name, { type: candidate.type });
    } catch {
      // try next
    }
  }

  throw new Error(
    "Base talent tidak ditemukan. Taruh `public/images/microsite/talent.jpg` (driver CLEAR suit) lalu coba lagi.",
  );
}

async function uploadTalentBaseImage(): Promise<string> {
  const file = await readTalentBaseFile();
  return fal.storage.upload(file);
}

export async function generatePortraitAssetUrl(selfie: File): Promise<string> {
  ensureFalClient();
  assertPrompts();

  if (!selfie?.size) {
    throw new Error("Foto selfie kosong. Ambil ulang foto.");
  }

  try {
    const [baseImageUrl, faceReferenceUrl] = await Promise.all([
      uploadTalentBaseImage(),
      fal.storage.upload(selfie),
    ]);

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
  } catch (error) {
    throw new Error(formatFalError(error));
  }
}
