import { notFound } from "next/navigation";

import { MicrositeFlow } from "@/components/microsite/MicrositeFlow";
import {
  getLocationByCode,
  getLocationStaticParams,
} from "@/lib/locations";
import {
  canRunMicrositeFotoDebug,
  parseMicrositeFotoDebug,
} from "@/lib/microsite/foto-debug";
import { parseMicrositeOverlayPreview } from "@/lib/microsite/overlay-preview";
import { micrositeRequiresSessionFromQrMode } from "@/lib/microsite/microsite-qr-mode";
import { parseMicrositeTestBypass } from "@/lib/microsite/test-bypass";

export const instant = false;

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    test?: string | string[];
    overlay?: string | string[];
    foto?: string | string[];
    w?: string | string[];
  }>;
};

export async function generateStaticParams() {
  return getLocationStaticParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const location = await getLocationByCode(code);

  return {
    title: location
      ? `Clear Microsite — ${location.name}`
      : "Clear Microsite",
  };
}

export default async function MicrositeLocationPage({
  params,
  searchParams,
}: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const location = await getLocationByCode(code);

  if (!location) {
    notFound();
  }

  const testBypass = parseMicrositeTestBypass(query.test);
  const overlayPreviewMode = parseMicrositeOverlayPreview(query.overlay);
  const fotoDebugMode = parseMicrositeFotoDebug(query.foto);
  const fotoDebugAllowed = canRunMicrositeFotoDebug();
  const rawW = query.w;
  const windowToken =
    typeof rawW === "string"
      ? rawW
      : Array.isArray(rawW)
        ? rawW[0]
        : undefined;
  const sessionBypassEnv =
    process.env.MICROSITE_SESSION_BYPASS === "1" ||
    process.env.MICROSITE_SESSION_BYPASS === "true";
  /** Dynamic QR: require `?w=` exchange unless bypass env. Static QR: open microsite without session gate. */
  const sessionGateEnabled =
    micrositeRequiresSessionFromQrMode() && !sessionBypassEnv;

  return (
    <MicrositeFlow
      location={location}
      testBypass={testBypass}
      overlayPreviewMode={overlayPreviewMode}
      fotoDebugMode={fotoDebugMode}
      fotoDebugAllowed={fotoDebugAllowed}
      windowToken={windowToken}
      sessionGateEnabled={sessionGateEnabled}
    />
  );
}
