import type { CatalogueObject, SkyCondition, VisibilityAssessment } from './types';

const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));

function darknessScore(condition: SkyCondition): number {
  return {
    daylight: 8,
    'civil-twilight': 28,
    'nautical-twilight': 58,
    'astronomical-twilight': 82,
    night: 100,
  }[condition];
}

function darknessLabel(condition: SkyCondition): string {
  return {
    daylight: 'daylight',
    'civil-twilight': 'civil twilight',
    'nautical-twilight': 'nautical twilight',
    'astronomical-twilight': 'astronomical twilight',
    night: 'dark sky',
  }[condition];
}

function difficultyScore(difficulty: CatalogueObject['difficulty']): number {
  return { 'naked-eye': 100, binocular: 70, telescope: 42 }[difficulty ?? 'naked-eye'];
}

function altitudeScore(altitude: number): number {
  return clamp((altitude - 5) * 2.3, 0, 100);
}

function brightnessScore(object: CatalogueObject): number {
  if (object.magnitude === null) return 35;
  const magnitudeScore = clamp(100 - (object.magnitude + 1) * 12, 15, 100);
  if (object.surfaceBrightness === undefined) return magnitudeScore;
  const surfaceScore = clamp(100 - (object.surfaceBrightness - 19) * 14, 12, 100);
  return (magnitudeScore + surfaceScore) / 2;
}

function scoreBand(score: number): VisibilityAssessment['band'] {
  if (score >= 78) return 'excellent';
  if (score >= 55) return 'good';
  if (score >= 30) return 'challenging';
  return 'not-recommended';
}

function scoreLabel(band: VisibilityAssessment['band']): string {
  return { excellent: 'excellent conditions', good: 'good conditions', challenging: 'challenging target', 'not-recommended': 'not recommended now' }[band];
}

export function assessVisibility(object: CatalogueObject, altitude: number, condition: SkyCondition): VisibilityAssessment {
  if (object.kind === 'sun') return { score: 0, band: 'not-recommended', label: 'never observe directly', reasons: ['Solar target: use certified solar filters for any optical observation.'] };
  if (altitude < 0) return { score: 0, band: 'not-recommended', label: 'below horizon', reasons: ['The object is below the geometric horizon from this location.'] };

  const altitudePoints = altitudeScore(altitude);
  const darknessPoints = darknessScore(condition);
  const brightnessPoints = brightnessScore(object);
  const difficultyPoints = difficultyScore(object.difficulty);
  const score = Math.round(altitudePoints * 0.35 + darknessPoints * 0.35 + brightnessPoints * 0.2 + difficultyPoints * 0.1);
  const band = scoreBand(score);
  const altitudeReason = altitude >= 45 ? `High altitude at ${altitude.toFixed(0)}°` : `Low altitude at ${altitude.toFixed(0)}°`;
  const brightnessReason = object.magnitude === null ? 'Brightness unavailable' : `Magnitude ${object.magnitude.toFixed(1)}`;
  const reasons = [altitudeReason, darknessLabel(condition), brightnessReason, `${object.difficulty ?? 'naked-eye'} target`];
  if (object.kind === 'deep-sky' && object.surfaceBrightness !== undefined) reasons.push(`Surface brightness ${object.surfaceBrightness.toFixed(1)} mag/arcsec²`);
  return { score, band, label: scoreLabel(band), reasons };
}
