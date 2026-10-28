import type { AerialSnapshot } from './aerial';

export const ADSB_FI_SOURCE = {
  id: 'adsb-fi',
  label: 'adsb.fi open data API',
  licence: 'Personal, non-commercial use under adsb.fi terms',
  attribution: 'Aircraft data from adsb.fi · https://adsb.fi',
} as const;

export interface AircraftQuery {
  latitude: number;
  longitude: number;
  radiusNauticalMiles: number;
}

const KNOTS_TO_METERS_PER_SECOND = 0.514444;
const NAUTICAL_MILES_TO_KILOMETERS = 1.852;

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateQuery(query: AircraftQuery): void {
  if (!finite(query.latitude) || query.latitude < -90 || query.latitude > 90) throw new Error('Aircraft query latitude is invalid.');
  if (!finite(query.longitude) || query.longitude < -180 || query.longitude > 180) throw new Error('Aircraft query longitude is invalid.');
  if (!finite(query.radiusNauticalMiles) || query.radiusNauticalMiles <= 0 || query.radiusNauticalMiles > 250) throw new Error('Aircraft query radius must be between 0 and 250 nautical miles.');
}

export function buildAdsbFiAircraftUrl(query: AircraftQuery): string {
  validateQuery(query);
  return `/api/adsb-fi/lat/${query.latitude.toFixed(4)}/lon/${query.longitude.toFixed(4)}/dist/${query.radiusNauticalMiles.toFixed(1)}`;
}

function observedAt(retrievedAt: string, secondsSincePosition: unknown): string {
  if (!finite(secondsSincePosition) || secondsSincePosition < 0) return retrievedAt;
  return new Date(Date.parse(retrievedAt) - secondsSincePosition * 1000).toISOString();
}

export function parseAdsbFiResponse(payload: unknown, retrievedAt: string, query: AircraftQuery): AerialSnapshot {
  validateQuery(query);
  if (!finite(Date.parse(retrievedAt))) throw new Error('Aircraft retrieval timestamp is invalid.');
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { ac?: unknown }).ac)) throw new Error('adsb.fi response has no aircraft array.');

  const objects = (payload as { ac: Array<Record<string, unknown>> }).ac.flatMap((aircraft) => {
    if (typeof aircraft.hex !== 'string' || !finite(aircraft.lat) || !finite(aircraft.lon) || !finite(aircraft.alt_baro)) return [];
    const speedMetersPerSecond = finite(aircraft.gs) ? aircraft.gs * KNOTS_TO_METERS_PER_SECOND : null;
    const flight = typeof aircraft.flight === 'string' ? aircraft.flight.trim() : '';
    return [{
      id: `adsb-fi:${aircraft.hex}`,
      name: flight || aircraft.hex.toUpperCase(),
      kind: 'aircraft' as const,
      latitude: aircraft.lat,
      longitude: aircraft.lon,
      altitudeMeters: aircraft.alt_baro * 0.3048,
      headingDegrees: finite(aircraft.track) ? aircraft.track : null,
      speedMetersPerSecond,
      observedAt: observedAt(retrievedAt, aircraft.seen_pos),
      confidence: null,
    }];
  });

  return {
    schemaVersion: 1,
    fixture: false,
    retrievedAt,
    source: { ...ADSB_FI_SOURCE },
    coverage: {
      kind: 'ground-radius',
      centerLatitude: query.latitude,
      centerLongitude: query.longitude,
      radiusKm: query.radiusNauticalMiles * NAUTICAL_MILES_TO_KILOMETERS,
      minimumAltitudeMeters: null,
      maximumAltitudeMeters: null,
    },
    objects,
  };
}

export async function fetchAdsbFiAircraft(query: AircraftQuery, fetcher: typeof fetch = fetch): Promise<AerialSnapshot> {
  const response = await fetcher(buildAdsbFiAircraftUrl(query));
  if (!response.ok) throw new Error(`adsb.fi request failed with HTTP ${response.status}.`);
  return parseAdsbFiResponse(await response.json(), new Date().toISOString(), query);
}
