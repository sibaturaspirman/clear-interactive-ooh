"use client";

import Image from "next/image";

import { CameraCardFrame } from "@/components/microsite/CameraCardFrame";
import { CameraViewfinder } from "@/components/microsite/CameraViewfinder";

type ReviewStepProps = {
  photoUrl: string;
  submitting: boolean;
  submitLabel?: string;
  error: string | null;
  onRetake: () => void;
  onSubmit: () => void;
};

export function ReviewStep({
  photoUrl,
  submitting,
  submitLabel = "Memproses foto…",
  error,
  onRetake,
  onSubmit,
}: ReviewStepProps) {
  return (
    <CameraCardFrame>
      <h2 className="microsite-camera-title shrink-0 text-center text-[28px] leading-8">
        Look at The Camera
      </h2>

      <CameraViewfinder showGuides={false}>
        <Image
          src={photoUrl}
          alt="Preview foto"
          fill
          className="object-cover object-center"
          unoptimized
        />
      </CameraViewfinder>

      {error ? (
        <p className="-mt-2 text-center text-sm text-red-300">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRetake}
          disabled={submitting}
          className="microsite-button microsite-button-retake uppercase"
        >
          retake
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="microsite-button microsite-button-submit uppercase"
        >
          {submitting ? submitLabel : "submit"}
        </button>
      </div>
    </CameraCardFrame>
  );
}
