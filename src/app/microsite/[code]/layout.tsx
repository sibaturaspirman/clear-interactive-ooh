import type { ReactNode } from "react";

export default function MicrositeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#120818] text-white">{children}</div>
  );
}
