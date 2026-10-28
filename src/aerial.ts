export type AerialObjectKind = 'aircraft' | 'helicopter' | 'rocket' | 'satellite';
export type AerialCoverageKind = 'ground-radius' | 'altitude-band' | 'three-dimensional-volume';

export interface AerialSource {
  id: string;
  label: string;
  licence: string;
  attribution: string;
}

export interface AerialCoverage {
  kind: AerialCoverageKind;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number | null;
  minimumAltitudeMeters: number | null;
  maximumAltitudeMeters: number | null;
}

export interface AerialObject {
  id: string;
  name: string;
  kind: AerialObjectKind;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  headingDegrees: number | null;
  speedMetersPerSecond: number | null;
  observedAt: string;
  confidence: number | null;
}

export interface AerialSnapshot {
  schemaVersion: 1;
  fixture: boolean;
  retrievedAt: string;
  source: AerialSource;
  coverage: AerialCoverage;
  objects: AerialObject[];
}

const OBJECT_KINDS: AerialObjectKind[] = ['aircraft', 'helicopter', 'rocket', 'satellite'];
const COVERAGE_KINDS: AerialCoverageKind[] = ['ground-radius', 'altitude-band', 'three-dimensional-volume'];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function validateSource(value: unknown): AerialSource {
  const source = requireObject(value, 'Aerial source');
  if (![source.id, source.label, source.licence, source.attribution].every((item) => typeof item === 'string' && item.trim())) {
    throw new Error('Aerial source must include id, label, licence, and attribution.');
  }
  return { id: source.id as string, label: source.label as string, licence: source.licence as string, attribution: source.attribution as string };
}

function validateCoverage(value: unknown): AerialCoverage {
  const coverage = requireObject(value, 'Aerial coverage');
  if (!COVERAGE_KINDS.includes(coverage.kind as AerialCoverageKind)) throw new Error('Aerial coverage has an unknown radius or volume kind.');
  if (!isFiniteNumber(coverage.centerLatitude) || coverage.centerLatitude < -90 || coverage.centerLatitude > 90) throw new Error('Aerial coverage latitude is invalid.');
  if (!isFiniteNumber(coverage.centerLongitude) || coverage.centerLongitude < -180 || coverage.centerLongitude > 180) throw new Error('Aerial coverage longitude is invalid.');
  if (!isNullableFiniteNumber(coverage.radiusKm) || !isNullableFiniteNumber(coverage.minimumAltitudeMeters) || !isNullableFiniteNumber(coverage.maximumAltitudeMeters)) throw new Error('Aerial coverage limits are invalid.');
  if (coverage.radiusKm !== null && coverage.radiusKm < 0) throw new Error('Aerial coverage radius cannot be negative.');
  if (coverage.minimumAltitudeMeters !== null && coverage.maximumAltitudeMeters !== null && coverage.maximumAltitudeMeters < coverage.minimumAltitudeMeters) throw new Error('Aerial altitude bounds are reversed.');
  return {
    kind: coverage.kind as AerialCoverageKind,
    centerLatitude: coverage.centerLatitude as number,
    centerLongitude: coverage.centerLongitude as number,
    radiusKm: coverage.radiusKm as number | null,
    minimumAltitudeMeters: coverage.minimumAltitudeMeters as number | null,
    maximumAltitudeMeters: coverage.maximumAltitudeMeters as number | null,
  };
}

function validateAerialObject(value: unknown): AerialObject {
  const object = requireObject(value, 'Aerial object');
  if (![object.id, object.name].every((item) => typeof item === 'string' && item.trim())) throw new Error('Aerial object must include id and name.');
  if (!OBJECT_KINDS.includes(object.kind as AerialObjectKind)) throw new Error('Aerial object has an unknown kind.');
  if (!isFiniteNumber(object.latitude) || object.latitude < -90 || object.latitude > 90) throw new Error('Aerial object latitude is invalid.');
  if (!isFiniteNumber(object.longitude) || object.longitude < -180 || object.longitude > 180) throw new Error('Aerial object longitude is invalid.');
  if (!isFiniteNumber(object.altitudeMeters) || object.altitudeMeters < -500) throw new Error('Aerial object altitude is invalid.');
  if (!isNullableFiniteNumber(object.headingDegrees) || (object.headingDegrees !== null && (object.headingDegrees < 0 || object.headingDegrees >= 360))) throw new Error('Aerial object heading is invalid.');
  if (!isNullableFiniteNumber(object.speedMetersPerSecond) || (object.speedMetersPerSecond !== null && object.speedMetersPerSecond < 0)) throw new Error('Aerial object speed is invalid.');
  if (!isTimestamp(object.observedAt)) throw new Error('Aerial object timestamp is invalid.');
  if (!isNullableFiniteNumber(object.confidence) || (object.confidence !== null && (object.confidence < 0 || object.confidence > 1))) throw new Error('Aerial object confidence is invalid.');
  return {
    id: object.id as string,
    name: object.name as string,
    kind: object.kind as AerialObjectKind,
    latitude: object.latitude as number,
    longitude: object.longitude as number,
    altitudeMeters: object.altitudeMeters as number,
    headingDegrees: object.headingDegrees as number | null,
    speedMetersPerSecond: object.speedMetersPerSecond as number | null,
    observedAt: object.observedAt as string,
    confidence: object.confidence as number | null,
  };
}

export function parseAerialSnapshot(value: unknown): AerialSnapshot {
  const snapshot = requireObject(value, 'Aerial snapshot');
  if (snapshot.schemaVersion !== 1) throw new Error('Unsupported aerial snapshot version.');
  if (typeof snapshot.fixture !== 'boolean') throw new Error('Aerial snapshot fixture status is required.');
  if (!isTimestamp(snapshot.retrievedAt)) throw new Error('Aerial snapshot retrieval timestamp is invalid.');
  if (!Array.isArray(snapshot.objects)) throw new Error('Aerial snapshot objects must be an array.');
  return {
    schemaVersion: 1,
    fixture: snapshot.fixture as boolean,
    retrievedAt: snapshot.retrievedAt as string,
    source: validateSource(snapshot.source),
    coverage: validateCoverage(snapshot.coverage),
    objects: snapshot.objects.map(validateAerialObject),
  };
}
