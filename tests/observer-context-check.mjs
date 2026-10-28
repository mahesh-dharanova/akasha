import assert from 'node:assert/strict';
import { applyObserverPreset, DEFAULT_LOCATION_NAME, normalizeLocationName, OBSERVER_PRESETS } from '../src/observer.ts';

const base = {
  locationName: DEFAULT_LOCATION_NAME,
  latitude: 0,
  longitude: 0,
  elevation: 0,
  timeZone: 'UTC',
  lightPollution: 6,
  cloudCover: 0,
  transparency: 70,
  horizonObstruction: 0,
};

assert.equal(normalizeLocationName('  My   rooftop  '), 'My rooftop');
assert.equal(normalizeLocationName(''), DEFAULT_LOCATION_NAME);
assert.equal(normalizeLocationName('x'.repeat(100)).length, 80);

const bengaluru = OBSERVER_PRESETS.find((preset) => preset.id === 'bengaluru');
const london = OBSERVER_PRESETS.find((preset) => preset.id === 'london');
assert.ok(bengaluru && london, 'named observer presets should exist');

const bengaluruSettings = applyObserverPreset(base, bengaluru);
const londonSettings = applyObserverPreset(base, london);
assert.equal(bengaluruSettings.locationName, 'Bengaluru');
assert.equal(bengaluruSettings.timeZone, 'Asia/Kolkata');
assert.equal(londonSettings.locationName, 'London');
assert.equal(londonSettings.timeZone, 'Europe/London');
assert.notEqual(bengaluruSettings.latitude, londonSettings.latitude);
assert.notEqual(bengaluruSettings.longitude, londonSettings.longitude);

console.log('Observer context checks passed: named locations, labels, coordinates, and time zones remain explicit.');
