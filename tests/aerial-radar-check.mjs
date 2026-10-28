import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAerialSnapshot } from '../src/aerial.ts';
import { estimateAerialObjectPosition, projectAerialObject } from '../src/aerialRadar.ts';

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

const moving = { ...snapshot.objects[0], latitude: snapshot.coverage.centerLatitude, longitude: snapshot.coverage.centerLongitude, headingDegrees: 90, speedMetersPerSecond: 100, observedAt: '2026-10-28T00:00:00.000Z' };
const estimated = estimateAerialObjectPosition(moving, new Date('2026-10-28T00:00:10.000Z'));
assert.ok(estimated.longitude > moving.longitude, 'eastbound aircraft estimates should move east');
assert.equal(estimated.latitude, moving.latitude, 'eastbound aircraft estimates should keep latitude stable');
const capped = estimateAerialObjectPosition(moving, new Date('2026-10-28T00:10:00.000Z'));
const atCap = estimateAerialObjectPosition(moving, new Date('2026-10-28T00:00:30.000Z'));
assert.equal(capped.longitude, atCap.longitude, 'between-refresh estimates should be capped');

console.log('Aerial radar checks passed: local projection, bearings, radius clipping, and cardinal orientation.');
