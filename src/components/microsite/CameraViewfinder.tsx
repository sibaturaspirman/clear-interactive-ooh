import Image from "next/image";
import type { ReactNode } from "react";

type CameraViewfinderProps = {
  children: ReactNode;
  showGuides?: boolean;
};

export function CameraViewfinder({
  children,
  showGuides = true,
}: CameraViewfinderProps) {
  return (
    <div className="relative h-[324px] w-full shrink-0 overflow-hidden border border-white/50 bg-[#3c3c3c]">
      {children}
      {showGuides ? (
        <>
          <div
            className="pointer-events-none absolute border border-white"
            style={{ left: 24, top: 23, right: 24, bottom: 23 }}
          />
          <Image
            src="/images/microsite/corner-bracket.svg"
            alt=""
            width={22}
            height={22}
            className="pointer-events-none absolute left-[19px] top-[18px]"
          />
          <Image
            src="/images/microsite/corner-bracket.svg"
            alt=""
            width={22}
            height={22}
            className="pointer-events-none absolute right-[19px] top-[18px] -scale-x-100"
          />
          <Image
            src="/images/microsite/corner-bracket.svg"
            alt=""
            width={22}
            height={22}
            className="pointer-events-none absolute bottom-[18px] left-[19px] -scale-y-100"
          />
          <Image
            src="/images/microsite/corner-bracket.svg"
            alt=""
            width={22}
            height={22}
            className="pointer-events-none absolute bottom-[18px] right-[19px] -scale-x-100 -scale-y-100"
          />
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 border border-white/80" />
        </>
      ) : null}
    </div>
  );
}
