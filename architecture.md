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

The session state contains observer latitude/longitude, IANA time zone, observation instant, selected object, map view, and local journal state. The instant is stored as an ISO value; display formatting is derived from it so time-zone conversions do not drift.

### Calculation layer

`astronomy-engine` is the scientific boundary. The adapter accepts plain application inputs and returns a stable view model containing:

- equatorial coordinates (right ascension and declination),
- horizontal coordinates (altitude and azimuth),
- angular distance from the zenith,
- rise, transit, and set events when they can be calculated,
- twilight context,
- a deliberately limited visibility status.

The application does not replace the library's ephemeris with hand-authored planet positions. Curated star coordinates are catalogue values used as inputs to the same observer-coordinate conversion.

### Catalogue

The first catalogue is a typed, local starter dataset containing the Sun, Moon, planets, and a small selection of bright stars. Scientific fields are explicit and nullable. Each future catalogue addition must record its source and licence in code or an accompanying data note; missing values remain unavailable.

### Planner

The planner ranks catalogue objects using calculated altitude, twilight context, apparent magnitude, object type, and beginner suitability. It provides an explanation alongside each recommendation. It is guidance, not a guarantee of visibility: weather, light pollution, obstructions, optics, and eyesight are outside v0.1.

### Journal

The journal stores favourites and observations in `localStorage` behind a small repository interface. Records include object id, note, observed timestamp, and observer location. A future SQLite-backed desktop/server adapter can implement the same interface without changing the calculation layer or UI contracts.

## Data flow

1. The observer changes time, date, or location.
2. The state layer normalizes the input into an observation instant and observer coordinates.
3. The calculation adapter recomputes the visible-object view model.
4. The map, profile, planner, and tracker render from that model.
5. Journal mutations are serialized locally and reloaded at startup.

## Key decisions

| Decision | Why | Date |
|---|---|---|
| Use `astronomy-engine` for v0.1 calculations | It is a focused, local, well-established astronomy library with planet/star/observer/event APIs; it avoids inventing positions. | 2026-10-26 |
| Use TypeScript with Vite | Keeps the first web client small while leaving clean module boundaries for a future Android/domain client. | 2026-10-26 |
| Use SVG for the initial sky map | It is sufficient for a responsive altitude/azimuth view and makes object selection straightforward without a heavy WebGL dependency. | 2026-10-26 |
| Keep the starter catalogue local and curated | v0.1 needs deterministic offline behavior and honest metadata before adding a large external catalogue. | 2026-10-26 |
| Keep journal persistence behind an interface | Local storage meets the first milestone while preserving a migration path to SQLite or another durable local store. | 2026-10-26 |
| Treat above-horizon as necessary, not sufficient, for visibility | Twilight and practical observing conditions materially affect what an observer can see. | 2026-10-26 |

## Data sources and licensing

- Astronomical calculations: `astronomy-engine` package and its published documentation/licence, recorded in `package.json` and the installed package metadata.
- Starter star coordinates and names: standard bright-star catalogue identifiers and values included as application data; expansion requires recording the exact upstream catalogue and licence.
- Object explanations: concise application-authored descriptions in the local catalogue; they are not presented as live scientific measurements.

Before v0.2, review and document the exact upstream sources for every non-calculated catalogue property, especially distances, spectral classifications, and deep-sky metadata.

## Future boundaries

- A domain package can later be shared with Android if its inputs/outputs remain plain data.
- Telescope control belongs behind a separate adapter with explicit connection state, coordinate epoch, mount limits, and user confirmation; it is not part of v0.1.
- Optional AI belongs above the deterministic domain layer as an explanation/query client. It must not be the source of positions, rise/set events, or catalogue facts.
