import { degreesToRadians, ecfToLookAngles, eciToEcf, eciToGeodetic, gstime, json2satrec, propagate, radiansToDegrees, SatRecError } from 'satellite.js';
import type { AerialSource } from './aerial';

export const CELESTRAK_SOURCE: AerialSource = {
  id: 'celestrak-gp',
  label: 'CelesTrak GP/OMM data',
  licence: 'Public data subject to CelesTrak usage policy; source attribution required',
  attribution: 'Orbital elements from CelesTrak · https://celestrak.org',
};

export interface SatelliteObserver {
  latitude: number;
  longitude: number;
  elevationMeters: number;
}

export interface SatelliteObservation {
  id: string;
  name: string;
  noradCatalogId: string;
  internationalDesignator: string;
  orbitEpoch: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  azimuthDegrees: number;
  elevationDegrees: number;
  rangeKm: number;
  aboveHorizon: boolean;
  propagationModel: 'SGP4/SDP4';
}

export interface SatelliteSnapshot {
  schemaVersion: 1;
  fixture: boolean;
  retrievedAt: string;
  observedAt: string;
  source: AerialSource;
  observer: SatelliteObserver;
  objects: SatelliteObservation[];
}

const CelestrakStationsUrl = '/api/celestrak-stations';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function numberValue(value: unknown): number | null {
  if (finite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function validateObserver(observer: SatelliteObserver): void {
  if (!finite(observer.latitude) || observer.latitude < -90 || observer.latitude > 90) throw new Error('Satellite observer latitude is invalid.');
  if (!finite(observer.longitude) || observer.longitude < -180 || observer.longitude > 180) throw new Error('Satellite observer longitude is invalid.');
  if (!finite(observer.elevationMeters) || observer.elevationMeters < -500 || observer.elevationMeters > 9000) throw new Error('Satellite observer elevation is invalid.');
}

function validTimestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} timestamp is invalid.`);
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.OBJECT_NAME !== 'string' || !record.OBJECT_NAME.trim() || typeof record.OBJECT_ID !== 'string' || !record.OBJECT_ID.trim()) return null;
  if (numberValue(record.NORAD_CAT_ID) === null || typeof record.EPOCH !== 'string' || !Number.isFinite(Date.parse(record.EPOCH))) return null;
  const requiredNumbers = ['MEAN_MOTION', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY', 'BSTAR', 'MEAN_MOTION_DOT', 'MEAN_MOTION_DDOT'];
  if (requiredNumbers.some((key) => numberValue(record[key]) === null)) return null;
  return record;
}

function propagateRecord(record: Record<string, unknown>, observer: SatelliteObserver, at: Date): SatelliteObservation | null {
  try {
    const satrec = json2satrec(record as never);
    const result = propagate(satrec, at);
    if (!result || satrec.error !== SatRecError.None) return null;
    const gmst = gstime(at);
    const ecf = eciToEcf(result.position, gmst);
    const observerGeodetic = { longitude: degreesToRadians(observer.longitude), latitude: degreesToRadians(observer.latitude), height: observer.elevationMeters / 1000 };
    const lookAngles = ecfToLookAngles(observerGeodetic, ecf);
    const geodetic = eciToGeodetic(result.position, gmst);
    const azimuthDegrees = (radiansToDegrees(lookAngles.azimuth) + 360) % 360;
    const elevationDegrees = radiansToDegrees(lookAngles.elevation);
    const noradCatalogId = String(record.NORAD_CAT_ID);
    return {
      id: `celestrak:${noradCatalogId}`,
      name: record.OBJECT_NAME as string,
      noradCatalogId,
      internationalDesignator: record.OBJECT_ID as string,
      orbitEpoch: record.EPOCH as string,
      observedAt: at.toISOString(),
      latitude: radiansToDegrees(geodetic.latitude),
      longitude: ((radiansToDegrees(geodetic.longitude) + 540) % 360) - 180,
      altitudeMeters: geodetic.height * 1000,
      azimuthDegrees,
      elevationDegrees,
      rangeKm: lookAngles.rangeSat,
      aboveHorizon: elevationDegrees > 0,
      propagationModel: 'SGP4/SDP4',
    };
  } catch {
    return null;
  }
}

export function buildCelestrakStationsUrl(): string {
  return CelestrakStationsUrl;
}

export function parseCelestrakResponse(payload: unknown, observer: SatelliteObserver, at: Date, retrievedAt: string): SatelliteSnapshot {
  validateObserver(observer);
  if (!Number.isFinite(at.getTime())) throw new Error('Satellite observation time is invalid.');
  validTimestamp(retrievedAt, 'Satellite retrieval');
  if (!Array.isArray(payload)) throw new Error('CelesTrak response must be an OMM array.');
  const objects = payload.flatMap((value) => {
    const record = parseRecord(value);
    return record ? propagateRecord(record, observer, at) ?? [] : [];
  });
  return { schemaVersion: 1, fixture: false, retrievedAt, observedAt: at.toISOString(), source: { ...CELESTRAK_SOURCE }, observer: { ...observer }, objects };
}

export async function fetchCelestrakStations(observer: SatelliteObserver, at: Date, fetcher: typeof fetch = fetch): Promise<SatelliteSnapshot> {
  const response = await fetcher(buildCelestrakStationsUrl());
  if (!response.ok) throw new Error(`CelesTrak request failed with HTTP ${response.status}.`);
  return parseCelestrakResponse(await response.json(), observer, at, new Date().toISOString());
}
