# AstroWalk Journey 3.3.0 — 3D City Compass

This build redesigns the city-centered sidereal compass to match the approved 3D rendering direction.

## Compass design
- 27 nakshatras rendered as full radial color-wheel wedges from city center to the city-scale outer rim.
- Nakshatra labels have no decorative symbols.
- Zodiac signs occupy a separate aligned inner ring.
- House numbers use the actual calculated cusp-to-cusp sectors.
- Live transit planet glyphs use their computed sidereal longitudes.
- Natal planet glyphs appear as smaller violet reference markers so current transits remain visually dominant.
- Natal ASC, DSC, MC and IC are neat outer-rim reference markers.
- Optional natal birthplace direction is shown just outside the rim in violet.
- The geographic user marker is projected from city center using real bearing and distance.

## Las Vegas city-scale reference
When the resolved city is Las Vegas, the map wheel uses a minimum radius of 13.8 miles (22,209.9 m), corresponding to the broader Las Vegas Valley reference used during design. This gives an equivalent diameter of about 27.6 miles and circumference of about 86.8 miles.

## Preserved functionality
The Swiss Ephemeris sidereal calculation engine, Street View Flat/Upright mode, live GPS logic, planet-follow mode, private vocabulary, and prediction engine remain intact.


## v3.3.1 City Blanket Compass
- The 27 nakshatra wedges now extend from geographic city center to the full city/metro rim instead of occupying only a decorative outer band.
- The on-screen wheel diameter is calculated from the same geographic radius used by Google Maps, so the rendered wheel blankets the mapped city footprint.
- Las Vegas retains the 13.8-mile minimum valley-scale radius reference.
- Dark integrated map styling matches the approved visual direction more closely while preserving street visibility.
- Zodiac, house, transit, natal and angle layers remain aligned above the city-wide nakshatra field.


## v3.5.2 Deployment Repair
- Rewrites malformed literal `\n` sequences in `app/globals.css` as real line breaks.
- Preserves the full-city 27-wedge nakshatra blanket introduced in v3.3.1.
- Preserves dark city-map styling, city-radius screen scaling, transit/natal layers, and geographic user projection.
- Source files were syntax-parsed after repair.


## 3.5.2 — Digital Street + Map Locations
- Search addresses, landmarks, cities, or coordinates from inside the map.
- Click/tap the map to select a point.
- Selected points can be used as Current Location, Destination, or opened directly in Street View.
- Setting Current Location switches tracking to Static so GPS does not immediately override the chosen planning location.
- Street View receives a darker, higher-contrast digitized treatment beneath the existing nakshatra road/game overlay.


## v3.5.2 Wide Nakshatra Road
Digital 3D mode removed. Street View now uses a wide, road-aligned nakshatra pavement field with a fixed 1-mile inner-to-outer depth.
