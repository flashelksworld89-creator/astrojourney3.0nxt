# AstroWalk Journey 3.1 — Compass Design Correction

This revision fixes the planet-glyph collision that caused inner transit planets to display zodiac-sign symbols. Planet glyphs are now stored separately from zodiac glyphs and rendered at exact sidereal longitudes. The compass is redesigned to match the approved map-overlay direction: finer bezel, smaller zodiac symbols, all 27 nakshatras, true planet glyphs, sidereal aspect lines, 8-direction compass labels, live Transit ASC, natal ASC with degree, real destination bearing/house zone, and high transparency over city streets.

# AstroWalk Journey 3.0 — Next.js Edition

This is the Next.js conversion of the AstroWalk Journey 2.6.4 codebase. It keeps the sidereal Lahiri transit compass, natal chart verification, live walking/driving GPS tracking, destination-house zoning, clickable planet/house forecasts, private keyword vocabulary, and natal/transit/route event interpretation engine.

## Why this version

- Uses Next.js App Router instead of Vite.
- Deploys directly on Vercel with no Vite configuration.
- Uses server route handlers for private interpretation and Google Maps configuration.
- `GOOGLE_MAPS_API_KEY` does **not** need a `VITE_` or `NEXT_PUBLIC_` prefix.
- `PLANET_VOCAB_JSON` remains server-only.
- No `vercel.json` is required; Vercel detects Next.js automatically.

## Required Vercel environment variables

### `GOOGLE_MAPS_API_KEY`
Your Google Maps JavaScript browser key. This variable is stored server-side and delivered by `/api/maps-key` only when the map loads. Because Google Maps runs in the browser, the key can still be observed at runtime. Restrict it in Google Cloud by HTTP referrer and by allowed Maps APIs.

### `PLANET_VOCAB_JSON`
Your private planet vocabulary JSON. Do not prefix this variable with `NEXT_PUBLIC_`.

## Deploy to Vercel

1. Create a new GitHub repository.
2. Upload the **contents** of this folder to the repository root.
3. Import the repository into Vercel.
4. Framework should auto-detect as **Next.js**.
5. Add `GOOGLE_MAPS_API_KEY` and `PLANET_VOCAB_JSON` in Vercel Environment Variables.
6. Deploy.

Do not set a custom Build Command, Output Directory, or Root Directory unless your repository is nested. Vercel's normal Next.js defaults are preferred.

## Private keyword page

Open:

`https://YOUR-SITE.vercel.app/?admin=keywords`

Paste or upload CSV with:

`planet,category,term,weight`

Accepted categories (singular or plural): people/person, events/event, qualities/quality, places/place, objects/object.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Create `.env.local`:

```text
GOOGLE_MAPS_API_KEY=your_key_here
PLANET_VOCAB_JSON={}
```

## Build

```bash
npm run build
```

The build script explicitly uses Webpack for predictable WebAssembly compatibility with `@swisseph/browser`.
