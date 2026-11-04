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

### Portrait pipeline (submit)

On **Submit**, the server runs (unless `?test` bypass):

1. **google/nano-banana-2.1/edit** — talent base + selfie + prompts  
2. *(optional)* **fal-ai/face-swap** — nano output + selfie  
3. **fal-ai/ideogram/remove-background**  
4. POST **`/api/submissions`** with the final image URL  

**Switch face-swap on/off** (one place in code, or env without redeploy logic change):

| Method | How |
| ------ | --- |
| Code default | `PORTRAIT_PIPELINE_DEFAULT` in [`src/lib/fal/portrait-pipeline.ts`](./src/lib/fal/portrait-pipeline.ts) — `"with-face-swap"` or `"without-face-swap"` |
| Env override | `FAL_PORTRAIT_FACE_SWAP=true` or `false` (wins over code default) |

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
