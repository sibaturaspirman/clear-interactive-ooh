import type { ReactNode } from "react";

type CameraCardFrameProps = {
  children: ReactNode;
};

export function CameraCardFrame({ children }: CameraCardFrameProps) {
  return (
    <div className="microsite-camera-outer relative mx-auto w-full max-w-[343px]">
      <div className="microsite-camera-card relative flex min-h-[525px] flex-col justify-between gap-6 px-4 py-6">
        {children}
      </div>
      <span className="microsite-camera-corner microsite-camera-corner-tl" aria-hidden />
      <span className="microsite-camera-corner microsite-camera-corner-tr" aria-hidden />
      <span className="microsite-camera-corner microsite-camera-corner-bl" aria-hidden />
      <span className="microsite-camera-corner microsite-camera-corner-br" aria-hidden />
    </div>
  );
}
