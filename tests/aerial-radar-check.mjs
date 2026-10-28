import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAerialSnapshot } from '../src/aerial.ts';
import { projectAerialObject } from '../src/aerialRadar.ts';

const snapshot = parseAerialSnapshot(JSON.parse(readFileSync(new URL('./data/aerial-fixture.json', import.meta.url), 'utf8')));
const center = projectAerialObject({ ...snapshot.objects[0], latitude: snapshot.coverage.centerLatitude, longitude: snapshot.coverage.centerLongitude }, snapshot.coverage);
assert.equal(center.x, 50);
assert.equal(center.y, 50);
assert.equal(center.bearingDegrees, 0);
assert.equal(center.withinRadius, true);

const east = projectAerialObject({ ...snapshot.objects[0], latitude: snapshot.coverage.centerLatitude, longitude: snapshot.coverage.centerLongitude + 0.5 }, snapshot.coverage);
assert.ok(east.x > 50, 'east objects should render to the right of the observer');
assert.ok(Math.abs(east.y - 50) < 0.01, 'east objects should stay on the horizontal axis');

const outside = projectAerialObject({ ...snapshot.objects[0], latitude: snapshot.coverage.centerLatitude + 2, longitude: snapshot.coverage.centerLongitude }, snapshot.coverage);
assert.equal(outside.withinRadius, false);
assert.equal(outside.y, 6, 'outside objects should be clamped to the radar edge');

console.log('Aerial radar checks passed: local projection, bearings, radius clipping, and cardinal orientation.');
