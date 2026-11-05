import "server-only";

import {
  type PortraitEditModel,
  getPortraitEditModel,
  portraitEditModelLabel,
  resolvePortraitEditModel,
} from "@/lib/portrait/portrait-edit-model";
import { runPortraitPreviewPipelineSteps } from "@/lib/portrait/portrait-orchestrator";
import { describePortraitPipeline } from "@/lib/portrait/portrait-pipeline";
import type { PortraitAiProvider } from "@/lib/portrait/portrait-provider";
import {
  resolvePortraitEditProvider,
} from "@/lib/portrait/portrait-step-providers";

export type PortraitPreviewPipelineResult = {
  editProvider: PortraitAiProvider;
  editModel: PortraitEditModel;
  editStepLabel: string;
  pipelineLabel: string;
  nanoUrl: string;
  faceSwapUrl: string;
};

export type PortraitPreviewOptions = {
  editModel?: PortraitEditModel;
  editProvider?: PortraitAiProvider;
};

/** Portrait edit → face-swap; skips remove-bg and CMS submit. */
export async function runPortraitPreviewPipeline(
  selfie: File,
  options?: PortraitPreviewOptions,
): Promise<PortraitPreviewPipelineResult> {
  const editModel = options?.editModel ?? getPortraitEditModel();
  const editProvider =
    options?.editProvider ?? resolvePortraitEditProvider(undefined);

  const result = await runPortraitPreviewPipelineSteps(selfie, {
    editModel,
    stepProviders: { edit: editProvider },
    forceFaceSwap: true,
  });

  if (!result.faceSwapUrl) {
    throw new Error("Face-swap tidak dijalankan.");
  }

  return {
    editProvider: result.stepProviders.edit,
    editModel: result.editModel,
    editStepLabel: portraitEditModelLabel(editModel),
    pipelineLabel: describePortraitPipeline("with-face-swap")
      .replace(/ → fal-ai\/ideogram\/remove-background$/, "")
      .replace(/ → ideogram-ai\/remove-background$/, ""),
    nanoUrl: result.editUrl,
    faceSwapUrl: result.faceSwapUrl,
  };
}

export function parsePreviewEditModelFormValue(
  raw: FormDataEntryValue | null,
): PortraitEditModel {
  if (typeof raw !== "string") {
    return getPortraitEditModel();
  }
  return resolvePortraitEditModel(raw);
}

export function parsePreviewEditProviderFormValue(
  raw: FormDataEntryValue | null,
): PortraitAiProvider | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return undefined;
  }
  return resolvePortraitEditProvider(raw);
}
