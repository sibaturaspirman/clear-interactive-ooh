import "server-only";

import { fal } from "@fal-ai/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getFalKey } from "@/lib/env";

let falConfigured = false;

function ensureFalStorage() {
  if (falConfigured) {
    return;
  }
  fal.config({ credentials: getFalKey() });
  falConfigured = true;
}

async function readTalentBaseFile(): Promise<File> {
  const root = path.join(process.cwd(), "public");
  const candidates = [
    {
      path: path.join(root, "images/microsite/talent.jpg"),
      name: "talent.jpg",
      type: "image/jpeg",
    },
    {
      path: path.join(root, "images/microsite/talent.png"),
      name: "talent.png",
      type: "image/png",
    },
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

function publicOrigin(): string | null {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return origin || null;
}

/** Prefer deployed static URL for talent; fallback fal storage. */
export async function resolveTalentBaseImageUrl(): Promise<string> {
  const origin = publicOrigin();
  if (origin) {
    const root = path.join(process.cwd(), "public");
    const relativePaths = [
      "/images/microsite/talent.jpg",
      "/images/microsite/talent.png",
      "/images/led/bei-talent.png",
    ];
    for (const rel of relativePaths) {
      try {
        await readFile(path.join(root, rel.replace(/^\//, "")));
        return `${origin}${rel}`;
      } catch {
        // try next
      }
    }
  }

  ensureFalStorage();
  const file = await readTalentBaseFile();
  return fal.storage.upload(file);
}

/** Public HTTPS URL for provider APIs (fal storage). */
export async function uploadSelfiePublicUrl(selfie: File): Promise<string> {
  ensureFalStorage();
  return fal.storage.upload(selfie);
}

export async function resolvePortraitInputUrls(selfie: File): Promise<{
  baseImageUrl: string;
  faceReferenceUrl: string;
}> {
  const [baseImageUrl, faceReferenceUrl] = await Promise.all([
    resolveTalentBaseImageUrl(),
    uploadSelfiePublicUrl(selfie),
  ]);
  return { baseImageUrl, faceReferenceUrl };
}
