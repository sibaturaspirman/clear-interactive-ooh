import type { Location } from "@/types/location";

/** Hidden on `/list` only — routes `/led/bei`, `/microsite/bei`, etc. still work. */
const HIDDEN_FROM_LOCATION_LIST = new Set<string>(["bei"]);

export function filterLocationsForList(locations: Location[]): Location[] {
  return locations.filter(
    (location) => !HIDDEN_FROM_LOCATION_LIST.has(location.code),
  );
}
