import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseJournalFile } from '../src/journal.ts';

const journal = parseJournalFile(readFileSync(new URL('../docs/example-journal.json', import.meta.url), 'utf8'));
assert.deepEqual(journal.favourites, ['vega', 'm42']);
assert.equal(journal.entries.length, 2);
assert.equal(journal.entries[0].latitude, 12.9716);

console.log('Reproducibility checks passed: the committed example journal is import-compatible.');
