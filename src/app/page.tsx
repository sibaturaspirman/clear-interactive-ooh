import Link from "next/link";

import { getLedCanvas } from "@/lib/led/location-specs";
import { getLocations } from "@/lib/locations";
import {
  ledDebugPath,
  ledLiveLayoutDebugPath,
  ledStaticDebugPath,
  ledPath,
  micrositePath,
  micrositeTestPath,
} from "@/lib/paths";

export const instant = false;

export default async function Home() {
  const locations = await getLocations();

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Clear Interactive OOH
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Microsite & LED per lokasi
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          User scan QR di LED → isi microsite → foto tampil di layar LED lokasi
          yang sama.
        </p>
      </header>

      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {locations.map((location) => {
          const canvas = getLedCanvas(location.code);
          return (
          <li
            key={location.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
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
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={micrositePath(location.code)}
                className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Microsite
              </Link>
              <Link
                href={micrositeTestPath(location.code)}
                className="rounded-full border border-amber-400/60 px-4 py-2 text-amber-900 hover:bg-amber-50 dark:border-amber-600/50 dark:text-amber-200 dark:hover:bg-amber-950/40"
                title="Skip fal.ai; fixed result image"
              >
                Microsite (?test)
              </Link>
              <Link
                href={ledPath(location.code)}
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                LED
              </Link>
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
            </div>
          </li>
          );
        })}
      </ul>

      <section className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          Referensi
        </h2>
        <p>
          Ukuran canvas LED per lokasi:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            src/lib/led/location-specs.ts
          </code>
        </p>
        <p>
          Mode <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">?test</code>{" "}
          mengirim submission tanpa generate fal (dev otomatis; production butuh{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            MICROSITE_TEST_BYPASS=true
          </code>
          ). LED layout:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">?debug</code>{" "}
          (detail di README).
        </p>
      </section>
    </div>
  );
}
