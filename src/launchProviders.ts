import type { AerialSource } from './aerial';

export const LAUNCH_LIBRARY_SOURCE: AerialSource = {
  id: 'launch-library-2',
  label: 'Launch Library 2',
  licence: 'Free API with unauthenticated rate limit of 15 calls/hour',
  attribution: 'Launch data from The Space Devs · https://thespacedevs.com',
};

export interface LaunchEvent {
  id: string;
  name: string;
  net: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  launchServiceProvider: string | null;
  location: string | null;
  mission: string | null;
}

export interface LaunchSnapshot {
  schemaVersion: 1;
  fixture: boolean;
  retrievedAt: string;
  source: AerialSource;
  events: LaunchEvent[];
}

const LaunchLibraryUpcomingUrl = '/api/launch-library-upcoming';

function timestamp(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function nestedString(value: unknown, key: string): string | null {
  if (!value || typeof value !== 'object') return null;
  const nested = (value as Record<string, unknown>)[key];
  return typeof nested === 'string' && nested.trim() ? nested : null;
}

export function buildLaunchLibraryUpcomingUrl(): string {
  return LaunchLibraryUpcomingUrl;
}

export function parseLaunchLibraryResponse(payload: unknown, retrievedAt: string): LaunchSnapshot {
  if (!Number.isFinite(Date.parse(retrievedAt))) throw new Error('Launch retrieval timestamp is invalid.');
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { results?: unknown }).results)) throw new Error('Launch Library response has no results array.');
  const events = (payload as { results: Array<Record<string, unknown>> }).results.flatMap((item) => {
    if (typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim()) return [];
    const net = timestamp(item.net);
    if (!net) return [];
    return [{
      id: item.id,
      name: item.name,
      net,
      windowStart: timestamp(item.window_start),
      windowEnd: timestamp(item.window_end),
      status: nestedString(item.status, 'name') ?? 'Status unavailable',
      launchServiceProvider: nestedString(item.launch_service_provider, 'name'),
      location: nestedString(item.pad && typeof item.pad === 'object' ? (item.pad as Record<string, unknown>).location : null, 'name'),
      mission: nestedString(item.mission, 'description'),
    }];
  });
  return { schemaVersion: 1, fixture: false, retrievedAt, source: { ...LAUNCH_LIBRARY_SOURCE }, events };
}

export async function fetchUpcomingLaunches(fetcher: typeof fetch = fetch): Promise<LaunchSnapshot> {
  const response = await fetcher(buildLaunchLibraryUpcomingUrl());
  if (!response.ok) throw new Error(`Launch Library request failed with HTTP ${response.status}.`);
  return parseLaunchLibraryResponse(await response.json(), new Date().toISOString());
}
