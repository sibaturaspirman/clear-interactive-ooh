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
| `CLEAR_API_URL` | CMS public API base URL |
| `LED_KEY` | `x-led-key` for LED player routes |
| `FAL_KEY` | fal.ai (microsite portrait pipeline only) |
| `NEXT_PUBLIC_APP_URL` | Public origin for QR codes & uploads |
| `MICROSITE_TEST_BYPASS` | Optional: `true` to allow `?test` bypass on non-dev deploys |

Open [http://localhost:3000/list](http://localhost:3000/list) for the location index (`/` shows the logo only).

## Routes

| Path | Description |
| ---- | ----------- |
| `/` | Logo landing |
| `/list` | Location list — **Microsite** + **LED** only |
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

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/ratu-plaza
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/ratu-plaza

Dukuh Atas

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/dukuh-atas
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/dukuh-atas

Gate Entry Sudirman

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/sudirman
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
| **dukuh-atas** | Cityvision | 4096 × 295 |
| **sudirman** | Cityvision | 4200 × 1200 |
| **gbk** | MIB | 1680 × 840 |
| **sency** | MIB | 1920 × 922 |

## Microsite test mode (skip fal.ai)

To submit without calling fal.ai (fixed result image, saves FAL tokens):

```
/microsite/bei?test
```

Works automatically in **development**. On staging/production, set `MICROSITE_TEST_BYPASS=true` in env.

Flow (form + photo) is unchanged; submit sends a fixed portrait URL to the CMS instead of running the fal pipeline.

## Cityvision (Broadsign) — vendor LED only

Sites: **BEI**, **Ratu Plaza**, **Dukuh Atas**, **Sudirman** (`isCityvisionLedLocation` in [`src/lib/led/led-vendors.ts`](./src/lib/led/led-vendors.ts)).

| Behavior | MIB (GBK, Sency) |
| -------- | ---------------- |
| Motion/queue start on load | After **BroadSignPlay** — `postMessage({ type: "BroadSignPlay" })`, `window.BroadSignPlay()`, or preview **`?autoplay=1`** |
| Slot | **15 s** per intro→live→playback cycle; hold final frame **0,5 s** before slot end; then **intro static** lagi (antrian kosong) |
| UI | `100vw×100vh`, `cursor: none`, no click-to-fullscreen; **`Content-Security-Policy: frame-ancestors *`** on `/led/*` |

Preview in Chrome: `/led/ratu-plaza?autoplay=1` (works alongside `?debug=…` for layout). Self-test: DevTools → `window.postMessage({ type: "BroadSignPlay" }, "*")`.

Implementation: [`src/lib/led/cityvision/`](./src/lib/led/cityvision/), [`useInteractiveLedPlayer`](./src/lib/led/useInteractiveLedPlayer.ts).

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
