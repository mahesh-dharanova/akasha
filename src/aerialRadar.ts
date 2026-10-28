import type { AerialCoverage, AerialObject } from './aerial';

export interface RadarPoint {
  x: number;
  y: number;
  distanceKm: number;
  bearingDegrees: number;
  withinRadius: boolean;
}

const KILOMETERS_PER_DEGREE = 111.32;
const RADAR_RADIUS = 44;
const MAX_ESTIMATE_SECONDS = 30;

function shortestLongitudeDelta(longitude: number, centerLongitude: number): number {
  const delta = longitude - centerLongitude;
  return delta > 180 ? delta - 360 : delta < -180 ? delta + 360 : delta;
}

export function estimateAerialObjectPosition(object: AerialObject, at: Date): AerialObject {
  if (object.speedMetersPerSecond === null || object.headingDegrees === null) return object;
  const observedMilliseconds = Date.parse(object.observedAt);
  if (!Number.isFinite(observedMilliseconds) || !Number.isFinite(at.getTime())) return object;
  const elapsedSeconds = Math.max(0, Math.min(MAX_ESTIMATE_SECONDS, (at.getTime() - observedMilliseconds) / 1000));
  const distanceMeters = object.speedMetersPerSecond * elapsedSeconds;
  const headingRadians = object.headingDegrees * Math.PI / 180;
  const northMeters = Math.cos(headingRadians) * distanceMeters;
  const eastMeters = Math.sin(headingRadians) * distanceMeters;
  const latitude = Math.max(-90, Math.min(90, object.latitude + northMeters / 111_320));
  const longitudeScale = Math.max(0.01, Math.cos(object.latitude * Math.PI / 180));
  const longitude = object.longitude + eastMeters / (111_320 * longitudeScale);
  return { ...object, latitude, longitude: ((longitude + 540) % 360) - 180 };
}

export function projectAerialObject(object: AerialObject, coverage: AerialCoverage): RadarPoint {
  const latitudeRadians = coverage.centerLatitude * Math.PI / 180;
  const northKm = (object.latitude - coverage.centerLatitude) * KILOMETERS_PER_DEGREE;
  const eastKm = shortestLongitudeDelta(object.longitude, coverage.centerLongitude) * KILOMETERS_PER_DEGREE * Math.cos(latitudeRadians);
  const distanceKm = Math.hypot(eastKm, northKm);
  const radiusKm = coverage.radiusKm && coverage.radiusKm > 0 ? coverage.radiusKm : 1;
  const scale = Math.min(RADAR_RADIUS, distanceKm / radiusKm * RADAR_RADIUS) / Math.max(distanceKm, 1);
  const bearingDegrees = (Math.atan2(eastKm, northKm) * 180 / Math.PI + 360) % 360;
  return {
    x: 50 + eastKm * scale,
    y: 50 - northKm * scale,
    distanceKm,
    bearingDegrees,
    withinRadius: distanceKm <= radiusKm,
  };
}
