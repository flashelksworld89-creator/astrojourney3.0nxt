# AstroWalk Journey 3.2.5 — Nakshatra Road Mode

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


## 3.2.3 additions
- Built strictly on the stable 3.2.2 map-centering baseline.
- Detects Google Street View visibility and camera heading.
- Street View compass can toggle between Upright HUD and Flat ground-plane presentation.
- Selecting any transit planet automatically enables Follow Planet mode.
- Follow Planet draws a strong radial bearing line and arrow for the selected planet's astrological compass projection relative to the live Ascendant.
- The bearing rotates relative to Street View camera heading while the user turns.
- A visible follow panel shows planet, degree bearing, cardinal direction, and Stop control.
- Follow Planet is an astrological compass projection; it is not presented as the physical sky direction of the astronomical body.


## 3.2.4 additions
- Flat Street View is widened into an immersive astrological travel field without changing the stable map anchor.
- The current direction/camera heading highlights the nakshatra corridor the traveler is facing.
- Flat-mode HUD shows selected planet, current travel house, planetary-line house, nakshatra/pada, zodiac degree, nakshatra degree, and follow bearing.
- Selected planetary line is labeled directly on the flattened compass.

## v3.2.5 Nakshatra Road Mode
- Flat Street View is now an immersive travel field instead of only a tilted circular chart.
- The traveler stands at the near origin of the astrological field.
- Nakshatra divisions extend forward as meridian/ley-line lanes across the road.
- House cusps expand into larger structural lanes.
- The currently faced/traveled nakshatra becomes the highlighted corridor.
- Following a planet creates a persistent illuminated centerline through that corridor.
- The selected planet glyph rises above the horizon as a beacon; it represents a direction to follow, not a destination to reach.
- The selected line itself carries the planet, nakshatra, house and degree label.
- Upright mode remains the circular transit compass.
