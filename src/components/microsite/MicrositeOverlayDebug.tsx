"use client";

import { useState } from "react";

import { MicrositeGeneratingOverlay } from "@/components/microsite/MicrositeGeneratingOverlay";
import { MICROSITE_OVERLAY_PREVIEW_PHOTO } from "@/lib/microsite/overlay-preview";

type MicrositeOverlayDebugProps = {
  testBypass?: boolean;
};

/** `?overlay` — debug tampilan loading submit saja. */
export function MicrositeOverlayDebug({
  testBypass = false,
}: MicrositeOverlayDebugProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="microsite relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-4 pb-8 pt-6">
      {open ? (
        <MicrositeGeneratingOverlay
          photoUrl={MICROSITE_OVERLAY_PREVIEW_PHOTO}
          testBypass={testBypass}
          previewMode
          onClosePreview={() => setOpen(false)}
        />
      ) : (
        <div className="flex w-full max-w-[343px] flex-col items-center gap-4 text-center">
          <p className="text-sm text-white/70">
            Debug overlay (?overlay). Tap outside atau Esc saat overlay terbuka
            untuk menutup.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="microsite-button microsite-button-submit w-full uppercase"
          >
            tampilkan overlay
          </button>
        </div>
      )}
    </div>
  );
}
