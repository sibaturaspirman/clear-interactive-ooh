"use client";

import Image from "next/image";
import { useEffect } from "react";

import { MicrositeLogo } from "@/components/microsite/MicrositeLogo";

type MicrositeGeneratingOverlayProps = {
  photoUrl: string;
  testBypass?: boolean;
};

export function MicrositeGeneratingOverlay({
  photoUrl,
  testBypass = false,
}: MicrositeGeneratingOverlayProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="microsite-generating-title"
      aria-busy="true"
    >
      <div className="relative mx-auto h-[min(520px,72dvh)] w-full max-w-[343px]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={photoUrl}
            alt=""
            fill
            className="object-cover object-center brightness-[0.4]"
            unoptimized
            sizes="343px"
          />
          <div className="absolute inset-0 bg-black/40" aria-hidden />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <div className="microsite-generating-logo">
            <MicrositeLogo variant="overlay" />
          </div>
          <h2 id="microsite-generating-title" className="microsite-generating-title">
            Please wait…
          </h2>
          <p className="microsite-generating-subtitle">
            {testBypass ? (
              "Submitting your photo…"
            ) : (
              <>
                Your AI photo is being processed,
                <br />
                estimated 40–90s
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
