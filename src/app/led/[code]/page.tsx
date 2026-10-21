import { notFound } from "next/navigation";

import { LedPlayer } from "@/components/led/LedPlayer";
import { getServerEnv } from "@/lib/env";
import { getLocationByCode, getLocations } from "@/lib/locations";
import { getMicrositeUrl } from "@/lib/urls";

export const instant = false;

type PageProps = {
  params: Promise<{ code: string }>;
};

export async function generateStaticParams() {
  try {
    const locations = await getLocations();
    return locations.map((location) => ({ code: location.code }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const location = await getLocationByCode(code);

  return {
    title: location ? `Clear LED — ${location.name}` : "Clear LED Display",
  };
}

export default async function LedLocationPage({ params }: PageProps) {
  const { code } = await params;
  const location = await getLocationByCode(code);

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
    />
  );
}
