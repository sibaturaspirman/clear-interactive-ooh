import "server-only";

import { publicApiFetch } from "@/lib/api";
import type { Location, LocationsResponse } from "@/types/location";

export async function getLocations(): Promise<Location[]> {
  const response = await publicApiFetch<LocationsResponse>("/api/locations", {
    next: { revalidate: 300 },
  });
  return response.data;
}

export async function getLocationByCode(code: string): Promise<Location | null> {
  const locations = await getLocations();
  return locations.find((location) => location.code === code) ?? null;
}
