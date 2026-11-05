import "server-only";

import {
  runPortraitEditStepFal,
  runRemoveBackgroundFal,
} from "@/lib/fal/portrait-fal";
import {
  type PortraitEditModel,
  getPortraitEditModel,
} from "@/lib/portrait/portrait-edit-model";
import { portraitPipelineUsesFaceSwap } from "@/lib/portrait/portrait-pipeline";
import type { PortraitAiProvider } from "@/lib/portrait/portrait-provider";
import {
  getPortraitStepProviders,
  type PortraitStepProviders,
} from "@/lib/portrait/portrait-step-providers";
import { resolvePortraitInputUrls } from "@/lib/portrait/portrait-uploads";
import {
  runFaceSwapWaveSpeed,
  runPortraitEditStepWaveSpeed,
  runRemoveBackgroundWaveSpeed,
} from "@/lib/wavespeed/portrait-wavespeed";

export type PortraitPipelineOptions = {
  editModel?: PortraitEditModel;
  stepProviders?: Partial<PortraitStepProviders>;
  /** Debug ?foto — skip remove-bg. */
  skipRemoveBg?: boolean;
  /** Debug ?foto — always run face-swap even if env off. */
  forceFaceSwap?: boolean;
};

export type PortraitPreviewResult = {
  stepProviders: PortraitStepProviders;
  editModel: PortraitEditModel;
  editUrl: string;
  faceSwapUrl: string | null;
};

async function runPortraitEdit(
  provider: PortraitAiProvider,
  baseImageUrl: string,
  faceReferenceUrl: string,
  editModel: PortraitEditModel,
): Promise<string> {
  if (provider === "wavespeed") {
    return runPortraitEditStepWaveSpeed(
      baseImageUrl,
      faceReferenceUrl,
      editModel,
    );
  }
  return runPortraitEditStepFal(baseImageUrl, faceReferenceUrl, editModel);
}

async function runFaceSwap(
  baseImageUrl: string,
  faceReferenceUrl: string,
): Promise<string> {
  return runFaceSwapWaveSpeed(baseImageUrl, faceReferenceUrl);
}

async function runRemoveBackground(
  provider: PortraitAiProvider,
  imageUrl: string,
): Promise<string> {
  if (provider === "wavespeed") {
    return runRemoveBackgroundWaveSpeed(imageUrl);
  }
  return runRemoveBackgroundFal(imageUrl);
}

function resolveStepProviders(
  override?: Partial<PortraitStepProviders>,
): PortraitStepProviders {
  const defaults = getPortraitStepProviders();
  return {
    edit: override?.edit ?? defaults.edit,
    faceSwap: "wavespeed",
    removeBg: override?.removeBg ?? defaults.removeBg,
  };
}

/** Full submit pipeline → final portrait URL. */
export async function runPortraitPipeline(
  selfie: File,
  options?: PortraitPipelineOptions,
): Promise<string> {
  if (!selfie?.size) {
    throw new Error("Foto selfie kosong. Ambil ulang foto.");
  }

  const stepProviders = resolveStepProviders(options?.stepProviders);
  const editModel = options?.editModel ?? getPortraitEditModel();
  const { baseImageUrl, faceReferenceUrl } =
    await resolvePortraitInputUrls(selfie);

  const editUrl = await runPortraitEdit(
    stepProviders.edit,
    baseImageUrl,
    faceReferenceUrl,
    editModel,
  );

  const useFaceSwap =
    options?.forceFaceSwap ?? portraitPipelineUsesFaceSwap();
  const afterFaceSwap = useFaceSwap
    ? await runFaceSwap(editUrl, faceReferenceUrl)
    : editUrl;

  if (options?.skipRemoveBg) {
    return afterFaceSwap;
  }

  return runRemoveBackground(stepProviders.removeBg, afterFaceSwap);
}

/** Edit → face-swap (optional skip via env unless forceFaceSwap). */
export async function runPortraitPreviewPipelineSteps(
  selfie: File,
  options?: PortraitPipelineOptions,
): Promise<PortraitPreviewResult> {
  if (!selfie?.size) {
    throw new Error("Foto selfie kosong. Ambil ulang foto.");
  }

  const stepProviders = resolveStepProviders(options?.stepProviders);
  const editModel = options?.editModel ?? getPortraitEditModel();
  const { baseImageUrl, faceReferenceUrl } =
    await resolvePortraitInputUrls(selfie);

  const editUrl = await runPortraitEdit(
    stepProviders.edit,
    baseImageUrl,
    faceReferenceUrl,
    editModel,
  );

  const useFaceSwap =
    options?.forceFaceSwap ?? portraitPipelineUsesFaceSwap();
  const faceSwapUrl = useFaceSwap
    ? await runFaceSwap(editUrl, faceReferenceUrl)
    : null;

  return {
    stepProviders,
    editModel,
    editUrl,
    faceSwapUrl,
  };
}
