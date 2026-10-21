"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { publicApiPostJson } from "@/lib/api";
import { getLocationByCode } from "@/lib/locations";
import { getAppOrigin } from "@/lib/urls";

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

async function storePhotoPublicUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type.includes("png") ? "png" : "jpg";
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);
  const origin = await getAppOrigin();
  return `${origin}/uploads/${filename}`;
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
    const url = await storePhotoPublicUrl(input.photo);
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
        error instanceof Error ? error.message : "Gagal mengirim submission.",
    };
  }
}
