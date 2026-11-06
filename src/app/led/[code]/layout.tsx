import type { ReactNode } from "react";

import { MicrositeLedQrModeBootstrap } from "@/lib/microsite/MicrositeLedQrModeBootstrap";

export default function LedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="led-route-root min-h-dvh bg-black">
      <MicrositeLedQrModeBootstrap />
      {children}
    </div>
  );
}
