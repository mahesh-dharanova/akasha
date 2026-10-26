import type { JournalEntry, JournalState } from './types';

const JOURNAL_KEY = 'akasha-journal-v1';
const JOURNAL_FORMAT = 'akasha-journal';
const JOURNAL_VERSION = 1;

export function emptyJournal(): JournalState {
  return { favourites: [], entries: [] };
}

function isJournalEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<JournalEntry>;
  return typeof entry.id === 'string'
    && typeof entry.objectId === 'string'
    && typeof entry.note === 'string'
    && typeof entry.observedAt === 'string'
    && typeof entry.latitude === 'number'
    && typeof entry.longitude === 'number';
}

export function parseJournalState(value: unknown): JournalState {
  if (!value || typeof value !== 'object') throw new Error('The journal file is not an object.');
  const candidate = value as Partial<JournalState>;
  if (!Array.isArray(candidate.favourites) || !candidate.favourites.every((item) => typeof item === 'string')) {
    throw new Error('The journal file has invalid favourites.');
  }
  if (!Array.isArray(candidate.entries) || !candidate.entries.every(isJournalEntry)) {
    throw new Error('The journal file has invalid observation entries.');
  }
  return {
    favourites: [...new Set(candidate.favourites)],
    entries: candidate.entries.map((entry) => ({ ...entry })),
  };
}

export function loadJournal(): JournalState {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? parseJournalState(JSON.parse(raw)) : emptyJournal();
  } catch {
    return emptyJournal();
  }
}

export function saveJournal(journal: JournalState): void {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(parseJournalState(journal)));
}

export function serializeJournal(journal: JournalState): string {
  return JSON.stringify({
    format: JOURNAL_FORMAT,
    version: JOURNAL_VERSION,
    exportedAt: new Date().toISOString(),
    journal: parseJournalState(journal),
  }, null, 2);
}

export function parseJournalFile(raw: string): JournalState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The journal file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('The journal file is invalid.');
  const envelope = parsed as { format?: unknown; version?: unknown; journal?: unknown };
  if (envelope.format !== JOURNAL_FORMAT || envelope.version !== JOURNAL_VERSION) {
    throw new Error('This is not a compatible AKASHA journal export.');
  }
  return parseJournalState(envelope.journal);
}
