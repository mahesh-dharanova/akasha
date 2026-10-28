# AKASHA

AKASHA is a local-first personal astronomy observatory for understanding and observing the real night sky. It calculates celestial positions from an observer's location and observation time, then turns those results into a practical sky map, object profile, observing planner, and journal.

## v0.2 scope

- Interactive, low-glare sky map with stars, major constellations, planets, horizon, and cardinal directions.
- Location, date, time, and time-zone aware observation controls.
- Deterministic altitude/azimuth calculations using the `astronomy-engine` ephemeris library.
- Object profiles with coordinates, magnitude, observing guidance, and horizon/twilight caveats.
- A beginner-focused "tonight" planner.
- Local favourites, observation notes, and observed status using browser `localStorage`.
- Calculated civil, nautical, and astronomical twilight windows.
- A transparent 0–100 visibility score using altitude, sky darkness, catalogue brightness, surface brightness where available, and observing difficulty.
- A selected OpenNGC-derived deep-sky catalogue expansion with source and licence attribution.

The application does not use a camera, image recognition, paid APIs, or an AI model for astronomical calculations. AI explanations may be added later, but the calculated sky remains independent and reproducible.

## Technology

- Vite + TypeScript for a small, maintainable local web application.
- `astronomy-engine` for Sun, Moon, planet, star, horizontal, equatorial, rise/set, and twilight calculations.
- SVG for the interactive sky map so the geometry remains inspectable and responsive.
- Browser `localStorage` for journal persistence, with a versioned JSON export/import format.

## Setup

Requirements: Node.js 24.x (or a current supported Node.js release) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Returning after a long break

The repository is the source of truth for the application. After cloning it again or returning months later:

```bash
cd ~/Dev/Projects/Web/akasha
git pull --ff-only origin main
npm install
npm run verify
npm run dev
```

`npm run verify` runs the type-check, astronomy, visibility, catalogue, observing-window, planner, YouTube, relationship, observer, dashboard, and production-build checks. To see realistic sample journal content, open the Journal view, choose Import, and select [docs/example-journal.json](docs/example-journal.json). It is anonymized demo data and does not overwrite personal browser data until explicitly imported.

The main code map is: `src/astronomy.ts` for deterministic calculations, `src/catalogue.ts` for local object data, `src/main.ts` for the browser shell, `src/observer.ts` and `src/settings.ts` for observer context, `src/dashboard.ts` for view modules, `src/visibility.ts` and `src/planner.ts` for guidance, `src/journal.ts` for local persistence, and `tests/` for executable checks. Read [current_state.md](current_state.md) first to find the latest verified chunk, then [plan.md](plan.md) for the next scope.

Git intentionally excludes `node_modules`, `dist`, browser storage, cached audio, local settings, and secrets. Dependencies and reproducible commands are committed; personal browser data should be preserved through the app's journal export when needed.

## Development commands

```bash
npm run dev       # start the local development server
npm run build     # type-check and create a production build
npm run preview   # serve the production build locally
npm run check     # run TypeScript's no-emit check
npm run test:astronomy # run deterministic astronomy checks
npm run test:visibility # run visibility-score regression checks
npm run test:catalogue # validate licensed catalogue metadata
npm run test:windows   # validate dark-sky observing windows
npm run test:planner   # validate planner labels and ranking
npm run test:youtube   # validate YouTube URL parsing
npm run test:relationships # validate reciprocal object links
npm run test:observer # validate named observer context and timezone pairing
npm run test:dashboard # validate current and planned dashboard modules
npm run test:aerial # validate the source-neutral aerial data contract
npm run test:reproducibility # validate the committed demo journal fixture
npm run test:aerial-radar # validate the aerial radar projection
npm run verify       # run all checks and the production build
```

## Implemented in v0.1

- Local observer controls for latitude, longitude, elevation, date/time, and common time zones.
- SVG altitude/azimuth sky map with horizon, cardinal directions, altitude rings, constellation guide lines, zoom, pan, and object selection.
- Calculated Sun, Moon, planet, and bright-star positions, including equatorial coordinates, horizontal coordinates, rise, transit, and set events where calculable.
- Object tracker and science profile with catalogue classification, magnitude, distance metadata, observing guidance, and explicit visibility caveats.
- Planner that filters out ordinary stars during daylight/twilight while still exposing above-horizon planets and the Moon as calculated targets.
- Browser-local favourites, notes, observed status, observation time, and observer coordinates.

## Implemented in v0.2

