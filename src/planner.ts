import type { CalculatedObject } from './types';

type PlannerObject = Pick<CalculatedObject, 'visibility' | 'observingWindow'>;

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

export function observingWindowLabel(object: Pick<CalculatedObject, 'observingWindow'>, instant: Date): string {
  const minutes = object.observingWindow.durationMinutes;
  if (minutes <= 0 || !object.observingWindow.start) return 'No dark-sky overlap';
  const duration = durationLabel(minutes);
  const startsLater = object.observingWindow.start.getTime() - instant.getTime() > 30 * 60_000;
  if (startsLater) return `Later tonight · ${duration}`;
  if (minutes >= 300) return `Best now · ${duration}`;
  if (minutes >= 120) return `Good for ${duration}`;
  return `Short window · ${duration}`;
}

export function plannerRank(object: PlannerObject): number {
  return object.visibility.score + Math.min(object.observingWindow.durationMinutes / 360, 1) * 15;
}
