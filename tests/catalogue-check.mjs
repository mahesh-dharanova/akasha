import assert from 'node:assert/strict';
import { CATALOGUE } from '../src/catalogue.ts';

const expected = [
  ['m35', 'M35 / NGC 2168'],
  ['m44', 'M44 / NGC 2632'],
  ['m37', 'M37 / NGC 2099'],
  ['m11', 'M11 / NGC 6705'],
  ['m46', 'M46 / NGC 2437'],
  ['m47', 'M47 / NGC 2422'],
  ['m1', 'M1 / NGC 1952'],
  ['m20', 'M20 / NGC 6514'],
  ['m78', 'M78 / NGC 2068'],
  ['m97', 'M97 / NGC 3587'],
  ['m101', 'M101 / NGC 5457'],
  ['ngc2070', 'NGC 2070 / C 103'],
];

for (const [id, catalogueId] of expected) {
  const object = CATALOGUE.find((entry) => entry.id === id);
  assert.ok(object, `${id} should be present in the catalogue`);
  assert.equal(object.kind, 'deep-sky', `${id} should be a deep-sky target`);
  assert.equal(object.catalogueId, catalogueId, `${id} should retain its OpenNGC identifier`);
  assert.equal(object.source, 'OpenNGC · CC BY-SA 4.0', `${id} should retain licence attribution`);
  assert.ok(Number.isFinite(object.raJ2000) && Number.isFinite(object.decJ2000), `${id} should have finite J2000 coordinates`);
  assert.ok(object.magnitude !== null && Number.isFinite(object.magnitude), `${id} should have a recorded visual magnitude`);
  assert.ok(Number.isFinite(object.angularSizeArcmin), `${id} should have a recorded angular size`);
}

const catalogueIds = CATALOGUE.map((object) => object.catalogueId).filter(Boolean);
assert.equal(new Set(catalogueIds).size, catalogueIds.length, 'catalogue identifiers should be unique');

console.log('Catalogue checks passed: twelve OpenNGC targets, metadata, attribution, and identifier uniqueness.');
