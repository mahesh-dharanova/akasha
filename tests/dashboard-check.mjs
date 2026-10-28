import assert from 'node:assert/strict';
import { DASHBOARD_MODULES } from '../src/dashboard.ts';

assert.deepEqual(DASHBOARD_MODULES.map((module) => module.id), ['sky', 'planner', 'journal', 'aerial', 'weather', 'events', 'space']);
assert.deepEqual(DASHBOARD_MODULES.filter((module) => module.implemented).map((module) => module.id), ['sky', 'planner', 'journal', 'aerial']);
assert.equal(DASHBOARD_MODULES.filter((module) => !module.implemented).length, 3);
assert.ok(DASHBOARD_MODULES.every((module) => module.label && module.description), 'every module needs readable navigation text');

console.log('Dashboard checks passed: current and planned modules have stable ids and honest implementation status.');
