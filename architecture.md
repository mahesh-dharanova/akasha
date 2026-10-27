# Architecture

## Overview

AKASHA is a browser-local observatory. The browser owns the current observation session, while a pure calculation layer turns an observer location, local date/time, and catalogue object into astronomical coordinates and observing status. UI components consume those results and never implement orbital or coordinate mathematics themselves.

```text
location + date/time
        |
        v
  observation state ----> astronomical calculation adapter ----> derived sky model
        |                                                        |
        +--> local journal                                         +--> sky map
        +--> planner                                               +--> object profile
        +--> time controls                                          +--> tracker / guidance
```

## Components

### UI shell

Vite serves a responsive single-page application. The layout is organized around a wide sky workspace and compact information/planner/journal panels. SVG is used for the map because it provides accessible DOM targets, predictable scaling, and simple hit testing at v0.1.

### Observation state

The session state contains observer latitude/longitude, elevation, IANA time zone, local observing conditions, observation instant, selected object, map view, and local journal state. Observer settings persist through `src/settings.ts` in browser `localStorage`; numeric ranges and IANA timezone values are validated before use. The instant is stored as an ISO value; display formatting is derived from it so time-zone conversions do not drift.

### Calculation layer

`astronomy-engine` is the scientific boundary. The adapter accepts plain application inputs and returns a stable view model containing:

- equatorial coordinates (right ascension and declination),
- horizontal coordinates (altitude and azimuth),
- geometric and refraction-adjusted apparent altitude,
- angular separation from the Sun for Solar System targets,
- angular distance from the zenith,
- rise, transit, and set events when they can be calculated,
- civil, nautical, and astronomical dusk/dawn windows,
- a deliberately limited visibility assessment.

The application does not replace the library's ephemeris with hand-authored planet positions. Curated star coordinates are catalogue values used as inputs to the same observer-coordinate conversion.

### Catalogue

The typed local catalogue contains the Sun, Moon, planets, bright stars, and selected Messier/NGC deep-sky targets. Scientific fields are explicit and nullable. The deep-sky additions use selected OpenNGC fields with CC BY-SA 4.0 attribution recorded on each entry and in the README. The UI can filter deep-sky objects separately from stars and planets. Each future catalogue addition must record its exact upstream source and licence; missing values remain unavailable.

### Planner

The planner ranks catalogue objects using a 0–100 visibility assessment. The score combines calculated altitude, solar twilight, apparent magnitude, surface brightness where available, observing difficulty, and explicit user-supplied observing conditions: Bortle light pollution, cloud cover, transparency, and horizon obstruction. It provides score reasons alongside each recommendation. These inputs affect guidance only; they never alter astronomical positions. It remains guidance, not a guarantee of visibility, and does not automatically retrieve weather.

The selected-object panel exposes the same score as a breakdown: each positive factor reports its normalized value, percentage weight, and weighted contribution; low-altitude horizon obstruction is shown as a penalty; daylight and civil-twilight limits are shown as caps. This presentation is generated from the calculation result, so the UI does not maintain a second scoring formula.

### Tracking

The selected object tracker recalculates seven hourly snapshots from the current observation instant and observer settings. Each row is a navigation control that changes the shared observation instant, so the map, profile, planner, and event window update together. The observing-window timeline adds rise, transit, set, twilight crossings, and dark-sky bands to the same shared time model. These are explicit calculated samples, not claims about actual visibility.

### Journal

The journal stores favourites and observations in `localStorage` behind `src/journal.ts`. Records include object id, note, observed timestamp, and observer location. Export files use a versioned `akasha-journal` JSON envelope; imports are validated before local data is replaced. A future SQLite-backed desktop/server adapter can implement the same interface without changing the calculation layer or UI contracts.

### Ambient audio

`src/audio.ts` owns the optional local audio experience. The default soundscape is synthesized in the browser with Web Audio; user-selected audio files are stored as Blobs in a versioned IndexedDB store when the user chooses Save, then played through temporary object URLs. They are never uploaded or committed. Audio state remains outside the astronomy snapshot so playback does not affect calculations, time controls, or journal data.

## Data flow

1. The observer changes time, date, or location.
2. The state layer normalizes the input into an observation instant and observer coordinates.
3. The calculation adapter recomputes the visible-object view model.
4. The map, profile, planner, and tracker render from that model.
5. Observer settings and journal mutations are serialized locally and reloaded at startup; explicit journal export/import moves the same validated journal state between browsers.

## Key decisions

| Decision | Why | Date |
|---|---|---|
| Use `astronomy-engine` for v0.1 calculations | It is a focused, local, well-established astronomy library with planet/star/observer/event APIs; it avoids inventing positions. | 2026-10-26 |
| Use TypeScript with Vite | Keeps the first web client small while leaving clean module boundaries for a future Android/domain client. | 2026-10-26 |
| Use SVG for the initial sky map | It is sufficient for a responsive altitude/azimuth view and makes object selection straightforward without a heavy WebGL dependency. | 2026-10-26 |
| Keep the starter catalogue local and curated | v0.1 needs deterministic offline behavior and honest metadata before adding a large external catalogue. | 2026-10-26 |
| Keep journal persistence behind an interface | Local storage meets the first milestone while preserving a migration path to SQLite or another durable local store. | 2026-10-26 |
| Treat above-horizon as necessary, not sufficient, for visibility | Twilight and practical observing conditions materially affect what an observer can see. | 2026-10-26 |
| Use explicit twilight crossings for observing windows | Civil, nautical, and astronomical twilight are useful, calculable boundaries and are clearer than a single day/night flag. | 2026-10-26 |
| Keep visibility scoring transparent and local | Users can inspect why a recommendation changed, and no opaque model is allowed to make a scientific visibility claim. | 2026-10-26 |
| Use selected OpenNGC data for v0.2 deep-sky expansion | OpenNGC provides J2000 positions, object types, magnitudes, sizes, and CC BY-SA 4.0 licensing suitable for a small attributed local catalogue. | 2026-10-26 |
| Keep geometric and apparent altitude separate | The mathematical horizon is defined at geometric altitude 0°, while normal atmospheric refraction changes the apparent position near the horizon. | 2026-10-26 |
| Treat solar proximity as a recommendation and safety boundary | A bright object can be high above the horizon while still being unsafe or impractical to observe near the Sun. | 2026-10-26 |
| Present rise/transit/set as one observing window | Independent “next event” searches can produce dates from different daily cycles and confuse observers. | 2026-10-26 |

## Data sources and licensing

- Astronomical calculations: `astronomy-engine` package and its published documentation/licence, recorded in `package.json` and the installed package metadata.
- Starter star coordinates and names: standard bright-star catalogue identifiers and values included as application data; expansion requires recording the exact upstream catalogue and licence.
- Selected deep-sky coordinates, types, sizes, and visual magnitudes: [OpenNGC](https://github.com/mattiaverga/OpenNGC), CC BY-SA 4.0; each imported entry records this source in `src/catalogue.ts`.
- Object explanations: concise application-authored descriptions in the local catalogue; they are not presented as live scientific measurements.
- Complete source and licence ledger: [data-provenance.md](data-provenance.md).

Before v0.3, review and document the exact upstream sources for every non-calculated catalogue property, especially distances, spectral classifications, and deep-sky metadata.

## Future boundaries

- A domain package can later be shared with Android if its inputs/outputs remain plain data.
- Telescope control belongs behind a separate adapter with explicit connection state, coordinate epoch, mount limits, and user confirmation; it is not part of v0.1.
- Optional AI belongs above the deterministic domain layer as an explanation/query client. It must not be the source of positions, rise/set events, or catalogue facts.
