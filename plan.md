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

## Deferred milestones

- v0.3 remaining: broader licensed deep-sky data, more independently produced ephemeris comparisons, object relationships, and an interactive learning path.
- v0.4: optional Android client with location/orientation support.
- v0.5: telescope integration through a suitable astronomy-control protocol after the calculation and safety model are mature.

## Deferred brainstorming

### Multiple observer frames

The current AKASHA viewpoint is an observer standing on Earth: the local horizon surrounds the observer, and the zenith is directly overhead. If we later want to track Earth as a celestial object, the observer must be somewhere else—such as the Moon, a spacecraft, or another planet.

Possible future concepts:

- Earth viewed from the Moon or a spacecraft: altitude, azimuth, distance, phase, and apparent size.
- Earth rotation viewed from outside Earth, including the changing visible hemisphere.
- Tracking a location on Earth as a rotating surface point rather than as a sky object.
- A selectable observer frame while keeping local horizon and zenith definitions explicit.
