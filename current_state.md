# Current State

Updated after each built and verified chunk. Git history contains the detailed change record.

## Done

- Project initialized at `Web/akasha` as a new local-first web application.
- Product scope refined around four connected views: sky map, object tracker, science profile, and observation assistant.
- v0.1 architecture selected: Vite + TypeScript + SVG UI + `astronomy-engine` + browser `localStorage`.
- Initial documentation created: README, plan, and architecture.
- Calculation layer implemented for the Sun, Moon, planets, and curated bright stars, including horizontal/equatorial coordinates, twilight state, rise, transit, and set events.
- Responsive sky workspace implemented with time stepping/animation, observer presets, timezone controls, SVG pan/zoom/select, catalogue filtering, object guidance, planner, favourites, and journal notes.
- Verification completed: type-check, production build, served-page smoke test, browser interaction test, and Polaris/Saturn astronomical invariant checks.

## Next

- Review the starter catalogue sources and add a reference-data test suite using independently produced ephemeris samples.
- Improve v0.2 visibility scoring with explicit twilight windows, a larger licensed catalogue, weather/light-pollution inputs where reliable, and journal export/import.
- Keep telescope integration deferred until the domain model and safety boundaries are mature.

## Open questions / blockers

- No remote git repository is configured yet, so commits can be created locally but cannot be pushed until a remote is supplied.
- The starter catalogue needs a deliberate data-source review before expanding beyond the curated set.
- Browser timezone selection currently offers the detected IANA timezone plus a small set of common zones; it is not yet a complete timezone browser.
