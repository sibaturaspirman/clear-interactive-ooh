"use client";

import { useEffect, useMemo, useState } from "react";

import { MicrositeShell } from "@/components/microsite/MicrositeShell";
import { CameraStep } from "@/components/microsite/steps/CameraStep";
import { PersonalInfoStep } from "@/components/microsite/steps/PersonalInfoStep";
import { ReviewStep } from "@/components/microsite/steps/ReviewStep";
import { SuccessStep } from "@/components/microsite/steps/SuccessStep";
import { exchangeMicrositeSession } from "@/lib/microsite/microsite-session-exchange";
import { MICROSITE_SCAN_QR_AGAIN_MESSAGE } from "@/lib/microsite/microsite-session-user-message";
import { submitParticipation } from "@/lib/submissions";
import type { Location } from "@/types/location";

type Step = "info" | "camera" | "review" | "success";

type FormState = {
  fullName: string;
  gender: "male" | "female" | "";
  termsAccepted: boolean;
};

type MicrositeParticipationFlowProps = {
  location: Location;
  testBypass?: boolean;
  windowToken?: string;
  /** False when static QR (or env bypass on server): skip `?w=` exchange. */
  sessionGateEnabled?: boolean;
};

export function MicrositeParticipationFlow({
  location,
  testBypass = false,
  windowToken,
  sessionGateEnabled = true,
}: MicrositeParticipationFlowProps) {
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<FormState>({
    fullName: "",
    gender: "",
    termsAccepted: false,
  });
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noWindowTokenMessage = MICROSITE_SCAN_QR_AGAIN_MESSAGE;

  const [sessionReady, setSessionReady] = useState(() => !sessionGateEnabled);
  const [sessionError, setSessionError] = useState<string | null>(() => {
    if (!sessionGateEnabled) return null;
    if (!windowToken?.trim()) return noWindowTokenMessage;
    return null;
  });
  const [sessionLoading, setSessionLoading] = useState(() => {
    if (!sessionGateEnabled) return false;
    if (!windowToken?.trim()) return false;
    return true;
  });

  useEffect(() => {
    if (!sessionGateEnabled) {
      setSessionReady(true);
      setSessionError(null);
      setSessionLoading(false);
      return;
    }

    const fromUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("w")?.trim() ?? ""
        : "";
    const w = (fromUrl || windowToken?.trim() || "").trim();
    if (!w) {
      setSessionReady(false);
      setSessionError(noWindowTokenMessage);
      setSessionLoading(false);
      return;
    }

    let cancelled = false;
    setSessionError(null);
    setSessionReady(false);
    setSessionLoading(true);

    const timeoutMs = 20000;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setSessionError(MICROSITE_SCAN_QR_AGAIN_MESSAGE);
      setSessionReady(false);
      setSessionLoading(false);
    }, timeoutMs);

    void exchangeMicrositeSession(w, location.code)
      .then((result) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        if (!result.ok) {
          setSessionError(result.message);
          setSessionReady(false);
        } else {
          setSessionError(null);
          setSessionReady(true);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        setSessionError(MICROSITE_SCAN_QR_AGAIN_MESSAGE);
        setSessionReady(false);
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sessionGateEnabled, windowToken, location.code]);

  const photoUrl = useMemo(
    () => photoPreview,
    [photoPreview],
  );

  const infoValid =
    form.fullName.trim().length >= 2 &&
    (form.gender === "male" || form.gender === "female") &&
    form.termsAccepted;

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleCapture(blob: Blob) {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
    setStep("review");
  }

  async function handleSubmit() {
    if (!photoBlob || !infoValid || form.gender === "") {
      return;
    }

    setSubmitting(true);
    setError(null);

    const file = new File([photoBlob], "selfie.jpg", {
      type: photoBlob.type || "image/jpeg",
    });

    try {
      const result = await submitParticipation({
        locationCode: location.code,
        fullName: form.fullName.trim(),
        photo: file,
        testBypass,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setStep("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : "Gagal menyelesaikan pengiriman. Coba lagi.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionReady) {
    return (
      <MicrositeShell title="Akses microsite">
        <p className="text-center text-sm leading-relaxed text-white/85">
          {sessionError ||
            (sessionLoading ? "Tunggu sebentar ya.." : "Tidak dapat membuka sesi.")}
        </p>
      </MicrositeShell>
    );
  }

  if (step === "info") {
    return (
      <MicrositeShell title="Let's start with your personal information.">
        <PersonalInfoStep
          form={form}
          onChange={updateForm}
          onContinue={() => setStep("camera")}
          canContinue={infoValid}
        />
      </MicrositeShell>
    );
  }

  if (step === "camera") {
    return (
      <MicrositeShell>
        <CameraStep onCapture={handleCapture} />
      </MicrositeShell>
    );
  }

  if (step === "review" && photoUrl) {
    return (
      <MicrositeShell>
        <ReviewStep
          photoUrl={photoUrl}
          submitting={submitting}
          testBypass={testBypass}
          error={error}
          onRetake={() => setStep("camera")}
          onSubmit={handleSubmit}
        />
      </MicrositeShell>
    );
  }

  return (
    <MicrositeShell>
      <SuccessStep
        onBackHome={() => {
          setStep("info");
          setForm({
            fullName: "",
            gender: "",
            termsAccepted: false,
          });
          setPhotoBlob(null);
          if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
          }
          setPhotoPreview(null);
        }}
      />
    </MicrositeShell>
  );
}
