import { notFound } from "next/navigation";

import { MicrositeFlow } from "@/components/microsite/MicrositeFlow";
import { getLocationByCode, getLocations } from "@/lib/locations";

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
    title: location
      ? `Clear Microsite — ${location.name}`
      : "Clear Microsite",
  };
}

export default async function MicrositeLocationPage({ params }: PageProps) {
  const { code } = await params;
  const location = await getLocationByCode(code);

  if (!location) {
    notFound();
  }

  return <MicrositeFlow location={location} />;
}
