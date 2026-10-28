import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCelestrakStationsUrl, parseCelestrakResponse } from '../src/satelliteProviders.ts';

const observer = { latitude: 12.9716, longitude: 77.5946, elevationMeters: 920 };
const observationTime = new Date('2026-10-28T00:00:00.000Z');
const snapshot = parseCelestrakResponse(JSON.parse(readFileSync(new URL('./data/satellite-omm-fixture.json', import.meta.url), 'utf8')), observer, observationTime, '2026-10-28T00:01:00.000Z');
const iss = snapshot.objects[0];

assert.equal(buildCelestrakStationsUrl(), '/api/celestrak-stations');
assert.equal(snapshot.source.id, 'celestrak-gp');
assert.equal(snapshot.objects.length, 1);
assert.equal(iss.name, 'ISS (ZARYA)');
assert.equal(iss.noradCatalogId, '25544');
assert.equal(iss.internationalDesignator, '1998-067A');
assert.equal(iss.propagationModel, 'SGP4/SDP4');
assert.ok(iss.latitude >= -90 && iss.latitude <= 90);
assert.ok(iss.longitude >= -180 && iss.longitude <= 180);
assert.ok(iss.altitudeMeters > 100_000 && iss.altitudeMeters < 1_000_000);
assert.ok(iss.azimuthDegrees >= 0 && iss.azimuthDegrees < 360);
assert.ok(iss.elevationDegrees >= -90 && iss.elevationDegrees <= 90);
assert.ok(iss.rangeKm > 0);

console.log('Satellite provider checks passed: OMM parsing, local SGP4 propagation, observer look angles, epoch, and source metadata.');
