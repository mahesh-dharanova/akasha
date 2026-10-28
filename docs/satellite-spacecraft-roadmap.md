# Satellite, Launch, and Deep-Space Tracking Roadmap

This document records the approved future work discussed after commit `daea63e`. It is planning documentation only; no implementation from this roadmap has been started.

## Current baseline

The Aerial view currently provides:

- Aircraft positions from adsb.fi, shown in a ground-radius radar with optional refresh tracking.
- Earth-orbit station positions from CelesTrak OMM elements propagated locally with `satellite.js` SGP4/SDP4.
- Upcoming launch events from Launch Library 2, kept as event records rather than positions.

The repository is clean and synchronized with `origin/main` at `daea63e feat: add satellite propagation and launch events`.

## Three tracking domains

| Domain | Correct calculation/data model | Planned presentation |
|---|---|---|
| Earth-orbit satellite | CelesTrak OMM/GP element set + local SGP4/SDP4 propagation | Observer sky-radar: azimuth around the circle, elevation from horizon edge to zenith centre |
| Launch event / launch vehicle | Launch Library 2 event metadata; later an independently sourced post-launch orbit or trajectory | Clickable event details and observation-time navigation; position tracking only when valid trajectory data exists |
| Deep-space spacecraft | JPL Horizons-style ephemeris/state-vector calculation; not SGP4 | Searchable spacecraft profile with observer-frame position, distance, direction, and ephemeris time |

An Earth-orbit satellite, a deep-space spacecraft, a planet, and a launch event must not be represented by one generic position calculation. Their source, reference frame, uncertainty, and update cadence differ.

## Approved implementation order

### 34f — Satellite sky-radar presentation

Add a dedicated satellite radar beside the current aircraft radar.

Success conditions:

- Azimuth is the circular direction coordinate; north is at the top.
- Elevation is represented radially: horizon at the outer edge and zenith at the centre.
- Cached orbital elements are propagated locally as the observation time advances.
- The display can animate satellite movement without downloading new elements every second.
- Each dot can show name, NORAD ID, azimuth, elevation, range, altitude, epoch, and geometric-horizon state.
- The UI explains that geometric elevation above 0° is not a visibility guarantee.

### 34g — Satellite catalogue search and technical profile

Add a searchable Earth-orbit satellite section by name, partial name, NORAD catalogue number, or supported CelesTrak group.

Technical details should include object identifiers, element epoch, retrieval time, inclination, eccentricity, RAAN, argument of perigee, mean anomaly, mean motion, derived orbit period/perigee/apogee where supported, current observer values, freshness, and uncertainty wording.

### 34h — Clickable launch events and post-launch trackability

- Clicking a launch opens its event profile and can move the shared observation time to the launch window.
- Show provider, pad, mission, status, window start/end, retrieval time, and source link when available.
- Before launch, label the record as an event, not a position.
- After launch, show “tracking unavailable” until a valid orbital element or trajectory source exists.
- When a post-launch source is available, link the resulting object to a satellite record rather than silently turning the launch record into a satellite.

### 34i — Deep-space spacecraft search

- Start with a curated, source-labelled spacecraft identifier list for reliable search targets.
- Add JPL Horizons-backed ephemeris queries through a documented local proxy if runtime use is approved.
- Calculate observer-frame direction, distance, and time-dependent position using the appropriate Horizons target and observer context.
- Distinguish spacecraft from planets, moons, asteroids, and Earth-orbiting satellites.
- Show ephemeris epoch, query settings, source, retrieval time, and limitations.
- Never pass deep-space spacecraft records into `satellite.js` SGP4/SDP4.

## Resume procedure

```bash
cd ~/Dev/Projects/Web/akasha
git pull --ff-only origin main
npm install
npm run verify
```

Then read, in order: `current_state.md`, `plan.md`, this document, `architecture.md`, and `data-provenance.md`.

Begin with 34f only. Do not implement launch tracking or deep-space search in the same chunk as the satellite radar unless the plan is deliberately revised and documented first.

## Source boundaries

- CelesTrak GP/OMM data supplies Earth-orbit element sets and must retain the source epoch and usage-policy boundary.
- `satellite.js` supplies local SGP4/SDP4 propagation and is not an orbital-data source.
- Launch Library 2 supplies launch-event metadata and is not a trajectory provider.
- JPL Horizons is the candidate source for deep-space spacecraft ephemerides; runtime use, query limits, and proxy handling must be reviewed before implementation.
