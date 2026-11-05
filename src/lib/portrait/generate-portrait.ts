import "server-only";

import { runPortraitPipeline } from "@/lib/portrait/portrait-orchestrator";

/** Microsite portrait URL — per-step providers from env (see README). */
export async function generatePortraitAssetUrl(selfie: File): Promise<string> {
  return runPortraitPipeline(selfie);
}
