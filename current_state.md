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
- v0.3.1 astronomy checks completed with `npm run test:astronomy`; deterministic Polaris, Saturn, twilight, and committed NASA/JPL Horizons Saturn/Jupiter reference checks pass.
- v0.3.1 tracking completed with seven hourly calculated points and time-navigation controls for the selected object.
- v0.3.2 completed: six additional OpenNGC targets were added, with a dedicated Deep sky filter and distinct catalogue symbols.
- v0.3.3 completed: observing-window timeline now combines object rise/transit/set events with twilight markers, dark-sky bands, and clickable time navigation.
- v0.3.4 location validation completed for Bengaluru, London, and Cape Town using Polaris latitude invariants and same-UTC Saturn frame differences.
- v0.3.5 completed: local Bortle, cloud-cover, transparency, and horizon-obstruction inputs now affect visibility guidance transparently.
- v0.3.6 completed: observer location, timezone, elevation, and local observing conditions persist in validated browser storage with a reset action.
- v0.3.7 completed: selected objects now expose the weighted visibility factors, low-horizon penalty, and daylight/twilight cap; visibility regression checks cover factor weights and condition impact.
- v0.3.8 completed: six additional OpenNGC open clusters (M35, M44, M37, M11, M46, and M47) are searchable, calculable, attributed, and covered by catalogue checks.
- v0.3.9 completed: a compact local audio dock provides play, pause, stop, volume, a generated AKASHA ambient default, and user-selected local track playback without bundling audio files.
- v0.3.10 completed: user-selected audio can be saved and restored through browser IndexedDB, with an explicit Forget action; no audio asset enters Git or network requests.
- v0.3.11 completed: every calculated object now exposes remaining astronomical-night overlap; the planner uses it as a secondary ranking signal and displays the dark-sky window.
- v0.3.12 completed: planner cards now explain timing with “Best now,” “Good for,” “Short window,” or “Later tonight” labels and show the score context used for the recommendation.
- v0.3.13 completed: the audio dock accepts supported YouTube links, uses the official embedded player, can save/restore the URL locally without downloading or extracting video audio, uses a wider bottom-left layout for the link controls, and can be minimized without destroying the player.
- v0.3.14 catalogue chunk completed: Crab, Trifid, M78, Owl, Pinwheel, and Tarantula targets were added from OpenNGC fields with CC BY-SA 4.0 attribution and regression coverage.
- v0.3.15 ephemeris chunk completed: the Horizons fixture now uses the current endpoint/signature and covers Moon samples across two dates plus London/Cape Town Moon and Saturn observer frames.
- v0.3.16 relationship chunk completed: selected objects now expose 14 reciprocal, explicitly labelled observing connections, including physical pairs, same-region links, and comparison links.
- v0.3.17 learning chunk completed: relationship groups now show application-authored three-step observing lessons that guide identification, comparison, and scientific noticing.
- v0.4.0 observer-targeting chunk completed: observer settings now persist a location name, named-place presets update coordinates/elevation/timezone together, and manual coordinate entry remains the astronomical source of truth.
- v0.4.0 verification completed: `npm run check`, `npm run test:observer`, `npm run test:astronomy`, `npm run test:windows`, and `npm run build` all passed.
- v0.4.0 modular-dashboard chunk completed: Sky map, Planner, Journal, Aerial, Weather, Events, and Space POV now have separate navigation views sharing the observer/time context; future-data views are explicit planned boundaries with no fabricated data.
- Modular-dashboard verification completed: `npm run test:dashboard`, `npm run check`, `npm run test:observer`, `npm run test:astronomy`, `npm run test:windows`, and `npm run build` all passed.
- v0.4.0 reproducibility handoff completed: added `npm run verify`, an anonymized importable fixture at `docs/example-journal.json`, and a README return-after-a-break workflow with the code map and tracked/local-state boundary.
- Reproducibility verification completed: `npm run verify` passed after the fixture and command were added.
- v0.4.0 aerial-contract foundation completed: `src/aerial.ts` now validates distinct aircraft, helicopter, rocket, and satellite categories with source, timestamp, coverage, confidence, and explicit fixture status; no provider is connected.
- Aerial verification completed: the offline contract fixture passes valid/invalid snapshot checks through `npm run test:aerial`.
- v0.4.0 aircraft-provider chunk completed: the Aerial view can query adsb.fi on explicit user action using observer coordinates and a 1–250 nautical-mile radius, convert units, show source/retrieval/coverage metadata, and reject incomplete records without inventing values.
- Aircraft-provider verification completed: mocked adsb.fi URL/response tests pass through `npm run test:aerial-provider`; the full `npm run verify` suite passes.
- The adsb.fi endpoint was live-smoke-tested successfully through the temporary local Vite `/api/adsb-fi` proxy, returning current aircraft JSON. The provider does not expose browser CORS headers; Phase 2 deployment must provide an equivalent proxy/cache.
- v0.4.0 aerial-radar chunk completed: returned aircraft now render in a north-up, observer-centred radar with ground-radius rings, cardinal labels, edge clipping, and exact data retained in the table.
- Aerial-radar verification completed: `npm run test:aerial-radar` and the full `npm run verify` suite pass.

