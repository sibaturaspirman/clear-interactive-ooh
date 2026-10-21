import "server-only";

import { publicApiFetch } from "@/lib/api";
import {
  FALLBACK_LOCATIONS,
  staticParamsFromLocations,
} from "@/lib/fallback-locations";
import type { Location, LocationsResponse } from "@/types/location";

export async function getLocations(): Promise<Location[]> {
  try {
    const response = await publicApiFetch<LocationsResponse>("/api/locations", {
      next: { revalidate: 300 },
    });
    if (response.data?.length) {
      return response.data;
    }
  } catch {
    // Network/env unavailable (e.g. CI build without API access)
  }
  return FALLBACK_LOCATIONS;
}

export async function getLocationByCode(code: string): Promise<Location | null> {
  const locations = await getLocations();
  return locations.find((location) => location.code === code) ?? null;
}

/** Next.js `generateStaticParams` — never return `[]` (required with Cache Components). */
export async function getLocationStaticParams() {
  const locations = await getLocations();
  return staticParamsFromLocations(locations);
}