- Twilight window panel with the next civil, nautical, and astronomical dusk/dawn crossings for the selected observer.
- Object and planner visibility scores with human-readable reasons instead of an unqualified “visible” claim.
- Recommendation ranking based on the score, with practical difficulty and observing-condition explanations.
- Selected Messier/NGC deep-sky targets including Andromeda, Orion, Pleiades, Hercules, Ring, Lagoon, Eagle, Omega, Sombrero, and Whirlpool objects.
- Search by catalogue identifier, including `M31`, `M42`, and `NGC 5194`.

## Implemented in v0.2.1

- Separate geometric altitude from refraction-adjusted apparent altitude.
- Use geometric altitude for horizon status and visibility scoring.
- Cap daylight recommendations and flag targets too close to the Sun.
- Display calculated planetary distance and angular separation from the Sun.
- Keep rise, transit, and set events within one coherent observing window.
- Rename the map legend to “orientation guide” to distinguish it from official constellation data.

## Implemented in v0.3.1

- Journal export/import with a versioned `akasha-journal` JSON envelope and validation before import.
- Executable astronomy checks for Polaris orientation, deterministic reference output, Saturn's apparent/orbital movement distinction, twilight ordering, committed NASA/JPL Horizons samples, and Bengaluru/London/Cape Town observer-frame invariants.
- Seven-point hourly tracking for the selected object, with each point able to move the observation time and sky map.

## Implemented in v0.3.2

- Six additional OpenNGC targets: M3, M6, M7, M27, M81, and M82.
- A dedicated Deep sky catalogue filter and distinct deep-sky catalogue symbols.

## Implemented in v0.3.3

- Observing-window timeline with rise, transit, set, civil twilight, astronomical twilight, and current-time markers.
- Dark-sky bands and clickable event markers that move the shared observation time.
- Moon JPL Horizons comparison was initially deferred during an endpoint transition; v0.3.15 now includes successfully retrieved Moon references from the current API endpoint.

## Implemented in v0.3.4

- Observer-frame validation for Bengaluru, London, and Cape Town using Polaris latitude and Saturn same-UTC location invariants.
- Existing and v0.3.15 JPL samples remain external regression references; they are not a live runtime dependency.

## Implemented in v0.3.5

- Local observing-condition controls for Bortle light pollution, cloud cover, transparency, and horizon obstruction.
- Visibility scoring now includes those conditions and explains their effect without changing calculated astronomical positions.

## Implemented in v0.3.6

- Observer setup persistence for location, elevation, timezone, and local observing conditions.
- Stored settings are range-checked and timezone-validated before use.
- Added a reset action to restore the default observer setup.

## Implemented in v0.3.7

- Added an expandable visibility-score breakdown showing altitude, darkness, catalogue brightness, observing difficulty, local conditions, obstruction penalty, and daylight/twilight caps.
- Added executable visibility checks for factor weights, cloud impact, low-horizon obstruction, and daylight limits.

## Implemented in v0.3.8

- Added six OpenNGC-attributed open clusters: M35, M44, M37, M11, M46, and M47.
- Added catalogue regression checks for identifiers, coordinates, magnitudes, angular sizes, attribution, and uniqueness.

## Implemented in v0.3.9

- Added a compact local ambient-audio dock with play, pause, stop, volume, and track selection controls.
- Added an original Web Audio-generated `AKASHA · Space-Time` cinematic ambient default with audible slow drones, evolving pulses, delayed reflections, and a sparse note phrase; personal audio files are selected locally and are not bundled or uploaded.

## Implemented in v0.3.10

- Added optional local audio persistence through browser IndexedDB.
- Saved tracks can be restored after reload or removed with the Forget control; the audio file remains outside the repository and is never uploaded.

## Implemented in v0.3.11

- Added calculation-backed dark-sky overlap windows for every supported object.
- Planner ranking now gives modest priority to targets with more usable dark time remaining, while retaining the visibility score as the primary guidance signal.
- Selected-object details show the remaining dark-sky overlap and the window regression checks cover Bengaluru, London, and Cape Town.

## Implemented in v0.3.12

- Planner cards now lead with readable window guidance such as “Best now,” “Good for 2h,” “Short window,” or “Later tonight.”
- Planner cards show the window guidance, visibility score, observing difficulty, and score reasons together.
- The ranking and label behavior has dedicated regression checks.

## Implemented in v0.3.13

- Added YouTube video-link input to the compact audio dock.
- YouTube links play through the official embedded IFrame player with the existing play, pause, stop, and volume controls.
- YouTube URLs can be saved locally and restored without storing video data; playback requires an internet connection and remains subject to YouTube availability and player behavior.

