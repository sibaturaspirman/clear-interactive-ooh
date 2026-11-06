"use server";

import { cookies } from "next/headers";

import { publicApiPostJson } from "@/lib/api";
import { generatePortraitAssetUrl } from "@/lib/fal/portrait";
import { getLocationByCode } from "@/lib/locations";
import { releaseSubmitTicket, tryClaimSubmitTicket } from "@/lib/microsite/session-consumed";
import {
  micrositeSubmitTicketCookie,
  parseSubmitTicket,
} from "@/lib/microsite/session-tokens";
import { MICROSITE_SCAN_QR_AGAIN_MESSAGE } from "@/lib/microsite/microsite-session-user-message";
import {
  MICROSITE_TEST_RESULT_URL,
  canBypassFalGeneration,
} from "@/lib/microsite/test-bypass";

export type SubmitResult =
  | { ok: true; submissionId: number }
  | { ok: false; message: string };

/** Microsite no longer collects phone; API still requires `nohp`. */
const PLACEHOLDER_NOHP = "000000000";

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
  /** Omit to send placeholder `000000000` (formatted as 62…). */
  phone?: string;
  photo: File;
  /** Set when microsite was opened with `?test` (honored only if bypass is allowed). */
  testBypass?: boolean;
}): Promise<SubmitResult> {
  const location = await getLocationByCode(input.locationCode);
  if (!location) {
    return { ok: false, message: "Lokasi tidak ditemukan." };
  }

  const rawTicket = (await cookies()).get(micrositeSubmitTicketCookie)?.value;
  const ticket = parseSubmitTicket(rawTicket);
  if (
    !ticket ||
    ticket.c.toLowerCase() !== input.locationCode.toLowerCase()
  ) {
    return {
      ok: false,
      message: MICROSITE_SCAN_QR_AGAIN_MESSAGE,
    };
  }

  if (!tryClaimSubmitTicket(ticket.jti)) {
    return {
      ok: false,
      message: MICROSITE_SCAN_QR_AGAIN_MESSAGE,
    };
  }

  const cookieStore = await cookies();

  const nohp = formatNohp(input.phone ?? PLACEHOLDER_NOHP);
  if (!/^\+?[0-9]{10,16}$/.test(nohp)) {
    releaseSubmitTicket(ticket.jti);
    return { ok: false, message: "Nomor HP tidak valid" };
  }

  try {
    const bypassFal = canBypassFalGeneration(Boolean(input.testBypass));
    const url = bypassFal
      ? MICROSITE_TEST_RESULT_URL
      : await generatePortraitAssetUrl(input.photo);
    const submission = await publicApiPostJson<SubmissionResponse>(
      "/api/submissions",
      {
        nama: input.fullName.trim(),
        nohp,
        url,
        location_id: location.id,
      },
    );
    cookieStore.delete(micrositeSubmitTicketCookie);
    return { ok: true, submissionId: submission.id };
  } catch (error) {
    releaseSubmitTicket(ticket.jti);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memproses foto atau mengirim submission.",
    };
  }
}
