# Plan

Roadmap broken into chunks. Change this document only when scope or a design decision changes.

## Goals

- Help an observer understand what is above the local horizon at a chosen time and place.
- Keep astronomical calculations deterministic, local, and separate from interface code.
- Turn calculated positions into practical observing guidance without overstating visibility.
- Preserve personal observations locally and keep a clear path to a future Android client.

## Chunks

1. [x] Project foundation and documentation — success condition: project structure, scope, architecture, setup, and limitations are documented.
2. [x] Calculation layer and starter catalogue — success condition: selected location/time produce reproducible horizontal coordinates, horizon status, twilight state, and rise/transit/set data for planets, the Sun, Moon, and curated stars.
3. [x] Interactive sky workspace — success condition: map responds to time/location changes, supports pan/zoom/select, shows horizon/cardinals, and displays the selected object's calculated position.
4. [x] Object profile and observing guidance — success condition: selected objects expose catalogue metadata, coordinates, brightness, classification, and honest visibility caveats.
5. [x] Tonight planner — success condition: ranked targets explain why they are recommended for the selected observing period and observer.
6. [x] Observation journal — success condition: favourites, notes, observed status, date, and location survive page reload using local persistence.
7. [x] Verification and handoff — success condition: production build passes, known-object checks are recorded, desktop/mobile layouts are inspected, and incomplete functionality is documented.
8. [x] v0.2 twilight windows — success condition: civil, nautical, and astronomical dusk/dawn crossings are calculated locally and shown for the selected observer.
9. [x] v0.2 visibility scoring — success condition: every supported object receives a transparent score and reasons using altitude, darkness, brightness, and difficulty without claiming guaranteed visibility.
10. [x] v0.2 recommendation ranking — success condition: planner targets are ranked by the score and explain their practical observing conditions.
11. [x] v0.2 licensed catalogue expansion — success condition: selected Messier/NGC targets are searchable, calculable, and attributed to OpenNGC CC BY-SA 4.0.
12. [x] v0.2.1 accuracy pass — success condition: geometric/apparent altitude, solar-nearness warnings, planetary distance, coherent observing events, and orientation-guide wording are visible and verified.
13. [x] v0.3 journal portability — success condition: users can export a versioned journal file and validate/import it into local storage.
14. [x] v0.3 calculation checks — success condition: an executable offline check covers orientation, time movement, and twilight ordering invariants.
15. [x] v0.3.1 ephemeris comparison and tracking — success condition: committed JPL Horizons samples pass local comparison checks and the selected object exposes an hourly, time-navigable track.
16. [x] v0.3.2 catalogue discovery — success condition: additional OpenNGC targets are calculable, searchable, attributed, and filterable as deep-sky objects.
17. [x] v0.3.3 observing windows — success condition: rise/transit/set and twilight crossings appear on a dark-sky-aware, time-navigable timeline.
18. [x] v0.3.4 multi-location validation — success condition: observer-frame invariants pass for Bengaluru, London, and Cape Town while external JPL samples remain committed and reproducible.
19. [x] v0.3.5 local observing conditions — success condition: user-controlled Bortle, cloud, transparency, and obstruction inputs adjust scores with visible explanations while positions remain unchanged.
20. [x] v0.3.6 observer setup persistence — success condition: validated observer and condition settings survive reload locally and can be reset to defaults.
21. [x] v0.3.7 visibility explanation — success condition: the selected-object panel exposes the weighted score factors, penalties, and caps, with executable regression checks for condition impact.
22. [x] v0.3.8 licensed catalogue expansion — success condition: six additional OpenNGC open clusters are searchable, calculable, attributed, and covered by metadata checks.
23. [x] v0.3.9 local ambient audio — success condition: a compact player can play/pause/stop the generated ambient default or a user-selected local audio file without adding audio assets to the repository.
24. [x] v0.3.10 local audio persistence — success condition: a user-selected track can be saved to browser IndexedDB, restored after reload, and forgotten without network or repository storage.
25. [x] v0.3.11 observing-window-aware planner — success condition: each object exposes remaining astronomical-night overlap, planner ranking accounts for usable dark time, and multi-location window checks pass.
26. [x] v0.3.12 planner explanations — success condition: planner cards combine readable window guidance, visibility score, difficulty, and reasons, with tested label and ranking behavior.
27. [x] v0.3.13 YouTube player links — success condition: supported YouTube URLs are validated, played through the official embedded player, optionally saved locally, and covered by parser checks without extracting audio.
28. [x] v0.3.14 licensed catalogue expansion — success condition: six additional OpenNGC targets broaden object types and seasonal/southern-sky coverage, retain source fields and attribution, and pass metadata/identifier regression checks.
29. [x] v0.3.15 ephemeris reference expansion — success condition: the offline astronomy regression fixture records the current Horizons endpoint/signature, Moon samples across dates and locations, and additional Saturn observer samples that match local calculations.
30. [x] v0.3.16 object relationships and learning links — success condition: selected objects expose explicitly labelled, reciprocal observing connections that navigate to related catalogue targets and pass relationship integrity checks.
31. [x] v0.3.17 guided learning connections — success condition: each relationship group provides a deterministic three-step observing lesson that is shown with the related-target navigation and passes lesson integrity checks.
32. [x] v0.4 custom observer targeting — success condition: a validated observer context accepts a local named place or latitude/longitude, keeps elevation and IANA time zone explicit, and clearly explains that a time zone alone cannot define a sky location.
33. [x] v0.4 modular dashboard views — success condition: sky, planner, journal, aerial objects, weather, astronomical events, and future Space POV views can be opened as separate modules while sharing one validated observer/time context; unavailable live-data modules are clearly marked planned.
34. [x] v0.4 aerial-object contract foundation — success condition: aircraft, helicopters, rockets, and satellites have distinct validated categories with explicit source, timestamps, coverage semantics, freshness inputs, confidence, and invalid-data checks.
34b. [ ] v0.4 aerial provider adapter — success condition: at least one selected licensed provider supplies timestamped live data through a replaceable adapter with documented update, coverage, privacy, and stale-data behavior.
35. [ ] v0.4 atmospheric layer — success condition: optional cloud and precipitation overlays can show provider time, coverage, freshness, and uncertainty without changing deterministic astronomical positions or claiming observing visibility from weather alone.
36. [ ] v0.4 astronomical-event layer — success condition: eclipses, asteroid close approaches, and meteor/meteoroid events are presented with calculated or sourced event details; recovered meteorites are kept as a separate historical or field-data category rather than live sky targets.
37. [ ] v0.4 Space POV foundation — success condition: an explicit observer-frame model can show Earth as a celestial body from a defined external observer while keeping Earth-POV altitude/azimuth, local horizon, and zenith semantics separate.
38. [ ] Phase 2 web deployment — success condition: the local-first web client can be deployed as a responsive static application, with any live-data proxy/cache boundary documented and no provider secrets exposed in the browser.
39. [ ] Phase 3 Android client — success condition: a native client reuses the calculation/domain contracts, keeps location permission optional and explicit, and supports a responsive observing workflow before adding orientation sensors.
40. [ ] Future telescope integration — success condition: a separately permissioned astronomy-control adapter handles mount limits, coordinate epoch, connection state, and user confirmation without coupling hardware control to the sky map.
41. [x] v0.4 reproducibility handoff — success condition: a fresh clone has a documented return workflow, one verification command, and an anonymized importable journal fixture without committing browser state or generated files.

