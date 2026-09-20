# AstroWalk Journey 3.6.0 — Transit Focus + Location Astrology

This build keeps the 3.5.2 map/compass/HUD baseline and adds:

- Date-sensitive Transit Positions panel. Past/future Journey Time selections recalculate the displayed sidereal transits automatically.
- Default interpretation emphasis on the natal 1st lord (self), 3rd lord (communication / short travel), and 7th lord (others / contracts / business relationships).
- Prediction Focus selector after natal verification. The default 1st/3rd/7th lord focus remains pinned; users can add other houses and house lords.
- Relocation/astrocartography evidence at the current and destination locations using natal planets near relocated ASC/DSC/MC/IC.
- Separate Western tropical angularity and sidereal relocation angularity evidence.
- Local Space route comparison: natal planetary azimuths at the selected location are compared with the journey bearing.
- Location Astrology panel showing the strongest current-location, destination, and route contacts used by the interpretation engine.

## Existing systems retained

- Lahiri sidereal transit/natal calculations
- live GPS/static location modes
- city-centered 27-nakshatra compass
- Street View flat/upright modes and 1-mile nakshatra pavement field
- planet-follow guidance
- Nakshatra Street Explorer
- full-screen map/HUD layout
- private PLANET_VOCAB_JSON terminology

## Environment variables

No new Vercel variables are required. Keep the existing:

- `GOOGLE_MAPS_API_KEY`
- `PLANET_VOCAB_JSON` (optional private terminology)

See `ASTROCARTOGRAPHY_METHOD.md` for the research/implementation model and thresholds.
