import { notFound } from "next/navigation";

import { LedPlayer } from "@/components/led/LedPlayer";
import { getServerEnv } from "@/lib/env";
import {
  getLocationByCode,
  getLocationStaticParams,
} from "@/lib/locations";
import { parseLedDebugOptions } from "@/lib/led/debug";
import { getMicrositeUrl } from "@/lib/urls";

export const instant = false;

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ debug?: string | string[] }>;
};

export async function generateStaticParams() {
  return getLocationStaticParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const location = await getLocationByCode(code);

  return {
    title: location ? `Clear LED — ${location.name}` : "Clear LED Display",
  };
}

export default async function LedLocationPage({
  params,
  searchParams,
}: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const location = await getLocationByCode(code);
  const ledDebug = parseLedDebugOptions(query.debug);

  if (!location) {
    notFound();
  }

  const { apiUrl, ledKey } = getServerEnv();
  const micrositeUrl = await getMicrositeUrl(code);

  return (
    <LedPlayer
      code={code}
      apiBaseUrl={apiUrl}
      ledKey={ledKey}
      locationName={location.name}
      micrositeUrl={micrositeUrl}
      ledDebug={ledDebug}
    />
  );
}
