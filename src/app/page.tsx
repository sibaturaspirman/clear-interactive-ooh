import Link from "next/link";

import { getLocations } from "@/lib/locations";
import { ledPath, micrositePath } from "@/lib/paths";

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
        {locations.map((location) => (
          <li
            key={location.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {location.name}
              </p>
              <p className="font-mono text-sm text-zinc-500">/{location.code}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={micrositePath(location.code)}
                className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Microsite
              </Link>
              <Link
                href={ledPath(location.code)}
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                LED
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
