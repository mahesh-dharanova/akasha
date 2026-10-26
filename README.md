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

## Development commands

```bash
npm run dev       # start the local development server
npm run build     # type-check and create a production build
npm run preview   # serve the production build locally
npm run check     # run TypeScript's no-emit check
npm run test:astronomy # run deterministic astronomy checks
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
- Executable astronomy checks for Polaris orientation, deterministic reference output, Saturn's apparent/orbital movement distinction, twilight ordering, and committed NASA/JPL Horizons samples.
- Seven-point hourly tracking for the selected object, with each point able to move the observation time and sky map.

## Implemented in v0.3.2

- Six additional OpenNGC targets: M3, M6, M7, M27, M81, and M82.
- A dedicated Deep sky catalogue filter and distinct deep-sky catalogue symbols.

## Deferred from v0.1

- Complete Messier/NGC/deep-sky catalogue and richer sourced physical properties beyond the selected v0.2 targets.
- Weather, cloud cover, atmospheric transparency, light-pollution, obstruction, and eyesight modelling.
- Advanced constellation boundaries, photographic Milky Way rendering, and a full WebGL planetarium projection.
- AI question answering, Android client, orientation sensors, and telescope/mount control.

## Verification results

Verified on 2026-10-26:

- `npm run check` — passed.
- `npm run build` — passed; Vite produced `dist/`.
- Vite served the application at `http://127.0.0.1:5173/` and headless Chrome rendered the map, object tracker, planner, and journal without unexpected `NaN`, `undefined`, or `null` values.
- Browser interaction test — selecting Saturn worked; changing the observation time changed the displayed altitude from `−75.4°` to `78.0°`.
- Mobile viewport test — at `390×844`, the sky map and journal remained present with no horizontal overflow.
- Astronomy invariant checks — Polaris altitude, Saturn's apparent/orbital movement distinction, twilight ordering, and committed NASA/JPL Horizons Saturn/Jupiter samples passed.
- v0.2 browser smoke test — twilight rows, score summary, deep-sky entries, and OpenNGC attribution rendered without unexpected `NaN`, `undefined`, or `null` values.
- v0.2 catalogue interaction test — selecting Orion Nebula showed `OpenNGC · CC BY-SA 4.0`; searching `M31` returned Andromeda Galaxy.
- v0.2.1 Mercury check — daylight Mercury was marked `not recommended now` at `22/100`, showed `0.75 AU` distance and `18.0°` solar separation, and displayed rise/transit/set on the same date.

The coordinate and event API boundary follows the official [Astronomy Engine JavaScript/TypeScript reference](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md). The committed observer samples were generated from the [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) with airless apparent azimuth/elevation settings. They are regression references, not a live network dependency; future samples should cover more dates and observer locations.

## Scientific and product limitations

- v0.1 uses a curated starter catalogue rather than a complete deep-sky catalogue.
- The sky map is an altitude/azimuth projection, not a photographic rendering or a full planetarium engine.
- “Observable” means above the geometric horizon and outside bright twilight; it does not model clouds, seeing, transparency, light pollution, obstructions, or the observer's eyesight.
- Planetary solar-nearness warnings are angular safety guidance, not a substitute for safe solar-observation practice; never use optics near the Sun without certified equipment.
- Rise and set times are calculated for the selected location and date, with library/refraction defaults documented in the code.
- Star catalogue properties are curated display metadata; missing values are shown as unavailable rather than inferred.

## Project documents

- [plan.md](plan.md) — milestone roadmap and chunk success conditions.
- [architecture.md](architecture.md) — component boundaries, data flow, and scientific decisions.
- [data-provenance.md](data-provenance.md) — source, licence, attribution, and handling ledger for catalogue and reference data.
- [current_state.md](current_state.md) — the verified handoff point for the next agent.

## v0.3 direction

Add more licensed catalogue targets, improve rise/set tracking windows, and model weather/light pollution where reliable local or user-supplied data is available.
