import {
  LED_LOCATION_CODES,
  type LedLocationCode,
} from "@/lib/led/location-specs";

export function isInteractiveLedLocation(
  code: string,
): code is LedLocationCode {
  return (LED_LOCATION_CODES as readonly string[]).includes(code);
}
