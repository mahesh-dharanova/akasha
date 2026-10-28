import type { ObserverSettings } from './types';
import { DEFAULT_LOCATION_NAME, normalizeLocationName } from './observer';

const SETTINGS_KEY = 'akasha-observer-v1';

const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));

function numberOrDefault(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
}

function validTimeZone(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value }).format();
    return value;
  } catch {
    return fallback;
  }
}

export function loadObserverSettings(defaults: ObserverSettings): ObserverSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<ObserverSettings>;
    return {
      locationName: normalizeLocationName(stored.locationName, defaults.locationName || DEFAULT_LOCATION_NAME),
      latitude: numberOrDefault(stored.latitude, defaults.latitude, -90, 90),
      longitude: numberOrDefault(stored.longitude, defaults.longitude, -180, 180),
      elevation: numberOrDefault(stored.elevation, defaults.elevation, -500, 9000),
      timeZone: validTimeZone(stored.timeZone, defaults.timeZone),
      lightPollution: numberOrDefault(stored.lightPollution, defaults.lightPollution, 1, 9),
      cloudCover: numberOrDefault(stored.cloudCover, defaults.cloudCover, 0, 100),
      transparency: numberOrDefault(stored.transparency, defaults.transparency, 0, 100),
      horizonObstruction: numberOrDefault(stored.horizonObstruction, defaults.horizonObstruction, 0, 100),
    };
  } catch {
    return { ...defaults };
  }
}

export function saveObserverSettings(settings: ObserverSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
