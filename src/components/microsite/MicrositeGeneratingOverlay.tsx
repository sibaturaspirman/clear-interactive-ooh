"use client";

import Image from "next/image";
import { useEffect } from "react";

import { MicrositeGeneratingPromo } from "@/components/microsite/MicrositeGeneratingPromo";
import { MicrositeLogo } from "@/components/microsite/MicrositeLogo";

type MicrositeGeneratingOverlayProps = {
  photoUrl: string;
  testBypass?: boolean;
  /** `?overlay` — tap backdrop to dismiss (no submit). */
  previewMode?: boolean;
  onClosePreview?: () => void;
};

export function MicrositeGeneratingOverlay({
  photoUrl,
  testBypass = false,
  previewMode = false,
  onClosePreview,
}: MicrositeGeneratingOverlayProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const closePreview = onClosePreview;
    if (!previewMode || !closePreview) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePreview?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewMode, onClosePreview]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="microsite-generating-title"
      aria-busy={!previewMode}
      onClick={
        previewMode && onClosePreview
          ? () => onClosePreview()
          : undefined
      }
    >
      <div
        className="relative mx-auto h-[min(520px,72dvh)] w-full max-w-[343px]"
        onClick={(event) => event.stopPropagation()}
      >
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
        <div className="microsite relative z-10 flex h-full flex-col items-center justify-center gap-4 px-5 py-8 text-center">
          <div className="microsite-generating-logo shrink-0">
            <MicrositeLogo variant="overlay" />
          </div>
          <div className="flex w-full max-w-[300px] flex-col gap-1.5">
            <h2 id="microsite-generating-title" className="microsite-generating-title">
              Please wait, don&apos;t close this&nbsp;page.
            </h2>
            <p className="microsite-generating-subtitle">
              {testBypass ? (
                "Submitting your photo…"
              ) : (
                <>
                  Your AI photo is being processed,
                  <br />
                  estimated 40–150s
                </>
              )}
            </p>
          </div>
          <MicrositeGeneratingPromo />
          {previewMode ? (
            <p className="mt-4 text-xs text-white/55">
              Preview ?overlay — tap outside or Esc to close
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
