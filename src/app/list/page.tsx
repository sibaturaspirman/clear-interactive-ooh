import Link from "next/link";

import {
  getLedVendor,
  groupLocationsByLedVendor,
  locationsWithoutLedVendor,
} from "@/lib/led/led-vendors";
import { getLedCanvas } from "@/lib/led/location-specs";
import { getLocations } from "@/lib/locations";
import { filterLocationsForList } from "@/lib/locations/location-list-visible";
import type { Location } from "@/types/location";
import { getBroadsignSitePayload } from "@/lib/broadsign-led/resolve-site-config";
import {
  ledBroadsignAutoplayPath,
  ledBroadsignPath,
  ledBroadsignTimerPath,
  ledDebugPath,
  ledLiveLayoutDebugPath,
  ledStaticDebugPath,
  ledTimerPath,
  ledPath,
  micrositePath,
  micrositeFotoDebugPath,
  micrositeKolPath,
  micrositeOverlayPreviewPath,
  micrositeTestPath,
} from "@/lib/paths";

export const instant = false;

function listHasDebugQuery(debug: string | string[] | undefined): boolean {
  return debug !== undefined;
}

function LocationLinks({
  location,
  showDebugLinks,
  showBroadsignLink,
}: {
  location: Location;
  showDebugLinks: boolean;
  showBroadsignLink: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Link
        href={micrositePath(location.code)}
        className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Microsite
      </Link>
      <Link
        href={micrositeKolPath(location.code)}
        className="rounded-full border border-rose-400/60 px-4 py-2 text-rose-950 hover:bg-rose-50 dark:border-rose-600/50 dark:text-rose-200 dark:hover:bg-rose-950/40"
        title="Submit tanpa scan QR di LED (bypass sesi ?w)"
      >
        Microsite (?kol)
      </Link>
      {showDebugLinks ? (
        <Link
          href={micrositeTestPath(location.code)}
          className="rounded-full border border-amber-400/60 px-4 py-2 text-amber-900 hover:bg-amber-50 dark:border-amber-600/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
          title="Skip fal.ai; fixed result image"
        >
          Microsite (?test)
        </Link>
      ) : null}
      {showDebugLinks ? (
        <Link
          href={micrositeOverlayPreviewPath(location.code)}
          className="rounded-full border border-sky-400/60 px-4 py-2 text-sky-950 hover:bg-sky-50 dark:border-sky-600/50 dark:text-sky-200 dark:hover:bg-sky-950/40"
          title="Preview submit loading overlay (no fal/API)"
        >
          Microsite (?overlay)
        </Link>
      ) : null}
      {showDebugLinks ? (
        <Link
          href={micrositeFotoDebugPath(location.code)}
          className="rounded-full border border-violet-400/60 px-4 py-2 text-violet-950 hover:bg-violet-50 dark:border-violet-600/50 dark:text-violet-200 dark:hover:bg-violet-950/40"
          title="Upload selfie; nano → face-swap only (no CMS)"
        >
          Microsite (?foto)
        </Link>
      ) : null}
      {showBroadsignLink ? (
        <Link
          href={ledBroadsignPath(location.code)}
          className="rounded-full border border-emerald-600/70 bg-emerald-50 px-4 py-2 text-emerald-950 hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
          title="Player HTML5 untuk Broadsign / Chromium 87"
        >
          Broadsign
        </Link>
      ) : null}
      <Link
        href={ledPath(location.code)}
        className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
      >
        LED
      </Link>
      {showDebugLinks ? (
        <>
          <Link
            href={ledStaticDebugPath(location.code)}
            className="rounded-full border border-amber-400/60 px-4 py-2 text-amber-900 hover:bg-amber-50 dark:border-amber-600/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
            title="Intro static saja (relayout)"
          >
            LED (?debug=static)
          </Link>
          <Link
            href={ledLiveLayoutDebugPath(location.code)}
            className="rounded-full border border-amber-400/60 px-4 py-2 text-amber-900 hover:bg-amber-50 dark:border-amber-600/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
            title="Live layout beku + talent dummy (relayout)"
          >
            LED (?debug=live)
          </Link>
          <Link
            href={ledDebugPath(location.code)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
            title="Live + antrian API; no animasi"
          >
            LED (?debug)
          </Link>
          <Link
            href={ledTimerPath(location.code)}
            className="rounded-full border border-lime-400/60 px-4 py-2 text-lime-950 hover:bg-lime-50 dark:border-lime-600/50 dark:text-lime-200 dark:hover:bg-lime-950/40"
            title="HUD durasi intro / live / end (3s / 9s / 3s)"
          >
            LED (?timer)
          </Link>
          {showBroadsignLink ? (
            <Link
              href={ledBroadsignAutoplayPath(location.code)}
              className="rounded-full border border-amber-400/60 px-4 py-2 text-amber-900 hover:bg-amber-50 dark:border-amber-600/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
              title="Broadsign + autoplay (preview lab)"
            >
              Broadsign (?autoplay=1)
            </Link>
          ) : null}
          {showBroadsignLink ? (
            <Link
              href={ledBroadsignTimerPath(location.code)}
              className="rounded-full border border-lime-400/60 px-4 py-2 text-lime-950 hover:bg-lime-50 dark:border-lime-600/50 dark:text-lime-200 dark:hover:bg-lime-950/40"
              title="Broadsign + autoplay + HUD timer sequence"
            >
              Broadsign (?timer)
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function LocationRow({
  location,
  showDebugLinks,
}: {
  location: Location;
  showDebugLinks: boolean;
}) {
  const canvas = getLedCanvas(location.code);
  const ledVendor = getLedVendor(location.code);
  const showBroadsignLink = getBroadsignSitePayload(location.code) !== null;

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {location.name}
        </p>
        <p className="font-mono text-sm text-zinc-500">/{location.code}</p>
        <p className="mt-1 text-sm text-zinc-500">
          LED canvas{" "}
          <span className="font-mono tabular-nums">
            {canvas.width}×{canvas.height}
          </span>{" "}
          px
        </p>
        {ledVendor ? (
          <p className="mt-1 text-sm text-zinc-500">
            Vendor LED:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {ledVendor}
            </span>
          </p>
        ) : null}
      </div>
      <LocationLinks
        location={location}
        showDebugLinks={showDebugLinks}
        showBroadsignLink={showBroadsignLink}
      />
    </li>
  );
}

type LocationListPageProps = {
  searchParams: Promise<{ debug?: string | string[] }>;
};

export default async function LocationListPage({
  searchParams,
}: LocationListPageProps) {
  const query = await searchParams;
  const showDebugLinks = listHasDebugQuery(query.debug);
  const locations = filterLocationsForList(await getLocations());
  const vendorGroups = groupLocationsByLedVendor(locations).filter(
    ({ locations: groupLocations }) => groupLocations.length > 0,
  );
  const unmapped = locationsWithoutLedVendor(locations);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      {showDebugLinks ? (
        <p className="rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-600/40 dark:bg-amber-950/30 dark:text-amber-100">
          Dev links aktif — buka tanpa{" "}
          <code className="font-mono text-xs">?debug</code> untuk tampilan
          production. Detail mode di README.
        </p>
      ) : null}
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Clear Interactive OOH
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Microsite & LED per lokasi
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          User scan QR di LED → isi microsite → foto tampil di layar LED lokasi
          yang sama. Daftar diurut per vendor hardware LED.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {vendorGroups.map(({ vendor, locations: groupLocations }) => (
          <section key={vendor} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Vendor LED — {vendor}
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {groupLocations.map((location) => (
                <LocationRow
                  key={location.id}
                  location={location}
                  showDebugLinks={showDebugLinks}
                />
              ))}
            </ul>
          </section>
        ))}

        {unmapped.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Lainnya
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {unmapped.map((location) => (
                <LocationRow
                  key={location.id}
                  location={location}
                  showDebugLinks={showDebugLinks}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
