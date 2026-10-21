"use server";

import { publicApiPostJson } from "@/lib/api";
import { generatePortraitAssetUrl } from "@/lib/fal/portrait";
import { getLocationByCode } from "@/lib/locations";

export type SubmitResult =
  | { ok: true; submissionId: number }
  | { ok: false; message: string };

/** Same rules as backend `assertPhone` / `cleanPhone`. */
function formatNohp(input: string): string {
  const digits = String(input || "").replace(/[\s-]/g, "").replace(/\D/g, "");
  if (digits.startsWith("62")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return `62${digits}`;
}

type SubmissionResponse = {
  id: number;
  message?: string;
};

export async function submitParticipation(input: {
  locationCode: string;
  fullName: string;
  phone: string;
  photo: File;
}): Promise<SubmitResult> {
  const location = await getLocationByCode(input.locationCode);
  if (!location) {
    return { ok: false, message: "Lokasi tidak ditemukan." };
  }

  const nohp = formatNohp(input.phone);
  if (!/^\+?[0-9]{10,16}$/.test(nohp)) {
    return { ok: false, message: "Nomor HP tidak valid" };
  }

  try {
    const url = await generatePortraitAssetUrl(input.photo);
    const submission = await publicApiPostJson<SubmissionResponse>(
      "/api/submissions",
      {
        nama: input.fullName.trim(),
        nohp,
        url,
        location_id: location.id,
      },
    );
    return { ok: true, submissionId: submission.id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memproses foto atau mengirim submission.",
    };
  }
}
