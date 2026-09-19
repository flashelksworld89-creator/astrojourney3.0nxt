# AstroWalk Journey 3.2.2 — Stable Map Rebuild

This build is intentionally rebuilt from the last stable **3.2.1** map/compass alignment code. The 3.3/3.4 projection-based wheel anchoring changes were discarded because they caused the destination/map/compass to drift out of alignment.

## Rebuilt safely on top of 3.2.1
- Keeps the stable centered compass/map interaction from 3.2.1.
- Default nakshatra compass footprint is **1 mile in diameter**: 0.5-mile / 2,640-foot radius.
- Radius controls visibly expand/contract the wheel while its center remains fixed.
- Radius changes no longer force Google Maps to auto-zoom after initial load.
- Nakshatra names are radial, following their pizza-slice spokes toward the center.
- Aspect lines use a dark halo plus brighter colored stroke for visibility over city streets.
- Fullscreen preserves the current map center/zoom and triggers multiple safe resize refreshes.
- Fullscreen does not replace or reproject the wheel anchor.
- Natal/transit calculations, clickable houses/planets, live GPS, prediction engine, private keywords, and natal audit remain intact.

## Required Vercel variables
- `GOOGLE_MAPS_API_KEY`
- `PLANET_VOCAB_JSON`

The header should display **v3.2.2 Stable Rebuild** after a successful deployment.
