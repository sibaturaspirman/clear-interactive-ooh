import { notFound } from "next/navigation";

import { MicrositeFlow } from "@/components/microsite/MicrositeFlow";
import {
  getLocationByCode,
  getLocationStaticParams,
} from "@/lib/locations";
import { parseMicrositeTestBypass } from "@/lib/microsite/test-bypass";

export const instant = false;

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ test?: string | string[] }>;
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

  return <MicrositeFlow location={location} testBypass={testBypass} />;
}
