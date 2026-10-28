import assert from 'node:assert/strict';
import { buildLaunchLibraryUpcomingUrl, parseLaunchLibraryResponse } from '../src/launchProviders.ts';

const snapshot = parseLaunchLibraryResponse({
  results: [
    {
      id: 'launch-1',
      name: 'AKASHA Test Flight',
      net: '2026-11-02T10:30:00Z',
      window_start: '2026-11-02T10:00:00Z',
      window_end: '2026-11-02T11:00:00Z',
      status: { name: 'Go' },
      launch_service_provider: { name: 'Example Launch Provider' },
      pad: { location: { name: 'Example Spaceport' } },
      mission: { description: 'Application test event.' },
    },
    { id: 'missing-net', name: 'Incomplete record' },
  ],
}, '2026-10-28T00:00:00.000Z');

assert.equal(buildLaunchLibraryUpcomingUrl(), '/api/launch-library-upcoming');
assert.equal(snapshot.source.id, 'launch-library-2');
assert.equal(snapshot.events.length, 1);
assert.equal(snapshot.events[0].name, 'AKASHA Test Flight');
assert.equal(snapshot.events[0].launchServiceProvider, 'Example Launch Provider');
assert.equal(snapshot.events[0].location, 'Example Spaceport');
assert.equal(snapshot.events[0].mission, 'Application test event.');
assert.equal(snapshot.events[0].status, 'Go');

console.log('Launch provider checks passed: event parsing, incomplete-record handling, source metadata, and non-positional semantics.');
