import type { Location } from "@/types/location";

/** LED hardware vendor — used for home ordering & vendor-specific player behavior. */
export const LED_VENDOR_CITYVISION = "Cityvision" as const;
export const LED_VENDOR_MIB = "MIB" as const;

export type LedVendorId =
  | typeof LED_VENDOR_CITYVISION
  | typeof LED_VENDOR_MIB;

/** Canonical site order within each vendor (also global list order on home). */
export const LED_VENDOR_SITES: ReadonlyArray<{
  code: string;
  label: string;
  vendor: LedVendorId;
}> = [
  { code: "bei", label: "BEI", vendor: LED_VENDOR_CITYVISION },
  { code: "ratu-plaza", label: "Ratu Plaza", vendor: LED_VENDOR_CITYVISION },
  { code: "dukuh-atas", label: "Dukuh Atas", vendor: LED_VENDOR_CITYVISION },
  {
    code: "sudirman",
    label: "Gate Entry Sudirman",
    vendor: LED_VENDOR_CITYVISION,
  },
  { code: "gbk", label: "GBK", vendor: LED_VENDOR_MIB },
  { code: "sency", label: "Sency", vendor: LED_VENDOR_MIB },
];

export const LED_VENDORS_IN_DISPLAY_ORDER: readonly LedVendorId[] = [
  LED_VENDOR_CITYVISION,
  LED_VENDOR_MIB,
];

const VENDOR_BY_CODE: Record<string, LedVendorId> = Object.fromEntries(
  LED_VENDOR_SITES.map((site) => [site.code, site.vendor]),
);

const SITE_ORDER_INDEX = new Map(
  LED_VENDOR_SITES.map((site, index) => [site.code, index]),
);

export function getLedVendor(code: string): LedVendorId | null {
  return VENDOR_BY_CODE[code] ?? null;
}

/** Branch player/queue logic for Cityvision hardware (BEI, Ratu Plaza, Dukuh Atas, Sudirman). */
export function isCityvisionLedLocation(code: string): boolean {
  return getLedVendor(code) === LED_VENDOR_CITYVISION;
}

export function isMibLedLocation(code: string): boolean {
  return getLedVendor(code) === LED_VENDOR_MIB;
}

export function sortLocationsByLedVendor(locations: Location[]): Location[] {
  return [...locations].sort((a, b) => {
    const ia = SITE_ORDER_INDEX.get(a.code) ?? Number.MAX_SAFE_INTEGER;
    const ib = SITE_ORDER_INDEX.get(b.code) ?? Number.MAX_SAFE_INTEGER;
    if (ia !== ib) {
      return ia - ib;
    }
    return a.name.localeCompare(b.name);
  });
}

export function groupLocationsByLedVendor(
  locations: Location[],
): Array<{ vendor: LedVendorId; locations: Location[] }> {
  const sorted = sortLocationsByLedVendor(locations);

  return LED_VENDORS_IN_DISPLAY_ORDER.map((vendor) => ({
    vendor,
    locations: sorted.filter((location) => getLedVendor(location.code) === vendor),
  })).filter((group) => group.locations.length > 0);
}

/** API-only locations without a mapped vendor (appended after vendor groups on home). */
export function locationsWithoutLedVendor(locations: Location[]): Location[] {
  const sorted = sortLocationsByLedVendor(locations);
  const knownCodes = new Set(LED_VENDOR_SITES.map((site) => site.code));
  return sorted.filter((location) => !knownCodes.has(location.code));
}
