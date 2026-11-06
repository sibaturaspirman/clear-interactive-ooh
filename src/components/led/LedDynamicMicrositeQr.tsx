"use client";

import { useEffect, useState } from "react";

import { MICROSITE_LED_QR_REFRESH_MS } from "@/lib/microsite/microsite-led-qr";

type LedDynamicMicrositeQrProps = {
  /** e.g. `/api/microsite/led-qr?code=sency` — cache-bust via `&t=` */
  baseUrl: string;
  alt?: string;
  className?: string;
};

/**
 * PNG QR from `/api/microsite/led-qr` — bumps `t=` on an interval so the image
 * refetches with a new signed `w=` (session window rotates every 5 min).
 */
export function LedDynamicMicrositeQr({
  baseUrl,
  alt = "",
  className,
}: LedDynamicMicrositeQrProps) {
  const [src, setSrc] = useState(
    () => `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}t=${Date.now()}`,
  );

  useEffect(() => {
    const tick = () => {
      setSrc(
        `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}t=${Date.now()}`,
      );
    };
    const id = window.setInterval(tick, MICROSITE_LED_QR_REFRESH_MS);
    return () => clearInterval(id);
  }, [baseUrl]);

  return <img src={src} alt={alt} className={className} />;
}