## Implemented in v0.3.14

- Added six OpenNGC-attributed targets: Crab Nebula, Trifid Nebula, M78, Owl Nebula, Pinwheel Galaxy, and Tarantula Nebula.
- Expanded the catalogue across supernova remnants, emission/reflection nebulae, planetary nebulae, spiral galaxies, and southern-sky targets.
- Kept catalogue identifiers, J2000 coordinates, V magnitudes, angular sizes, and available surface brightness values explicit and regression-tested.

## Implemented in v0.3.15

- Expanded the offline ephemeris regression fixture with Moon samples across two dates and Moon/Saturn samples for London and Cape Town.
- Recorded the current NASA/JPL Horizons API endpoint, signature version, observer coordinates, UTC time scale, and airless topocentric settings for each reference.
- Kept these samples as tests only; the running application remains a local calculation with no NASA network dependency.

## Implemented in v0.3.16

- Added an initial learning layer with clickable relationships between selected catalogue objects.
- Labels distinguish physical pairs, shared observing regions, and comparison targets instead of implying that every visual connection is a physical association.
- Relationship integrity is covered by reciprocal-link regression checks.

## Implemented in v0.3.17

- Added a guided lesson to each relationship group with three short observing steps: identify the region, compare the targets, and notice the scientific distinction.
- Lessons are deterministic, local, and application-authored; they do not alter calculated positions or claim calibrated visibility.

## Implemented in v0.4.0

- Added a persisted observer location name alongside latitude, longitude, elevation, and IANA timezone.
- Added deterministic named-place presets for Bengaluru, London, New York, and Cape Town; selecting one updates its coordinates and timezone together.
- Added a custom location-name field with clear wording that coordinates define the calculated sky; no geocoder or network dependency was added.
- Added observer-context regression checks and bumped the application package metadata to `0.4.0`.
- Added modular dashboard navigation for Sky map, Planner, Journal, Aerial, Weather, Events, and Space POV; future-data views are visibly marked as planned and share the observer/time context without presenting fake data.
- Added a source-neutral aerial snapshot contract for aircraft, helicopters, rockets, and satellites, with validation for source attribution, timestamps, coverage semantics, confidence, and invalid data. The committed fixture is test-only; no live provider is connected.
- Added the first live aerial adapter for user-triggered local aircraft queries through adsb.fi, with radius controls, unit conversion, source/timestamp display, incomplete-data handling, personal-use attribution, and a Vite same-origin development proxy. Satellites, rockets, and helicopter classification remain separate deferred work.
- Added a north-up radar-style Aerial view with observer-centred ground-radius rings, cardinal directions, projected aircraft points, out-of-radius edge clipping, and exact values in the supporting table.
- Added manual refresh and start/pause tracking controls. Tracking requests a fresh adsb.fi snapshot every 15 seconds; compact radar dots update every second and use a clearly labelled, capped speed/heading estimate between provider responses.

## Planned Sky & Space expansion

These are planned capabilities, not features currently shipped in the local application:

- Custom observer targeting by location name or latitude/longitude, with elevation and IANA time zone kept explicit. A time zone alone is not a unique geographic location.
- Separate modular views for the astronomical sky, aircraft/helicopters, satellites/rockets, weather, astronomical events, and a future Space POV. They may be separate screens rather than one crowded dashboard.
- Timestamped aerial-object feeds with source, coverage, freshness, and uncertainty shown to the user. Atmospheric aircraft data and orbital satellite data will use different adapters.
- Optional cloud and rain overlays from a selected provider or user data. Weather can inform observing guidance but cannot change ephemeris positions or guarantee visibility.
- Eclipses, asteroid close approaches, and meteor/meteoroid events. “Meteorite” means recovered ground material and will not be treated as a live sky position.
- An explicit Earth POV versus Space POV model. Earth POV uses local horizon/zenith and altitude/azimuth; Space POV needs a defined external observer and reference frame before Earth can be shown as a cosmic body.

Deployment is staged: Phase 1 remains the local web application; Phase 2 may deploy the responsive web client with an optional server-side proxy/cache for feeds that require it; Phase 3 is a future Android client that reuses the domain contracts. Cloud deployment must not become mandatory for local astronomy calculations or private journal data.

## Deferred from v0.1

