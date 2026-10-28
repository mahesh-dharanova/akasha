import assert from 'node:assert/strict';
import { buildAdsbFiAircraftUrl, parseAdsbFiResponse } from '../src/aerialProviders.ts';

const query = { latitude: 12.9716, longitude: 77.5946, radiusNauticalMiles: 25 };
assert.equal(buildAdsbFiAircraftUrl(query), '/api/adsb-fi/lat/12.9716/lon/77.5946/dist/25.0');
assert.throws(() => buildAdsbFiAircraftUrl({ ...query, radiusNauticalMiles: 251 }), /between 0 and 250/);

const snapshot = parseAdsbFiResponse({
  ac: [
    { hex: 'ABC123', flight: ' AKS001 ', lat: 13, lon: 77.6, alt_baro: 10000, gs: 100, track: 90, seen_pos: 5 },
    { hex: 'NOALT', lat: 13, lon: 77.6, alt_baro: 'ground' },
  ],
}, '2026-01-01T18:00:00.000Z', query);

assert.equal(snapshot.fixture, false);
assert.equal(snapshot.source.id, 'adsb-fi');
assert.ok(Math.abs(snapshot.coverage.radiusKm - 46.3) < 1e-9);
assert.equal(snapshot.objects.length, 1);
assert.equal(snapshot.objects[0].name, 'AKS001');
assert.equal(snapshot.objects[0].kind, 'aircraft');
assert.equal(snapshot.objects[0].altitudeMeters, 3048);
assert.equal(snapshot.objects[0].speedMetersPerSecond, 51.4444);
assert.equal(snapshot.objects[0].observedAt, '2026-01-01T17:59:55.000Z');

console.log('Aerial provider checks passed: adsb.fi URL, units, timestamps, source attribution, and incomplete-state handling.');
