# AKASHA

AKASHA is a local-first personal astronomy observatory for understanding and observing the real night sky. It calculates celestial positions from an observer's location and observation time, then turns those results into a practical sky map, object profile, observing planner, and journal.

## v0.1 scope

- Interactive, low-glare sky map with stars, major constellations, planets, horizon, and cardinal directions.
- Location, date, time, and time-zone aware observation controls.
- Deterministic altitude/azimuth calculations using the `astronomy-engine` ephemeris library.
- Object profiles with coordinates, magnitude, observing guidance, and horizon/twilight caveats.
- A beginner-focused "tonight" planner.
- Local favourites, observation notes, and observed status using browser `localStorage`.

The application does not use a camera, image recognition, paid APIs, or an AI model for astronomical calculations. AI explanations may be added later, but the calculated sky remains independent and reproducible.

## Technology

- Vite + TypeScript for a small, maintainable local web application.
- `astronomy-engine` for Sun, Moon, planet, star, horizontal, equatorial, rise/set, and twilight calculations.
- SVG for the interactive sky map so the geometry remains inspectable and responsive.
- Browser `localStorage` for v0.1 journal persistence.

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
```

## Scientific and product limitations

- v0.1 uses a curated starter catalogue rather than a complete deep-sky catalogue.
- The sky map is an altitude/azimuth projection, not a photographic rendering or a full planetarium engine.
- “Observable” means above the geometric horizon and outside bright twilight; it does not model clouds, seeing, transparency, light pollution, obstructions, or the observer's eyesight.
- Rise and set times are calculated for the selected location and date, with library/refraction defaults documented in the code.
- Star catalogue properties are curated display metadata; missing values are shown as unavailable rather than inferred.

## Project documents

- [plan.md](plan.md) — milestone roadmap and chunk success conditions.
- [architecture.md](architecture.md) — component boundaries, data flow, and scientific decisions.
- [current_state.md](current_state.md) — the verified handoff point for the next agent.

## v0.2 direction

Improve twilight and visibility scoring, add a larger licensed object catalogue, make tracking windows more explicit, add import/export for the journal, and introduce tests against trusted reference values before considering telescope-control work.