## Next

- Add more independently produced ephemeris samples across dates, observer locations, and the Moon.
- Add more licensed catalogue targets after reviewing seasonal and southern-sky coverage; avoid broad ingestion until the metadata boundary is settled.
- Keep future Horizons fixtures pinned to the recorded endpoint, API signature, observer settings, and retrieval date.
- Expand visibility validation with reference observations only if a defensible labelled dataset becomes available; the current score remains explanatory guidance.
- Consider optional weather/light-pollution integrations only after choosing reliable, clearly licensed data sources.
- Keep observer settings local; do not turn persistence into a cloud account requirement.
- Add weather/light-pollution inputs only where reliable local or user-supplied data is available.
- Keep telescope integration deferred until the domain model and safety boundaries are mature.
- Consider a local playlist only if browser storage limits and file-permission behavior remain explicit.
- Improve the planner later with richer twilight-window explanations and optional weather data only after selecting reliable sources.
- Review recommendation wording with real observing sessions before adding more ranking factors.
- YouTube playback depends on network access, browser autoplay policy, video embedding availability, and the official player; local audio and generated ambient remain offline fallbacks.
- New Sky & Space expansion is documented as future scope only; no aerial, weather, event, Space POV, cloud deployment, or Android feature is implemented by this documentation chunk.
- Observer targeting now has a local named-place baseline; arbitrary location-name geocoding remains deferred. Latitude/longitude remain canonical, with timezone used only for time conversion and display.
- Future dashboards are planned as separate shared-context modules for astronomy, atmospheric/aerial objects, weather, events, and Space POV rather than one overloaded page.
- Future aerial and weather providers remain unselected. Any adapter must record source, licence, timestamp, coverage/radius semantics, freshness, uncertainty, and privacy/network requirements.
- Event terminology is fixed for planning: meteoroid is the object in space, meteor is the visible atmospheric streak, and meteorite is recovered ground material; only the first two belong in a live sky-event view.
- Deployment is planned in phases: local web first, optional responsive cloud delivery second, and an Android client third. Local calculation and private journal behavior must remain useful without cloud access.
- Future sessions should begin with `git pull --ff-only origin main`, `npm install`, and `npm run verify`; use `docs/example-journal.json` only as anonymized demo data.

## Open questions / blockers

- `origin` is configured as the private GitHub repository; this working tree is clean and synced with `origin/main`.
- The starter and OpenNGC-derived catalogue entries need continued source review before broader expansion.
- Browser timezone selection currently offers the detected IANA timezone plus a small set of common zones; it is not yet a complete timezone browser.
- Named-place presets are local application data; no external geocoder or worldwide place database is currently used.
- A provider and licence decision is still required before live aircraft, satellite, rocket, cloud, rain, or event data can be added; no feed is currently bundled or queried.
- adsb.fi is approved only for the current local personal/non-commercial aircraft adapter; cloud deployment, redistribution, satellite propagation, rocket events, and helicopter classification remain unresolved.
- OpenSky is not selected for runtime use without written permission because its current terms require a licence for operational REST API use.
- Space POV needs a concrete external observer origin and coordinate-frame contract before implementation; Earth-POV altitude/azimuth labels cannot be reused directly.
- Cloud deployment needs an explicit privacy and proxy boundary for precise location, provider credentials, live-feed caching, and local journal data.
