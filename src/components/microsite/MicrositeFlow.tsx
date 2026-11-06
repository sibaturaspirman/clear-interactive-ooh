"use client";

import { MicrositeFotoDebug } from "@/components/microsite/MicrositeFotoDebug";
import { MicrositeOverlayDebug } from "@/components/microsite/MicrositeOverlayDebug";
import { MicrositeParticipationFlow } from "@/components/microsite/MicrositeParticipationFlow";
import type { Location } from "@/types/location";

type MicrositeFlowProps = {
  location: Location;
  /** From `?test` — submit uses a fixed result URL instead of fal.ai. */
  testBypass?: boolean;
  /** From `?overlay` — debug loading overlay UI only. */
  overlayPreviewMode?: boolean;
  /** From `?foto` — upload + nano → face-swap preview (no CMS). */
  fotoDebugMode?: boolean;
  fotoDebugAllowed?: boolean;
  /** Signed window token from `?w=` (QR URL). */
  windowToken?: string;
  /** Server env — skip session when `MICROSITE_SESSION_BYPASS=true`. */
  sessionBypass?: boolean;
};

export function MicrositeFlow({
  location,
  testBypass = false,
  overlayPreviewMode = false,
  fotoDebugMode = false,
  fotoDebugAllowed = false,
  windowToken,
  sessionBypass = false,
}: MicrositeFlowProps) {
  if (overlayPreviewMode) {
    return <MicrositeOverlayDebug testBypass={testBypass} />;
  }

  if (fotoDebugMode) {
    return (
      <MicrositeFotoDebug allowed={fotoDebugAllowed} />
    );
  }

  return (
    <MicrositeParticipationFlow
      location={location}
      testBypass={testBypass}
      windowToken={windowToken}
      sessionBypass={sessionBypass}
    />
  );
}
