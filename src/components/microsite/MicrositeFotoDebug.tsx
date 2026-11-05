"use client";

import { useMemo, useState } from "react";

import { MicrositeShell } from "@/components/microsite/MicrositeShell";
import { debugPortraitFromUpload } from "@/lib/microsite/debug-portrait-action";
type MicrositeFotoDebugProps = {
  allowed: boolean;
};

/** `?foto` — upload selfie, run nano → face-swap (no remove-bg, no CMS). */
export function MicrositeFotoDebug({ allowed }: MicrositeFotoDebugProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nanoUrl, setNanoUrl] = useState<string | null>(null);
  const [faceSwapUrl, setFaceSwapUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [editStepTitle, setEditStepTitle] = useState("1. Portrait edit");
  const [editModel, setEditModel] = useState<"nano-banana" | "seedream-v5-pro">(
    "nano-banana",
  );
  const [editProvider, setEditProvider] = useState<"fal" | "wavespeed">("fal");

  const inputPreview = useMemo(() => previewUrl, [previewUrl]);

  function onPickPhoto(next: File | null) {
    setFile(next);
    setNanoUrl(null);
    setFaceSwapUrl(null);
    setMeta(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  async function onRun() {
    if (!file || !allowed) {
      return;
    }
    setRunning(true);
    setError(null);
    setNanoUrl(null);
    setFaceSwapUrl(null);
    setMeta(null);

    const formData = new FormData();
    formData.set("photo", file);
    formData.set("editModel", editModel);
    formData.set("editProvider", editProvider);

    const result = await debugPortraitFromUpload(formData);
    setRunning(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setNanoUrl(result.nanoUrl);
    setFaceSwapUrl(result.faceSwapUrl);
    setEditStepTitle(`1. ${result.editStepLabel}`);
    setMeta(
      `edit: ${result.editProvider} · face-swap: wavespeed · ${result.pipelineLabel}`,
    );
  }

  return (
    <MicrositeShell title="Debug ?foto">
      <div className="flex w-full max-w-[343px] flex-col gap-5 pb-8">
        <div className="rounded-xl border border-violet-400/40 bg-violet-950/30 px-4 py-3 text-sm text-violet-100">
          <p className="font-medium">Debug portrait pipeline</p>
          <p className="mt-1 text-white/70">
            Portrait edit (fal/wavespeed) → face-swap (WaveSpeed) saja. Tanpa
            remove-bg / CMS. Submit production pakai env per-step (
            <code className="text-xs">PORTRAIT_EDIT_PROVIDER</code>, dll.).
          </p>
          {!allowed ? (
            <p className="mt-2 text-amber-200">
              Nonaktif di server ini — set{" "}
              <code className="text-xs">MICROSITE_FOTO_DEBUG=true</code> atau
              dev mode.
            </p>
          ) : null}
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/80">Provider edit (step 1)</span>
          <select
            value={editProvider}
            onChange={(event) =>
              setEditProvider(event.target.value as "fal" | "wavespeed")
            }
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="fal">fal</option>
            <option value="wavespeed">wavespeed</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/80">Model edit (step 1)</span>
          <select
            value={editModel}
            onChange={(event) =>
              setEditModel(
                event.target.value as "nano-banana" | "seedream-v5-pro",
              )
            }
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="nano-banana">Nano-banana 2.1 edit</option>
            <option value="seedream-v5-pro">Seedream v5.0 Pro edit</option>
          </select>
        </label>

        <label className="flex cursor-pointer flex-col gap-2">
          <span className="text-sm text-white/80">Upload selfie</span>
          <input
            type="file"
            accept="image/*"
            className="text-sm text-white/90 file:mr-3 file:rounded-full file:border-0 file:bg-white/15 file:px-4 file:py-2 file:text-sm file:text-white"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              onPickPhoto(next);
            }}
          />
        </label>

        {inputPreview ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-white/50">
              Input
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inputPreview}
              alt="Selfie preview"
              className="max-h-48 w-full rounded-lg object-contain bg-black/40"
            />
          </div>
        ) : null}

        <button
          type="button"
          disabled={!file || !allowed || running}
          onClick={() => void onRun()}
          className="microsite-button microsite-button-submit w-full uppercase disabled:opacity-50"
        >
          {running ? "Memproses…" : "Jalankan pipeline"}
        </button>

        {error ? (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {meta ? (
          <p className="text-center text-xs text-white/50">{meta}</p>
        ) : null}

        {nanoUrl ? (
          <ResultBlock title={editStepTitle} url={nanoUrl} />
        ) : null}

        {faceSwapUrl ? (
          <ResultBlock title="2. Face-swap" url={faceSwapUrl} />
        ) : null}
      </div>
    </MicrositeShell>
  );
}

function ResultBlock({ title, url }: { title: string; url: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-white/50">
        {title}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={title}
        className="w-full rounded-lg bg-black/40 object-contain"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-center text-xs text-sky-300 underline"
      >
        Buka URL
      </a>
    </div>
  );
}
