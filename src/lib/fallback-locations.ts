import type { Location } from "@/types/location";

/** Used when `/api/locations` is unreachable during CI/build. */
export const FALLBACK_LOCATIONS: Location[] = [
  { id: 1, name: "LED Bursa Efek Indonesia", code: "bei" },
  { id: 2, name: "LED Dukuh Atas BRT", code: "dukuh-atas" },
  { id: 3, name: "LED GBK", code: "gbk" },
  { id: 5, name: "LED Iconic Ratu Plaza", code: "ratu-plaza" },
  { id: 6, name: "LED Senayan City", code: "sency" },
];

export function staticParamsFromLocations(locations: Location[]) {
  return locations.map((location) => ({ code: location.code }));
}
