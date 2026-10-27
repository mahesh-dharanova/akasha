import assert from 'node:assert/strict';
import { assessVisibility } from '../src/visibility.ts';

const target = {
  id: 'visibility-test-star',
  name: 'Visibility test star',
  kind: 'star',
  magnitude: 1,
  difficulty: 'naked-eye',
  classification: 'test star',
  description: '',
  guidance: '',
  color: '#fff',
};

const clearConditions = {
  lightPollution: 2,
  cloudCover: 0,
  transparency: 100,
  horizonObstruction: 0,
};

const clear = assessVisibility(target, 60, 'night', null, clearConditions);
assert.equal(clear.breakdown.factors.length, 7, 'normal visibility should expose every score factor');
assert.equal(clear.breakdown.factors.reduce((sum, factor) => sum + factor.weight, 0), 100, 'factor weights should total 100%');
assert.equal(clear.breakdown.obstructionPenalty, 0, 'clear high-altitude target should have no obstruction penalty');
assert.equal(clear.breakdown.cap, null, 'night score should not have a daylight cap');
assert.equal(clear.score, clear.breakdown.uncappedScore, 'uncapped night score should equal the displayed score');

const cloudy = assessVisibility(target, 60, 'night', null, { ...clearConditions, cloudCover: 100 });
const cloudFactor = cloudy.breakdown.factors.find((factor) => factor.label === 'Cloud-free sky');
assert.equal(cloudFactor?.value, 0, 'full cloud cover should produce zero cloud-free points');
assert.ok(cloudy.score < clear.score, 'cloud cover should lower the visibility score');

const obstructed = assessVisibility(target, 10, 'night', null, { ...clearConditions, horizonObstruction: 100 });
assert.ok(obstructed.breakdown.obstructionPenalty > 0, 'low targets should expose horizon obstruction penalty');

const daylight = assessVisibility(target, 60, 'daylight', null, clearConditions);
assert.equal(daylight.breakdown.cap, 8, 'ordinary stars should expose the daylight cap');
assert.equal(daylight.score, 8, 'daylight cap should limit ordinary stars');

console.log('Visibility checks passed: factor weights, condition impact, obstruction penalty, and daylight cap.');
