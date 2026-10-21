import type { ReactNode } from "react";

type LedFixedCanvasProps = {
  width: number;
  height: number;
  children: ReactNode;
};

export function LedFixedCanvas({
  width,
  height,
  children,
}: LedFixedCanvasProps) {
  return (
    <div
      className="led-fixed-viewport flex min-h-dvh w-full items-center justify-center bg-black"
      style={
        {
          "--led-fixed-w": width,
          "--led-fixed-h": height,
        } as React.CSSProperties
      }
    >
      <div
        className="led-fixed-canvas relative shrink-0 overflow-hidden bg-black"
        style={{ width, height }}
      >
        {children}
      </div>
    </div>
  );
}
