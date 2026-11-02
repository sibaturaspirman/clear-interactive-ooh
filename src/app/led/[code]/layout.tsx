import type { ReactNode } from "react";

export default function LedLayout({ children }: { children: ReactNode }) {
  return <div className="led-route-root min-h-dvh bg-black">{children}</div>;
}
