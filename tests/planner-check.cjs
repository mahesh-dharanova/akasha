const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const Module = require('node:module');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

process.env.NODE_PATH = join(process.cwd(), 'node_modules');
Module._initPaths();

const outputDirectory = mkdtempSync(join(tmpdir(), 'akasha-planner-'));
execFileSync('tsc', [
  '--target', 'es2022', '--module', 'commonjs', '--skipLibCheck', '--noEmit', 'false',
  '--outDir', outputDirectory, 'src/planner.ts', 'src/types.ts',
], { stdio: 'inherit' });

const { observingWindowLabel, plannerRank } = require(join(outputDirectory, 'planner.js'));
const instant = new Date('2026-10-26T18:00:00Z');
const object = (score, minutes, startOffsetMinutes = 0) => ({
  visibility: { score },
  observingWindow: {
    start: minutes > 0 ? new Date(instant.getTime() + startOffsetMinutes * 60_000) : null,
    end: minutes > 0 ? new Date(instant.getTime() + (startOffsetMinutes + minutes) * 60_000) : null,
    durationMinutes: minutes,
  },
});

assert.equal(observingWindowLabel(object(80, 360), instant), 'Best now · 6h 0m');
assert.equal(observingWindowLabel(object(80, 120), instant), 'Good for 2h 0m');
assert.equal(observingWindowLabel(object(80, 45), instant), 'Short window · 45m');
assert.equal(observingWindowLabel(object(80, 180, 60), instant), 'Later tonight · 3h 0m');
assert.equal(observingWindowLabel(object(80, 0), instant), 'No dark-sky overlap');

const shorter = object(90, 30);
const longer = object(80, 360);
assert.ok(plannerRank(longer) > plannerRank(shorter), 'a longer dark-sky window should provide a secondary ranking advantage');
assert.equal(plannerRank(object(80, 360)), 95, 'six hours should receive the full 15-point window adjustment');

console.log('Planner checks passed: readable window labels and dark-time ranking adjustment.');
