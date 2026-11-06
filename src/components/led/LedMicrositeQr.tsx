"use client";

import { LedDynamicMicrositeQr } from "@/components/led/LedDynamicMicrositeQr";
import { micrositeLedQrImageUrl } from "@/lib/microsite/microsite-led-qr";
import { getMicrositeLedQrMode } from "@/lib/microsite/microsite-qr-mode";

type LedMicrositeQrProps = {
  /** Location code for `/api/microsite/led-qr?code=` when mode is dynamic. */
  locationCode: string;
  /** Pre-rendered QR PNG path (with optional `?v=` from `ledStaticImage`). */
  staticSrc: string;
  alt?: string;
  className?: string;
};

/**
 * Live LED slot: dynamic signed QR vs legacy static PNG — toggled by env
 * (`NEXT_PUBLIC_MICROSITE_LED_QR_MODE` / `MICROSITE_LED_QR_MODE`).
 */
export function LedMicrositeQr({
  locationCode,
  staticSrc,
  alt = "",
  className,
}: LedMicrositeQrProps) {
  if (getMicrositeLedQrMode() === "static") {
    return <img src={staticSrc} alt={alt} className={className} />;
  }

  return (
    <LedDynamicMicrositeQr
      baseUrl={micrositeLedQrImageUrl(locationCode)}
      alt={alt}
      className={className}
    />
  );
}
