import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAerialSnapshot } from '../src/aerial.ts';

const snapshot = parseAerialSnapshot(JSON.parse(readFileSync(new URL('./data/aerial-fixture.json', import.meta.url), 'utf8')));
assert.equal(snapshot.fixture, true);
assert.equal(snapshot.coverage.kind, 'three-dimensional-volume');
assert.deepEqual(snapshot.objects.map((object) => object.kind), ['aircraft', 'helicopter', 'rocket', 'satellite']);
assert.ok(snapshot.objects.every((object) => object.observedAt && object.id));
assert.throws(() => parseAerialSnapshot({ ...snapshot, source: { id: 'missing-licence' } }), /licence/);
assert.throws(() => parseAerialSnapshot({ ...snapshot, coverage: { ...snapshot.coverage, maximumAltitudeMeters: -1 } }), /altitude bounds/);

console.log('Aerial checks passed: object categories, source metadata, timestamps, coverage semantics, and invalid-data rejection.');
