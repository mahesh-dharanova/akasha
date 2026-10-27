const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const Module = require('node:module');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

process.env.NODE_PATH = join(process.cwd(), 'node_modules');
Module._initPaths();

const outputDirectory = mkdtempSync(join(tmpdir(), 'akasha-window-'));
execFileSync('tsc', [
  '--target', 'es2022', '--module', 'commonjs', '--skipLibCheck', '--noEmit', 'false',
  '--outDir', outputDirectory,
  'src/astronomy.ts', 'src/catalogue.ts', 'src/types.ts', 'src/visibility.ts',
], { stdio: 'inherit' });

const { calculateSky } = require(join(outputDirectory, 'astronomy.js'));
const instant = new Date('2026-10-26T18:00:00Z');
const locations = [
  { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, elevation: 920 },
  { name: 'London', latitude: 51.5072, longitude: -0.1276, elevation: 11 },
  { name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, elevation: 15 },
];

for (const location of locations) {
  const snapshot = calculateSky(instant, { ...location, timeZone: 'UTC', lightPollution: 6, cloudCover: 0, transparency: 70, horizonObstruction: 0 });
  const polaris = snapshot.objects.find((object) => object.id === 'polaris');
  assert.ok(polaris, `${location.name} should calculate Polaris`);
  assert.ok(polaris.observingWindow.durationMinutes > 0, `${location.name} Polaris should overlap astronomical night`);
  assert.ok(polaris.observingWindow.start < polaris.observingWindow.end, `${location.name} Polaris window should be ordered`);
  assert.ok(polaris.observingWindow.start >= instant, `${location.name} Polaris window should begin now or later`);

  for (const object of snapshot.objects) {
    assert.ok(object.observingWindow.durationMinutes >= 0, `${location.name} ${object.name} window should not be negative`);
    if (object.observingWindow.start && object.observingWindow.end) {
      const duration = Math.round((object.observingWindow.end - object.observingWindow.start) / 60_000);
      assert.equal(object.observingWindow.durationMinutes, duration, `${location.name} ${object.name} duration should match its interval`);
    }
  }
}

console.log('Observing-window checks passed: dark-sky overlap ordering and multi-location coverage.');
