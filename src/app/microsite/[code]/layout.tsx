import type { ReactNode } from "react";

import { MicrositeBackground } from "@/components/microsite/MicrositeBackground";

/** fal face swap + remove-bg can take longer than default server timeout. */
export const maxDuration = 300;

export default function MicrositeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden text-white">
      <MicrositeBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
