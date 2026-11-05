# Clear Interactive OOH

Next.js app for **microsite** (user submission + fal.ai portrait) and **LED player** (queue playback per venue).

## Setup

Copy env and fill values (see [`.env.example`](./.env.example)):

```bash
cp .env.example .env.local
npm install
npm run dev
```

| Variable | Purpose |
| -------- | ------- |
| `CLEAR_API_URL` | CMS public API base URL (e.g. `https://clear-api.srv1.antigravity.dev`) |
| `LED_KEY` | `x-led-key` for LED player routes |
| `FAL_KEY` | fal.ai (microsite portrait pipeline only) |
| `NEXT_PUBLIC_APP_URL` | Public origin for QR codes & uploads (e.g. `https://www.clearxorbr.id`) |
| `MICROSITE_TEST_BYPASS` | Optional: `true` to allow `?test` bypass on non-dev deploys |

Open [http://localhost:3000/list](http://localhost:3000/list) for the location index (`/` shows the logo only).

## Routes

| Path | Description |
| ---- | ----------- |
| `/` | Logo landing |
| `/list` | Location list — **Microsite** + **LED** only (BEI hidden; routes still work) |
| `/list?debug` | Same list with dev links (`?test`, LED `?debug*`); see sections below |
| `/microsite/[code]` | Participation flow |
| `/led/[code]` | LED queue player |

Location codes: `bei`, `dukuh-atas`, `gbk`, `ratu-plaza`, `sency`, `sudirman`.

## LED vendors

Urutan home & fallback mengikuti vendor. Mapping & helper branch teknis: [`src/lib/led/led-vendors.ts`](./src/lib/led/led-vendors.ts) (`isCityvisionLedLocation`, `isMibLedLocation`).

### Cityvision

| Site | Code |
| ---- | ---- |
| BEI | `bei` |
| Ratu Plaza | `ratu-plaza` |
| Dukuh Atas | `dukuh-atas` |
| Gate Entry Sudirman | `sudirman` |

### MIB

| Site | Code |
| ---- | ---- |
| GBK | `gbk` |
| Sency | `sency` |

## Production (Vercel)

### Cityvision

BEI

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/bei
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/bei

Ratu Plaza

* LED (Broadsign) : https://clear-interactive-ooh-jsua.vercel.app/led/ratu-plaza/broadsign
* LED (Next dev) : https://clear-interactive-ooh-jsua.vercel.app/led/ratu-plaza
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/ratu-plaza

Dukuh Atas

* LED (Broadsign) : https://clear-interactive-ooh-jsua.vercel.app/led/dukuh-atas/broadsign
* LED (Next dev) : https://clear-interactive-ooh-jsua.vercel.app/led/dukuh-atas
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/dukuh-atas

Gate Entry Sudirman

* LED (Broadsign) : https://clear-interactive-ooh-jsua.vercel.app/led/sudirman/broadsign
* LED (Next dev) : https://clear-interactive-ooh-jsua.vercel.app/led/sudirman
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/sudirman

### MIB

GBK

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/gbk
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/gbk

Sency

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/sency
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/sency

## LED canvas sizes

Each LED page renders a fixed pixel canvas (scaled to the viewport). Sizes are defined in [`src/lib/led/location-specs.ts`](./src/lib/led/location-specs.ts). Each site uses its own asset prefix (e.g. `bei-*` for BEI).

| Location | Vendor | Size (px) |
| -------- | ------ | --------- |
| **bei** | Cityvision | 3840 × 1536 |
| **ratu-plaza** | Cityvision | 2880 × 660 |
| **dukuh-atas** | Cityvision | 6000 × 432 |
| **sudirman** | Cityvision | 4200 × 1200 |
| **gbk** | MIB | 1680 × 840 |
| **sency** | MIB | 1200 × 576 |

## Microsite test mode (skip fal.ai)

To submit without calling fal.ai (fixed result image, saves FAL tokens):

```
/microsite/bei?test
```

Works automatically in **development**. On staging/production, set `MICROSITE_TEST_BYPASS=true` in env.

Flow (form + photo) is unchanged; submit sends a fixed portrait URL to the CMS instead of running the fal pipeline.

### Loading overlay debug (`?overlay`)

Debug **tampilan overlay** submit saja (no form, no fal, no API):

```
/microsite/bei?overlay
```

Overlay terbuka otomatis; tutup dengan tap luar kartu atau **Esc**, lalu **Tampilkan overlay** untuk buka lagi. Link juga di `/list?debug`.

### Portrait pipeline debug (`?foto`)

Upload selfie, jalankan **portrait edit (fal/wavespeed) → face-swap (WaveSpeed)** saja (tanpa remove-bg, tanpa CMS). Di UI bisa pilih provider + model edit; face-swap tetap WaveSpeed.

```
/microsite/bei?foto
```

Di **development** aktif otomatis; di deploy production set `MICROSITE_FOTO_DEBUG=true` (atau `MICROSITE_TEST_BYPASS=true`). Link di `/list?debug`.

### Portrait pipeline (submit)

On **Submit**, the server runs (unless `?test` bypass), then POST **`/api/submissions`** with the final image URL.

**Per-step providers** (each falls back to `PORTRAIT_PROVIDER`, default `fal`):

| Step | Env | Values |
| ---- | --- | ------ |
| 1 Portrait edit | `PORTRAIT_EDIT_PROVIDER` | `fal` \| `wavespeed` |
| 2 Face-swap | *(fixed)* | **WaveSpeed** — `wavespeed-ai/image-face-swap` (`PORTRAIT_FACE_SWAP_PROVIDER` ignored if set to fal) |
| 3 Remove BG | `PORTRAIT_REMOVE_BG_PROVIDER` | `fal` \| `wavespeed` |

**Edit model** (`PORTRAIT_EDIT_MODEL`): `nano-banana` (default) or `seedream-v5-pro` — works on fal & WaveSpeed (endpoint paths differ per host).

Example mixed pipeline:

```env
PORTRAIT_EDIT_PROVIDER=fal
PORTRAIT_EDIT_MODEL=nano-banana
PORTRAIT_REMOVE_BG_PROVIDER=wavespeed
# face-swap always WaveSpeed → need WAVESPEED_API_KEY when face-swap enabled
```

Keys: **`FAL_KEY`** for fal steps + selfie upload (fal.storage); **`WAVESPEED_API_KEY`** whenever face-swap runs or any step uses WaveSpeed. Talent base: `NEXT_PUBLIC_APP_URL` when set.

Orchestrator: [`src/lib/portrait/portrait-orchestrator.ts`](./src/lib/portrait/portrait-orchestrator.ts).

**Face-swap step on/off:** `PORTRAIT_FACE_SWAP` or `FAL_PORTRAIT_FACE_SWAP`, or `PORTRAIT_PIPELINE_DEFAULT` in [`src/lib/portrait/portrait-pipeline.ts`](./src/lib/portrait/portrait-pipeline.ts).

Entry: [`src/lib/portrait/generate-portrait.ts`](./src/lib/portrait/generate-portrait.ts).

## LED playback queue

Players pull `GET /api/led/{code}/next?order=desc` so **newest approved** submissions play first (LIFO). Requires **Clear API** (`backend-cms`) with `order` support on `/next`.

- Microsite creates **pending** submissions; CMS must **approve** before they enter the LED queue (`playback_items.status = queued`).
- Avoid **replay** filler while the server reports `queued > 0` (socket `queue:hint` on Next.js player).
- **Replay** responses are played **newest-first** on all players (Next.js, Broadsign, reference `player.js`); sequence-loop sites (Sency, GBK, Cityvision) take the **3 newest** per 9s live window.
- After deploy: hard-refresh LED tabs or clear `localStorage` key `clear.led.queue.{code}` if old names stick.

## Cityvision (Broadsign) — vendor LED only

Sites: **BEI**, **Ratu Plaza**, **Dukuh Atas**, **Sudirman** (`isCityvisionLedLocation`).

### Dua URL (player lama tetap ada)

| URL | Dipakai untuk |
| --- | ------------- |
| **`/led/[code]`** | Player **Next.js / React** (dev, layout `?debug=*`, MIB-style testing di browser modern) |
| **`/led/[code]/broadsign`** | **Broadsign Chromium 87** — HTML + vanilla JS (`public/broadsign/player.js`, target `chrome87`), **tanpa socket** (polling API saja) |

**Daftarkan ke Cityvision:** `https://…/led/dukuh-atas/broadsign` (idem ratu-plaza, sudirman). Preview: tambah **`?autoplay=1`**.

BroadSignPlay: script inline di `<head>` + bundle mendengarkan event `bs-start` (laporan pengujian §5.4).

Build bundle: `npm run broadsign:build` (otomatis sebelum `npm run build`). Layout/assets reuse dari `*-layout.ts` via [`src/lib/broadsign-led/resolve-site-config.ts`](./src/lib/broadsign-led/resolve-site-config.ts).

Player Next (Cityvision): [`src/lib/led/cityvision/`](./src/lib/led/cityvision/), [`useInteractiveLedPlayer`](./src/lib/led/useInteractiveLedPlayer.ts) — **tidak diganti** oleh `/broadsign`.

## LED debug (layout)

On `/led/[code]`, query param **`debug`** for relayout without motion:

| URL | Effect |
| --- | ------ |
| `?debug=static` | **Stay on BEI intro static** — no transition to live/API |
| `?debug=live` | **Frozen live layout** — no anim, dummy talent, sample name **`NAMA PESERTA`** (tune `participantName`: `left`, `top`, `width`, `height`, `fontSize`, `rotate` in `*_LAYOUT_LIVE`) |
| `?debug` | No crossfade/talent fade, skip 5s intro → live layout (API/queue runs) |
| `?debug=noanim` | Animations off only (keep 5s intro → live) |
| `?debug=intro` | Skip BEI intro only (keep animations) |

Examples: `/led/bei?debug=static` (relayout intro), `/led/bei?debug=live` (relayout live + QR)

## LED / public image cache

Local assets under `public/images/**` load with `?v=` (see [`src/lib/led/led-static-image.ts`](./src/lib/led/led-static-image.ts)) and bypass the Next image optimizer so swapping a file with the **same filename** picks up after refresh.

After replacing art: bump `LED_STATIC_ASSET_VERSION` in that file, or set `NEXT_PUBLIC_LED_ASSET_VERSION` in env (then restart dev / redeploy). Dev: `rm -rf .next` if a stale optimized image still appears.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
