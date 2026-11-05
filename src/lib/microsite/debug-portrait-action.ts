"use server";

import {
  canRunMicrositeFotoDebug,
} from "@/lib/microsite/foto-debug";
import {
  parsePreviewEditModelFormValue,
  parsePreviewEditProviderFormValue,
  runPortraitPreviewPipeline,
} from "@/lib/portrait/portrait-preview-pipeline";

export type DebugPortraitResult =
  | {
      ok: true;
      editProvider: string;
      editStepLabel: string;
      pipelineLabel: string;
      nanoUrl: string;
      faceSwapUrl: string;
    }
  | { ok: false; message: string };

export async function debugPortraitFromUpload(
  formData: FormData,
): Promise<DebugPortraitResult> {
  if (!canRunMicrositeFotoDebug()) {
    return {
      ok: false,
      message:
        "Debug ?foto tidak aktif di environment ini. Set MICROSITE_FOTO_DEBUG=true atau jalankan di development.",
    };
  }

  const raw = formData.get("photo");
  if (!(raw instanceof File) || raw.size === 0) {
    return { ok: false, message: "Pilih foto selfie dulu." };
  }

  try {
    const editModel = parsePreviewEditModelFormValue(formData.get("editModel"));
    const editProvider = parsePreviewEditProviderFormValue(
      formData.get("editProvider"),
    );
    const result = await runPortraitPreviewPipeline(raw, {
      editModel,
      editProvider,
    });
    return {
      ok: true,
      editProvider: result.editProvider,
      editStepLabel: result.editStepLabel,
      pipelineLabel: result.pipelineLabel,
      nanoUrl: result.nanoUrl,
      faceSwapUrl: result.faceSwapUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Pipeline portrait gagal.",
    };
  }
}
