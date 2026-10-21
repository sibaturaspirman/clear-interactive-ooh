import type { ReactNode } from "react";
import type { Viewport } from "next";

import { MicrositeBackground } from "@/components/microsite/MicrositeBackground";

/** fal face swap + remove-bg can take longer than default server timeout. */
export const maxDuration = 300;

/** Prevent pinch-zoom and iOS focus-zoom on form fields. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MicrositeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden text-white">
      <MicrositeBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
