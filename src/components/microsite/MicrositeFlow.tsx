"use client";

import { useMemo, useState } from "react";

import { MicrositeShell } from "@/components/microsite/MicrositeShell";
import { CameraStep } from "@/components/microsite/steps/CameraStep";
import { PersonalInfoStep } from "@/components/microsite/steps/PersonalInfoStep";
import { ReviewStep } from "@/components/microsite/steps/ReviewStep";
import { SuccessStep } from "@/components/microsite/steps/SuccessStep";
import { submitParticipation } from "@/lib/submissions";
import type { Location } from "@/types/location";

type Step = "info" | "camera" | "review" | "success";

type FormState = {
  fullName: string;
  phone: string;
  gender: "male" | "female" | "";
  termsAccepted: boolean;
};

type MicrositeFlowProps = {
  location: Location;
  /** From `?test` — submit uses a fixed result URL instead of fal.ai. */
  testBypass?: boolean;
};

export function MicrositeFlow({
  location,
  testBypass = false,
}: MicrositeFlowProps) {
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    gender: "",
    termsAccepted: false,
  });
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoUrl = useMemo(
    () => photoPreview,
    [photoPreview],
  );

  const infoValid =
    form.fullName.trim().length >= 2 &&
    form.phone.replace(/\D/g, "").length >= 9 &&
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

    const result = await submitParticipation({
      locationCode: location.code,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      photo: file,
      testBypass,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setStep("success");
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
          submitLabel={testBypass ? "Mengirim…" : "Generating…"}
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
            phone: "",
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
