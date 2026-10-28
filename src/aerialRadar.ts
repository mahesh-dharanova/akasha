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

function shortestLongitudeDelta(longitude: number, centerLongitude: number): number {
  const delta = longitude - centerLongitude;
  return delta > 180 ? delta - 360 : delta < -180 ? delta + 360 : delta;
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
