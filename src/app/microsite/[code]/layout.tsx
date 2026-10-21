import type { ReactNode } from "react";

/** fal face swap + remove-bg can take longer than default server timeout. */
export const maxDuration = 300;

export default function MicrositeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#120818] text-white">{children}</div>
  );
}
