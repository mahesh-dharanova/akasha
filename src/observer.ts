import type { ObserverSettings } from './types';

export interface ObserverPreset {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timeZone: string;
}

export const DEFAULT_LOCATION_NAME = 'Custom observer';

export const OBSERVER_PRESETS: ObserverPreset[] = [
  { id: 'bengaluru', name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, elevation: 920, timeZone: 'Asia/Kolkata' },
  { id: 'london', name: 'London', latitude: 51.5072, longitude: -0.1276, elevation: 11, timeZone: 'Europe/London' },
  { id: 'new-york', name: 'New York', latitude: 40.7128, longitude: -74.006, elevation: 10, timeZone: 'America/New_York' },
  { id: 'cape-town', name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, elevation: 15, timeZone: 'Africa/Johannesburg' },
];

export function normalizeLocationName(value: unknown, fallback = DEFAULT_LOCATION_NAME): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().replace(/\s+/g, ' ').slice(0, 80);
  return normalized || fallback;
}

export function applyObserverPreset(settings: ObserverSettings, preset: ObserverPreset): ObserverSettings {
  return {
    ...settings,
    locationName: preset.name,
    latitude: preset.latitude,
    longitude: preset.longitude,
    elevation: preset.elevation,
    timeZone: preset.timeZone,
  };
}
