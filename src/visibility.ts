import type { CatalogueObject, ObserverSettings, SkyCondition, VisibilityAssessment } from './types';

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

function lightPollutionScore(bortle: number): number {
  return [100, 92, 84, 74, 60, 45, 30, 18, 8][clamp(Math.round(bortle), 1, 9) - 1];
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

export function assessVisibility(object: CatalogueObject, altitude: number, condition: SkyCondition, solarSeparation: number | null, observerConditions: Pick<ObserverSettings, 'lightPollution' | 'cloudCover' | 'transparency' | 'horizonObstruction'>): VisibilityAssessment {
  if (object.kind === 'sun') return { score: 0, band: 'not-recommended', label: 'never observe directly', reasons: ['Solar target: use certified solar filters for any optical observation.'] };
  if (altitude < 0) return { score: 0, band: 'not-recommended', label: 'below horizon', reasons: ['The object is below the geometric horizon from this location.'] };

  if (solarSeparation !== null && solarSeparation < 15) {
    return { score: 0, band: 'not-recommended', label: 'too close to the Sun', reasons: [`Only ${solarSeparation.toFixed(1)}° from the Sun`, 'Do not use optics while the Sun is above the horizon.'] };
  }

  const altitudePoints = altitudeScore(altitude);
  const darknessPoints = darknessScore(condition);
  const brightnessPoints = brightnessScore(object);
  const difficultyPoints = difficultyScore(object.difficulty);
  const conditionsPoints = (lightPollutionScore(observerConditions.lightPollution) * 0.35)
    + ((100 - observerConditions.cloudCover) * 0.35)
    + (observerConditions.transparency * 0.3);
  const obstructionPenalty = altitude < 30 ? observerConditions.horizonObstruction * ((30 - altitude) / 30) * 0.35 : 0;
  const baseScore = Math.round(altitudePoints * 0.3 + darknessPoints * 0.3 + brightnessPoints * 0.2 + difficultyPoints * 0.1 + conditionsPoints * 0.1 - obstructionPenalty);
  const daylightCap = condition === 'daylight' ? object.kind === 'moon' ? 42 : object.kind === 'planet' ? 22 : 8 : condition === 'civil-twilight' && object.kind === 'deep-sky' ? 22 : 100;
  const score = Math.min(baseScore, daylightCap);
  const band = scoreBand(score);
  const altitudeReason = altitude >= 45 ? `High altitude at ${altitude.toFixed(0)}°` : `Low altitude at ${altitude.toFixed(0)}°`;
  const brightnessReason = object.magnitude === null ? 'Brightness unavailable' : `Magnitude ${object.magnitude.toFixed(1)}`;
  const reasons = [altitudeReason, darknessLabel(condition), brightnessReason, `${object.difficulty ?? 'naked-eye'} target`, `Bortle ${Math.round(observerConditions.lightPollution)} light pollution`, `Cloud cover ${Math.round(observerConditions.cloudCover)}%`, `Transparency ${Math.round(observerConditions.transparency)}%`];
  if (object.kind === 'deep-sky' && object.surfaceBrightness !== undefined) reasons.push(`Surface brightness ${object.surfaceBrightness.toFixed(1)} mag/arcsec²`);
  if (observerConditions.horizonObstruction > 0 && altitude < 30) reasons.push(`${Math.round(observerConditions.horizonObstruction)}% horizon obstruction affects this low target`);
  if (condition === 'daylight') reasons.unshift(object.kind === 'moon' ? 'Daylight lunar target' : 'Daylight: not recommended for ordinary observing');
  if (condition === 'civil-twilight') reasons.unshift('Twilight: wait for darker conditions where possible');
  return { score, band, label: scoreLabel(band), reasons };
}
