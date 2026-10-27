import assert from 'node:assert/strict';
import { CATALOGUE } from '../src/catalogue.ts';
import { OBJECT_RELATIONSHIPS } from '../src/relationships.ts';

const catalogueIds = new Set(CATALOGUE.map((object) => object.id));
let relationshipCount = 0;

for (const [sourceId, relationships] of Object.entries(OBJECT_RELATIONSHIPS)) {
  assert.ok(catalogueIds.has(sourceId), `${sourceId} should exist in the catalogue`);
  const targetIds = new Set();
  for (const relationship of relationships) {
    relationshipCount += 1;
    assert.ok(catalogueIds.has(relationship.targetId), `${sourceId} target ${relationship.targetId} should exist in the catalogue`);
    assert.notEqual(sourceId, relationship.targetId, `${sourceId} should not relate to itself`);
    assert.ok(!targetIds.has(relationship.targetId), `${sourceId} should not duplicate ${relationship.targetId}`);
    targetIds.add(relationship.targetId);
    const reverse = OBJECT_RELATIONSHIPS[relationship.targetId]?.find((candidate) => candidate.targetId === sourceId);
    assert.ok(reverse, `${sourceId} relationship with ${relationship.targetId} should be reciprocal`);
    assert.equal(reverse.kind, relationship.kind, `${sourceId} and ${relationship.targetId} should share relationship kind`);
  }
}

assert.ok(relationshipCount >= 10, 'the first learning layer should expose multiple object connections');
console.log(`Relationship checks passed: ${relationshipCount} reciprocal catalogue connections.`);