## Deferred milestones

- v0.3 remaining: broader licensed deep-sky data and more independently produced ephemeris comparisons.
- v0.4: richer web observatory modules: custom locations, aerial objects, atmospheric overlays, event tracking, and the first explicit Space POV model.
- Phase 2: optional cloud deployment of the responsive web client; this must not turn local calculation or journal storage into a mandatory service.
- Phase 3: Android client with optional location/orientation support after the web/domain contracts are stable.
- Future: telescope integration through a suitable astronomy-control protocol after the calculation and safety model are mature.

## Deferred brainstorming

### Multiple observer frames

The current AKASHA viewpoint is an observer standing on Earth: the local horizon surrounds the observer, and the zenith is directly overhead. If we later want to track Earth as a celestial object, the observer must be somewhere else—such as the Moon, a spacecraft, or another planet.

Possible future concepts:

- Earth viewed from the Moon or a spacecraft: altitude, azimuth, distance, phase, and apparent size.
- Earth rotation viewed from outside Earth, including the changing visible hemisphere.
- Tracking a location on Earth as a rotating surface point rather than as a sky object.
- A selectable observer frame while keeping local horizon and zenith definitions explicit.

The new Space & Sky expansion should build on this boundary rather than treating every moving object as a star-map point:

- Canonical location input is latitude/longitude plus optional elevation; a time zone is for time conversion and display, not a unique geographic position.
- Aircraft and helicopters are atmospheric objects; satellites and rockets require separate orbital or launch-state data with timestamps, source attribution, and freshness indicators.
- Cloud and rain movement belongs to an optional weather layer backed by a provider or user data. It is not part of the astronomical ephemeris calculation.
- “Meteor” describes the visible atmospheric streak, “meteoroid” the object in space, and “meteorite” material recovered on the ground. AKASHA should track the first two as sky events; meteorites need a separate field/history workflow.
- Location is sensitive. Future cloud services must use explicit consent, avoid mandatory upload, and keep provider keys and private journal data out of the browser bundle.
