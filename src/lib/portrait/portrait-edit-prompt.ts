import {
  FACE_SWAP_SYSTEM_PROMPT,
  FACE_SWAP_USER_PROMPT,
} from "@/lib/fal/prompts";

/** Single prompt for models without separate system_prompt (Seedream, WaveSpeed nano). */
export function portraitEditCombinedPrompt(): string {
  return `${FACE_SWAP_SYSTEM_PROMPT.trim()}\n\n${FACE_SWAP_USER_PROMPT.trim()}`;
}
