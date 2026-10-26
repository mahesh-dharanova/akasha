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

## Deferred milestones

- v0.3 remaining: broader licensed deep-sky data, independently produced ephemeris comparisons, object relationships, and an interactive learning path.
- v0.4: optional Android client with location/orientation support.
- v0.5: telescope integration through a suitable astronomy-control protocol after the calculation and safety model are mature.
