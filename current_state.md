# Current State

Updated after each built and verified chunk. Git history contains the detailed change record.

## Done

- Project initialized at `Web/akasha` as a new local-first web application.
- Product scope refined around four connected views: sky map, object tracker, science profile, and observation assistant.
- v0.1 architecture selected: Vite + TypeScript + SVG UI + `astronomy-engine` + browser `localStorage`.
- Initial documentation created: README, plan, and architecture.
- Calculation layer implemented for the Sun, Moon, planets, and curated bright stars, including horizontal/equatorial coordinates, twilight state, rise, transit, and set events.
- Responsive sky workspace implemented with time stepping/animation, observer presets, timezone controls, SVG pan/zoom/select, catalogue filtering, object guidance, planner, favourites, and journal notes.
- Verification completed: type-check, production build, served-page smoke test, desktop browser interaction test, 390×844 mobile viewport check, and Polaris/Saturn astronomical invariant checks.
- v0.2 implemented calculated civil/nautical/astronomical twilight windows, a transparent 0–100 visibility score, score-based recommendations, and selected OpenNGC-derived deep-sky targets with CC BY-SA 4.0 attribution.
- v0.2 verification completed: production build, rendered twilight/deep-sky smoke test, OpenNGC attribution check, and catalogue-id search for `M31`.
- v0.2.1 completed: geometric/apparent altitude separation, daylight score caps, solar-separation warnings, calculated planetary distance, coherent rise/transit/set windows, and “orientation guide” wording.
- v0.2.1 verification completed: Mercury browser check showed `not recommended now` at `22/100`, `0.75 AU` distance, `18.0°` solar separation, and same-date rise/transit/set events.
- v0.3.0 journal export/import completed with a versioned JSON envelope and validation before local replacement.
- v0.3.0 astronomy checks completed with `npm run test:astronomy`; deterministic Polaris, Saturn, and twilight checks pass.

## Next

- Add an independently produced ephemeris comparison suite using JPL Horizons samples or another citable reference set.
- Expand the licensed catalogue and make tracking windows more explicit.
- Add weather/light-pollution inputs only where reliable local or user-supplied data is available.
- Keep telescope integration deferred until the domain model and safety boundaries are mature.

## Open questions / blockers

- No remote git repository is configured yet, so commits can be created locally but cannot be pushed until a remote is supplied.
- The starter and OpenNGC-derived catalogue entries need continued source review before broader expansion.
- Browser timezone selection currently offers the detected IANA timezone plus a small set of common zones; it is not yet a complete timezone browser.
