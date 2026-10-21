import type { ReactNode } from "react";

type LedCanvasProps = {
  children: ReactNode;
};

export function LedCanvas({ children }: LedCanvasProps) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black">
      <div className="relative aspect-[1680/840] h-auto max-h-dvh w-full max-w-[100vw] overflow-hidden bg-black">
        {children}
      </div>
    </div>
  );
}
