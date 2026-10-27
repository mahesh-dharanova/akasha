# AKASHA Data Provenance

This ledger records the origin, licence, and handling of data used by AKASHA. New catalogue data must be added here and attributed in the code before it is shipped.

| Source | Licence / status | Data used | Attribution and handling |
|---|---|---|---|
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | MIT; npm package `astronomy-engine` | Sun, Moon, planet ephemerides; observer coordinates; refraction; rise, transit, set, and twilight calculations | Runtime dependency recorded in `package.json`. Positions are calculated locally; no ephemeris data is copied into the repository. |
| [OpenNGC](https://github.com/mattiaverga/OpenNGC) and its [NGC database](https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv) | CC BY-SA 4.0 | Selected Messier/NGC identifiers, J2000 coordinates, object types, visual magnitudes, surface brightness, and angular sizes | Each deep-sky entry has `source: 'OpenNGC · CC BY-SA 4.0'` in `src/catalogue.ts`. Keep the source and licence visible in future catalogue additions. |
| [OpenNGC addendum](https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv) | CC BY-SA 4.0 | Pleiades/addendum catalogue record | The M45 entry identifies `OpenNGC addendum · CC BY-SA 4.0`. |
| [NASA/JPL Horizons API](https://ssd.jpl.nasa.gov/api/horizons.api) ([documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html)) | Generated reference output; no runtime dependency | Topocentric apparent azimuth/elevation and range samples for Moon, Saturn, and Jupiter | Samples are retained only as regression fixtures in `tests/data/`, with API signature `1.2`, query settings, source URL, UTC date, observer location, and airless-refraction setting. |

The v0.3.8 catalogue expansion uses OpenNGC records for M35/NGC 2168, M44/NGC 2632, M37/NGC 2099, M11/NGC 6705, M46/NGC 2437, and M47/NGC 2422. Their coordinates, visual magnitudes, and angular sizes remain source fields; names, descriptions, and finder guidance are application-authored.

The v0.3.14 catalogue expansion uses OpenNGC records for M1/NGC 1952, M20/NGC 6514, M78/NGC 2068, M97/NGC 3587, M101/NGC 5457, and NGC 2070/C 103. Their identifiers, J2000 coordinates, V magnitudes, angular sizes, and M101 surface brightness remain source fields; names, descriptions, classifications, colours, and finder guidance are application-authored.

The v0.3.15 ephemeris expansion adds Moon references for Bengaluru on 2026-10-26 and 2026-11-02, Moon and Saturn references for London on 2026-10-26, and Moon and Saturn references for Cape Town on 2026-10-26. These are generated outputs, not copied catalogue data, and remain test fixtures only.

## Application-authored data

- Bright-star names, coordinates, distances, magnitudes, classifications, descriptions, and finder guidance are currently curated application data in `src/catalogue.ts`. They are not claimed to be a copied database. Exact upstream provenance for these fields remains an open review item; future edits must record a citable source and licence before broader expansion.
- Object explanations and observing guidance are written for AKASHA. They are explanatory text, not measurements.
- Object relationships and three-step lessons in `src/relationships.ts` are application-authored observing and learning links. Their labels explicitly distinguish physical pairs from same-region and comparison links; they are not copied catalogue associations or calibrated scientific conclusions.
- Constellation lines are a small application-authored orientation guide connecting selected catalogue stars. They are not official constellation boundaries.
- The seeded background stars are decorative procedural points and carry no astronomical catalogue meaning.
- The default AKASHA ambient soundscape is generated procedurally in `src/audio.ts`; no recording is bundled. User-selected audio files remain local browser IndexedDB data and are not part of the repository or a network request.
- YouTube media is not copied into AKASHA. User-provided YouTube URLs are optionally stored locally, then played through the official YouTube embedded player; the player itself is an external network dependency at playback time.
- Journal entries and exported journal files are user-created data. They are stored locally and are not transmitted to a service.

## Dependency licences

Direct development dependencies are used only to build the local application: Vite (MIT), TypeScript (Apache-2.0), and `@types/node` (MIT). Their versions and package metadata are resolved through `package-lock.json`.

AKASHA does not currently bundle images, proprietary catalogues, paid APIs, or cloud-hosted runtime data.
