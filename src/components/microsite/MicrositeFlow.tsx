"use client";

import { MicrositeOverlayDebug } from "@/components/microsite/MicrositeOverlayDebug";
import { MicrositeParticipationFlow } from "@/components/microsite/MicrositeParticipationFlow";
import type { Location } from "@/types/location";

type MicrositeFlowProps = {
  location: Location;
  /** From `?test` — submit uses a fixed result URL instead of fal.ai. */
  testBypass?: boolean;
  /** From `?overlay` — debug loading overlay UI only. */
  overlayPreviewMode?: boolean;
};

export function MicrositeFlow({
  location,
  testBypass = false,
  overlayPreviewMode = false,
}: MicrositeFlowProps) {
  if (overlayPreviewMode) {
    return <MicrositeOverlayDebug testBypass={testBypass} />;
  }

  return (
    <MicrositeParticipationFlow location={location} testBypass={testBypass} />
  );
}