- Complete Messier/NGC/deep-sky catalogue and richer sourced physical properties beyond the selected v0.2 targets.
- Geocoding arbitrary location names beyond the local named-place presets.
- Live satellite, rocket, and weather feeds with documented providers, licences, coverage, freshness, and privacy boundaries; aircraft queries currently depend on adsb.fi's personal/non-commercial terms and remain local-only.
- Automatic weather retrieval and live light-pollution services; v0.3.5 uses explicit local user inputs instead.
- Eclipses, asteroid close approaches, and meteor/meteoroid event modules.
- Earth/Space POV rendering and external observer-frame calculations.
- Advanced constellation boundaries, photographic Milky Way rendering, and a full WebGL planetarium projection.
- AI question answering, Phase 2 deployment, Phase 3 Android client, orientation sensors, and telescope/mount control.

## Verification results

Verified on 2026-10-26:

- `npm run check` — passed.
- `npm run build` — passed; Vite produced `dist/`.
- v0.3.3 browser smoke test — observing timeline, dark-sky bands, seven event markers, and clickable event controls rendered without browser errors.
- Vite served the application at `http://127.0.0.1:5173/` and headless Chrome rendered the map, object tracker, planner, and journal without unexpected `NaN`, `undefined`, or `null` values.
- Browser interaction test — selecting Saturn worked; changing the observation time changed the displayed altitude from `−75.4°` to `78.0°`.
- Mobile viewport test — at `390×844`, the sky map and journal remained present with no horizontal overflow.
- Astronomy invariant checks — Polaris altitude, Saturn's apparent/orbital movement distinction, twilight ordering, committed NASA/JPL Horizons Saturn/Jupiter samples, and multi-location observer-frame checks passed.
- v0.2 browser smoke test — twilight rows, score summary, deep-sky entries, and OpenNGC attribution rendered without unexpected `NaN`, `undefined`, or `null` values.
- v0.2 catalogue interaction test — selecting Orion Nebula showed `OpenNGC · CC BY-SA 4.0`; searching `M31` returned Andromeda Galaxy.
- v0.2.1 Mercury check — daylight Mercury was marked `not recommended now` at `22/100`, showed `0.75 AU` distance and `18.0°` solar separation, and displayed rise/transit/set on the same date.
- v0.3.14 catalogue check — twelve selected OpenNGC targets passed finite-coordinate, metadata, attribution, and unique-identifier checks; production build passed.
- v0.3.15 ephemeris check — eight committed Horizons samples passed local azimuth, altitude, and distance comparisons, including Moon date movement and London/Cape Town observer frames.
- v0.3.16 relationship check — 14 reciprocal object connections passed catalogue-target, uniqueness, and relationship-kind checks.
- v0.3.17 learning check — all relationship groups passed three-step lesson coverage and reciprocal-link validation.

The coordinate and event API boundary follows the official [Astronomy Engine JavaScript/TypeScript reference](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md). The committed observer samples were generated from the [NASA/JPL Horizons API](https://ssd.jpl.nasa.gov/api/horizons.api), following its [official documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html), with airless apparent azimuth/elevation settings. They are regression references, not a live network dependency; future samples should cover more dates and observer locations.

## Scientific and product limitations

- v0.1 uses a curated starter catalogue rather than a complete deep-sky catalogue.
- The sky map is an altitude/azimuth projection, not a photographic rendering or a full planetarium engine.
- “Observable” means above the geometric horizon and outside bright twilight; it does not model clouds, seeing, transparency, light pollution, obstructions, or the observer's eyesight.
- The visibility breakdown explains AKASHA's local guidance score; it is not a calibrated probability of seeing an object.
- Planetary solar-nearness warnings are angular safety guidance, not a substitute for safe solar-observation practice; never use optics near the Sun without certified equipment.
- Rise and set times are calculated for the selected location and date, with library/refraction defaults documented in the code.
- Star catalogue properties are curated display metadata; missing values are shown as unavailable rather than inferred.

## Project documents

- [plan.md](plan.md) — milestone roadmap and chunk success conditions.
- [architecture.md](architecture.md) — component boundaries, data flow, and scientific decisions.
- [data-provenance.md](data-provenance.md) — source, licence, attribution, and handling ledger for catalogue and reference data.
- [current_state.md](current_state.md) — the verified handoff point for the next agent.
- [docs/example-journal.json](docs/example-journal.json) — anonymized, importable journal data for orientation and demos.

## Future direction

The next web milestones are richer licensed catalogue coverage, more independent ephemeris references, custom observer locations, modular sky/aerial/weather/event views, and an explicit Earth/Space observer-frame model. Provider selection and licensing will be recorded before any live external feed is added.
