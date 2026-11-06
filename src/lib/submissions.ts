"use server";

import { cookies } from "next/headers";

import { publicApiPostJson } from "@/lib/api";
import { generatePortraitAssetUrl } from "@/lib/fal/portrait";
import { getLocationByCode } from "@/lib/locations";
import {
  markWindowSubmitSucceeded,
  releaseSubmitTicket,
  releaseWindowSubmit,
  tryBeginWindowSubmit,
  tryClaimSubmitTicket,
} from "@/lib/microsite/session-consumed";
import {
  micrositeSubmitTicketCookie,
  parseSubmitTicket,
} from "@/lib/microsite/session-tokens";
import { micrositeRequiresSessionFromQrMode } from "@/lib/microsite/microsite-qr-mode";
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
  id?: number;
  submission_id?: number;
  data?: { id?: number };
  message?: string;
};

function resolveSubmissionId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const o = payload as SubmissionResponse;
  if (typeof o.id === "number" && Number.isFinite(o.id)) {
    return o.id;
  }
  if (typeof o.submission_id === "number" && Number.isFinite(o.submission_id)) {
    return o.submission_id;
  }
  const nested = o.data?.id;
  if (typeof nested === "number" && Number.isFinite(nested)) {
    return nested;
  }
  return null;
}

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

  const sessionBypassEnv =
    process.env.MICROSITE_SESSION_BYPASS === "1" ||
    process.env.MICROSITE_SESSION_BYPASS === "true";
  const requireSubmitTicket =
    micrositeRequiresSessionFromQrMode() && !sessionBypassEnv;

  const cookieStore = await cookies();
  let ticketLoc = "";
  let wid = 0;
  let winIat = 0;
  let jti = "";

  if (requireSubmitTicket) {
    const rawTicket = cookieStore.get(micrositeSubmitTicketCookie)?.value;
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

    ticketLoc = ticket.c;
    wid = ticket.wid;
    winIat = ticket.winIat;
    jti = ticket.jti;

    if (!tryBeginWindowSubmit(ticketLoc, wid, winIat)) {
      return {
        ok: false,
        message: MICROSITE_SCAN_QR_AGAIN_MESSAGE,
      };
    }

    if (!tryClaimSubmitTicket(jti)) {
      releaseWindowSubmit(ticketLoc, wid, winIat);
      return {
        ok: false,
        message: MICROSITE_SCAN_QR_AGAIN_MESSAGE,
      };
    }
  }

  const nohp = formatNohp(input.phone ?? PLACEHOLDER_NOHP);
  if (!/^\+?[0-9]{10,16}$/.test(nohp)) {
    if (requireSubmitTicket) {
      releaseSubmitTicket(jti);
      releaseWindowSubmit(ticketLoc, wid, winIat);
    }
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
    if (requireSubmitTicket) {
      cookieStore.delete(micrositeSubmitTicketCookie);
      markWindowSubmitSucceeded(ticketLoc, wid, winIat);
    }
    const submissionId = resolveSubmissionId(submission) ?? 0;
    return { ok: true, submissionId };
  } catch (error) {
    if (requireSubmitTicket) {
      releaseSubmitTicket(jti);
      releaseWindowSubmit(ticketLoc, wid, winIat);
    }
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memproses foto atau mengirim submission.",
    };
  }
}
