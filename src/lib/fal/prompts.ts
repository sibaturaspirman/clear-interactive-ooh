/** Long instructions — sent as `system_prompt` on nano-banana edit. */
export const FACE_SWAP_SYSTEM_PROMPT = `Perform a highly realistic head replacement (full head identity, not a simple face crop) using the two uploaded images.

Image 1 (Base Image): The professional racing driver wearing a dark blue CLEAR MEN ULTRA racing suit.

Image 2 (Face Reference): The participant selfie (may include headphones — ignore those; glasses/eyewear must be kept if present).

Goal: The final portrait must look like the person in Image 2 wearing the racing suit and pose from Image 1, with their complete head appearance from Image 2.

From Image 2 (full head identity):
- Face: eyes, eyebrows, nose, lips, face shape, jawline, cheeks, forehead, skin tone.
- Hair: hairstyle, hair volume, hairline, hair direction, and hair texture from the selfie — use Image 2's hair, not Image 1's.
- Eyewear: if Image 2 shows glasses or sunglasses, include the same eyewear on the result (frame shape, lenses, placement). Do not remove or replace with Image 1's face without glasses.
- Adapt Image 1's confident smiling expression naturally onto Image 2's face.

From Image 1 (keep unchanged below the neck connection):
- Pose, body, neck, shoulders, camera angle, composition, framing.
- Entire racing suit, all CLEAR MEN ULTRA logos, branding, colors, material textures.
- Dramatic red and blue cinematic lighting, highlights, shadows, reflections on face and hair.

Remove any headphones or microphone from Image 2; they must not appear in the result. Do not remove glasses that appear in Image 2.

Blend the new head seamlessly at the neck and collar with realistic proportions.

Ultra-photorealistic studio advertising quality. Keep transparent background and original framing from Image 1.

Strictly avoid: keeping Image 1's original face or hair, removing glasses from Image 2, blended/mixed identities, distorted features, unnatural hair, mismatched skin tone at the neck, altered logos, AI-art look.

Priority rule: Image 2 = full head identity (face, hair, and eyewear if worn). Image 1 = body, suit, pose, lighting, composition.`;

/** Short user prompt (required field on fal edit API). */
export const FACE_SWAP_USER_PROMPT =
  "On Image 1, replace the driver's head with Image 2's identity (face, hair, and glasses if any). Keep suit, pose, and lighting from Image 1. Follow system instructions.";

/** @deprecated Use FACE_SWAP_USER_PROMPT + FACE_SWAP_SYSTEM_PROMPT */
export const FACE_SWAP_PROMPT = FACE_SWAP_SYSTEM_PROMPT;
