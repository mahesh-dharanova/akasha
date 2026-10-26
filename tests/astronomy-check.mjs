import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as Astronomy from 'astronomy-engine';

const horizons = JSON.parse(await readFile(new URL('./data/jpl-horizons-2026-10-26.json', import.meta.url), 'utf8'));

const observer = new Astronomy.Observer(12.9716, 77.5946, 920);
const start = new Date('2026-10-26T18:00:00Z');

// Polaris is close to the north celestial pole, so its altitude should be close to latitude.
Astronomy.DefineStar(Astronomy.Body.Star1, 2.5303, 89.2641, 433);
const polaris = Astronomy.Equator(Astronomy.Body.Star1, start, observer, true, true);
const polarisHorizontal = Astronomy.Horizon(start, observer, polaris.ra, polaris.dec);
assert.ok(Math.abs(polarisHorizontal.altitude - observer.latitude) < 1.5, 'Polaris altitude should track observer latitude');
assert.ok(polarisHorizontal.azimuth < 5 || polarisHorizontal.azimuth > 355, 'Polaris should be near true north');
assert.ok(Math.abs(polarisHorizontal.altitude - 13.53949) < 0.01, 'Polaris Bengaluru reference altitude should remain stable');

// The apparent nightly motion is large even when the planet's orbital movement is small.
const saturnNow = Astronomy.Equator(Astronomy.Body.Saturn, start, observer, true, true);
const sixHoursLater = new Date(start.getTime() + 6 * 60 * 60 * 1000);
const saturnLater = Astronomy.Equator(Astronomy.Body.Saturn, sixHoursLater, observer, true, true);
const saturnNowHorizontal = Astronomy.Horizon(start, observer, saturnNow.ra, saturnNow.dec);
const saturnLaterHorizontal = Astronomy.Horizon(sixHoursLater, observer, saturnLater.ra, saturnLater.dec);
assert.ok(Math.abs(saturnLaterHorizontal.altitude - saturnNowHorizontal.altitude) > 20, 'Saturn should move substantially across the local sky');
assert.ok(Math.abs(saturnLater.ra - saturnNow.ra) < 0.01, 'Saturn orbital movement should be much slower than nightly apparent movement');

// Twilight crossings must be returned in chronological order for the same local night.
const nextDawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, 1, start, 2, -6).date;
const nextDusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, start, 2, -6).date;
assert.ok(nextDawn < nextDusk, 'Civil/nautical-style dawn should precede dusk in the next daily cycle');

for (const sample of horizons.samples) {
  const body = Astronomy.Body[sample.objectId[0].toUpperCase() + sample.objectId.slice(1)];
  const equator = Astronomy.Equator(body, new Date(sample.instant), observer, true, true);
  const horizontal = Astronomy.Horizon(new Date(sample.instant), observer, equator.ra, equator.dec);
  assert.ok(Math.abs(horizontal.azimuth - sample.azimuth) < 0.05, `${sample.body} azimuth should match JPL Horizons within 0.05°`);
  assert.ok(Math.abs(horizontal.altitude - sample.altitude) < 0.05, `${sample.body} altitude should match JPL Horizons within 0.05°`);
  assert.ok(Math.abs(equator.dist - sample.distanceAu) < 0.001, `${sample.body} distance should match JPL Horizons within 0.001 AU`);
}

console.log('Astronomy checks passed: Polaris orientation, deterministic reference altitude, Saturn time movement, twilight ordering, and JPL Horizons samples.');
