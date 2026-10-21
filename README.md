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

Open [http://localhost:3000](http://localhost:3000) for the location index.

## Routes

| Path | Description |
| ---- | ----------- |
| `/` | Location list (microsite + LED links) |
| `/microsite/[code]` | Participation flow |
| `/led/[code]` | LED queue player |

Location codes: `bei`, `dukuh-atas`, `gbk`, `ratu-plaza`, `sency`.

## Production (Vercel)

BEI

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/bei
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/bei

Dukuh Atas

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/dukuh-atas
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/dukuh-atas

GBK

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/gbk
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/gbk

Ratu Plaza

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/ratu-plaza
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/ratu-plaza

Sency

* LED : https://clear-interactive-ooh-jsua.vercel.app/led/sency
* Microsite : https://clear-interactive-ooh-jsua.vercel.app/microsite/sency

## LED canvas sizes

Each LED page renders a fixed pixel canvas (scaled to the viewport). Sizes are defined in [`src/lib/led/location-specs.ts`](./src/lib/led/location-specs.ts). Each site uses its own asset prefix (e.g. `bei-*` for BEI).

| Location | Size (px) |
| -------- | --------- |
| **bei** | 3840 × 1536 |
| **sency** | 1920 × 922 |
| **ratu-plaza** | 4096 × 1170 |
| **gbk** | 1680 × 840 |
| **dukuh-atas** | 4096 × 295 |

## Microsite test mode (skip fal.ai)

To submit without calling fal.ai (fixed result image, saves FAL tokens):

```
/microsite/bei?test
```

Works automatically in **development**. On staging/production, set `MICROSITE_TEST_BYPASS=true` in env.

Flow (form + photo) is unchanged; submit sends a fixed portrait URL to the CMS instead of running the fal pipeline.

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

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
