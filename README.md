# AstroWalk Journey 3.6.7 — Mission Screen Crash Repair

Repairs the mission-screen runtime crash introduced in 3.6.6.

## Fixes
- Moves `followedPlanet` initialization before fullscreen prediction computations, preventing a JavaScript temporal-dead-zone render crash.
- Adds safe guards for missing or incomplete destination coordinates in the route effect.
- Preserves organized fullscreen House Prediction / Planet Prediction paragraphs and all 3.6.6 functionality.

# AstroWalk Journey 3.6.7 — Route Navigation + Street Lock

This build keeps the 3.5.2 map/compass/HUD baseline and adds:

## 3.6.7 navigation additions

- Live current date/time widget, separate from the selectable Journey Time.
- Collapsible Wheel Radius control moved to the left rail above Nakshatra Explorer.
- Street View automatically opens in Flat mode; the pavement plane follows Street View road links and camera pitch so it remains aligned to street level while moving/looking around.
- Selecting a planet generates a Google road-route report to the destination with street-by-street steps, distance, duration, ETA from the selected Journey Time, start/end house-sign-nakshatra fields, house/nakshatra crossings, and emphasized gandanta crossings.
- Route field analysis samples the actual road path through the city-centered sidereal wheel.


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


## 3.6.7 deployment repair
- Rebased on the stable 3.6.7 project.
- Keeps the 3.6.7 context-synthesis interpretation engine.
- Fixes the routeAnalysis declaration order so it is never referenced before initialization.
- Keeps route/street/gandanta context in prediction requests.


### v3.6.7
Fullscreen predictions are now organized into separate Planet Prediction and House Prediction narrative sections with paragraph-style explanations and expandable astrological basis.

## 3.6.7 Prediction Formula Rebuild
This rebuild keeps the 3.6.7 Mission Screen Crash Repair interface/map baseline and replaces the prediction core with AstroWalk Route Synthesis Formula 1.

Prediction chain:
Transit planet → natal house cusp → house sign → house nakshatra/pada → natal occupants → natal house lord → current transit placement of that lord → aspects to/from the 1st, 3rd, 7th and 9th lords → current-location field → route field transitions → destination field → natal Moon → transiting Moon.

Default route-lord priorities:
- H1: self, body, decisions and initiative
- H3: communication, errands, local travel, roads and short journeys
- H7: other people, clients, agreements, contracts and direct encounters
- H9: long journeys, guidance, unfamiliar territory, teachers and broader travel circumstances

Aspects used:
- conjunction 0°
- sextile 60°
- square 90°
- trine 120°
- quincunx/inconjunction 150°
- opposition 180°

The engine also marks transit-to-fixed-natal contacts as applying, exact or separating when transit speed is available. The Moon layer compares natal Moon, transiting Moon, priority lords, departure field and destination field to produce mindset/action and encounter context.

Visible journey output is divided into Self / Mindset, Journey / Movement and Encounters / Others, with detailed astrological-basis triggers retained in planet and house forecast panels.

Deployment note: Node is pinned to 24.x for current Vercel compatibility.


## v3.6.8 stability repair
- Stops the prediction request loop caused by an unstable geographic zone object.
- Debounces and deduplicates interpretation requests so forecasts regenerate only when meaningful astrology/route inputs change.
- Keeps prediction status space height stable to prevent page/map vertical jumping.
- Ignores insignificant (<2px) map viewport diameter changes to reduce React/map feedback churn.
- Prediction formula and 3.6.7 map behavior are otherwise unchanged.


## 3.6.9 Single Prediction Center
- Consolidates all visible predictions into one Prediction Center.
- Terminology only expands concrete manifestations after evidence synthesis.
- Prose avoids redundant travel/movement wording and focuses on what may actually happen, who may be involved, and what may require a response.
- Planet/house clicks change focus context but do not create separate prediction generators or panels.

## 3.7.1 Event-Driven Vedic Prediction Rewrite
- Replaces chart-description prose with an event-candidate engine.
- Vedic evidence is calculated first; technical details are shown only under Astrological Basis.
- Uses house activation, priority lords (1/3/7/9), Moon testimony, destination contacts, applying/exact/separating phase, nakshatra modifiers, and dispositor state.
- Hidden planet terminology is applied only after an event category is established, supplying concrete people, events, places, and objects.
- Visible prose is required to describe possible situations rather than restating placements/aspects.


## 3.7.1 control-deck and planet forecast redesign
- Merges current time, wheel calendar/time controls, and transit positions into one upper-left Transit Chart panel.
- Adds a matching Natal Chart panel immediately to the right, with natal positions and Prediction Focus merged inside it.
- Removes the Relocation Astrology widget from the mission interface.
- Route directions are calculated independently of planet selection so every planet can be evaluated against the same route.
- Prediction Center now generates a separate route forecast for each transit planet rather than one blended all-planets forecast.
- Route field transitions are added to the planetary evidence stream.
