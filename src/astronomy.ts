import * as Astronomy from 'astronomy-engine';
import { CATALOGUE } from './catalogue';
import { assessVisibility } from './visibility';
import type { CalculatedObject, CatalogueObject, ObserverSettings, SkyCondition, SkySnapshot, TwilightWindows } from './types';

const STAR_SLOT = Astronomy.Body.Star1;

function getBody(object: CatalogueObject): Astronomy.Body {
  if (object.body) return object.body;
  if (object.raJ2000 === undefined || object.decJ2000 === undefined) {
    throw new Error(`Object ${object.id} has no astronomical coordinates.`);
  }
  Astronomy.DefineStar(STAR_SLOT, object.raJ2000, object.decJ2000, object.distanceLightYears ?? 1000);
  return STAR_SLOT;
}

function calculateSkyCondition(sunAltitude: number): SkyCondition {
  if (sunAltitude >= 0) return 'daylight';
  if (sunAltitude >= -6) return 'civil-twilight';
  if (sunAltitude >= -12) return 'nautical-twilight';
  if (sunAltitude >= -18) return 'astronomical-twilight';
  return 'night';
}

function safeEvent(event: Astronomy.AstroTime | null): Date | null {
  return event?.date ?? null;
}

function safeRiseSet(body: Astronomy.Body, observer: Astronomy.Observer, direction: 1 | -1, start: Date, limitDays: number): Date | null {
  try {
    return safeEvent(Astronomy.SearchRiseSet(body, observer, direction, start, limitDays));
  } catch {
    return null;
  }
}

function safeTransit(body: Astronomy.Body, observer: Astronomy.Observer, start: Date, direction: 1 | -1): Date | null {
  try {
    return safeEvent(Astronomy.SearchHourAngle(body, observer, 0, start, direction).time);
  } catch {
    return null;
  }
}

function chooseTransit(previous: Date | null, next: Date | null, rise: Date | null, set: Date | null): Date | null {
  const candidates = [previous, next].filter((date): date is Date => date !== null && (rise === null || date >= rise) && (set === null || date <= set));
  return candidates[0] ?? next ?? previous;
}

function calculateObservingEvents(body: Astronomy.Body, observer: Astronomy.Observer, instant: Date, aboveHorizon: boolean): { rise: Date | null; transit: Date | null; set: Date | null } {
  const nextRise = safeRiseSet(body, observer, 1, instant, 2);
  const previousRise = safeRiseSet(body, observer, 1, instant, -2);
  const nextSet = safeRiseSet(body, observer, -1, instant, 2);
  let rise = aboveHorizon ? previousRise ?? nextRise : nextRise;
  let set = nextSet;

  if (!aboveHorizon && rise) {
    set = safeRiseSet(body, observer, -1, new Date(rise.getTime() + 60_000), 2) ?? set;
  }
  if (rise && set && set < rise) {
    rise = nextRise ?? rise;
    set = safeRiseSet(body, observer, -1, new Date(rise.getTime() + 60_000), 2);
  }

  const previousTransit = safeTransit(body, observer, instant, -1);
  const nextTransit = safeTransit(body, observer, instant, 1);
  return { rise, transit: chooseTransit(previousTransit, nextTransit, rise, set), set };
}

function searchTwilight(observer: Astronomy.Observer, instant: Date, direction: 1 | -1, altitude: number): Date | null {
  try {
    return safeEvent(Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, direction, instant, 2, altitude));
  } catch {
    return null;
  }
}

function calculateTwilightWindows(observer: Astronomy.Observer, instant: Date): TwilightWindows {
  return {
    civilDawn: searchTwilight(observer, instant, 1, -6),
    nauticalDawn: searchTwilight(observer, instant, 1, -12),
    astronomicalDawn: searchTwilight(observer, instant, 1, -18),
    astronomicalDusk: searchTwilight(observer, instant, -1, -18),
    nauticalDusk: searchTwilight(observer, instant, -1, -12),
    civilDusk: searchTwilight(observer, instant, -1, -6),
  };
}

function calculateObject(object: CatalogueObject, instant: Date, observer: Astronomy.Observer, condition: SkyCondition, settings: ObserverSettings): CalculatedObject {
  const body = getBody(object);
  const equatorial = Astronomy.Equator(body, instant, observer, true, true);
  const geometricHorizontal = Astronomy.Horizon(instant, observer, equatorial.ra, equatorial.dec);
  const apparentHorizontal = Astronomy.Horizon(instant, observer, equatorial.ra, equatorial.dec, 'normal');
  const aboveHorizon = geometricHorizontal.altitude >= 0;
  const events = calculateObservingEvents(body, observer, instant, aboveHorizon);
  const solarSeparation = object.kind === 'planet' || object.kind === 'moon' ? Astronomy.AngleFromSun(body, instant) : null;

  return {
    ...object,
    rightAscension: equatorial.ra,
    declination: equatorial.dec,
    distanceAu: Number.isFinite(equatorial.dist) ? equatorial.dist : null,
    solarSeparation,
    horizontal: { altitude: apparentHorizontal.altitude, azimuth: apparentHorizontal.azimuth },
    geometricAltitude: geometricHorizontal.altitude,
    apparentAltitude: apparentHorizontal.altitude,
    aboveHorizon,
    observingStatus: aboveHorizon ? condition === 'night' ? 'good-window' : 'twilight' : 'below-horizon',
    visibility: assessVisibility(object, geometricHorizontal.altitude, condition, solarSeparation, settings),
    ...events,
  };
}

export function calculateSky(instant: Date, settings: ObserverSettings): SkySnapshot {
  const observer = new Astronomy.Observer(settings.latitude, settings.longitude, settings.elevation);
  const sun = CATALOGUE.find((object) => object.id === 'sun');
  if (!sun) throw new Error('Catalogue is missing the Sun.');
  const sunBody = getBody(sun);
  const sunEquatorial = Astronomy.Equator(sunBody, instant, observer, true, true);
  const sunHorizontal = Astronomy.Horizon(instant, observer, sunEquatorial.ra, sunEquatorial.dec);
  const skyCondition = calculateSkyCondition(sunHorizontal.altitude);
  const twilightWindows = calculateTwilightWindows(observer, instant);
  const objects = CATALOGUE.map((object) => calculateObject(object, instant, observer, skyCondition, settings));
  return { instant, observer: settings, sunAltitude: sunHorizontal.altitude, skyCondition, twilight: skyCondition, twilightWindows, objects };
}

export function compassDirection(azimuth: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(((azimuth % 360) + 360) % 360 / 22.5) % directions.length];
}

export function formatRightAscension(hours: number): string {
  const totalMinutes = ((hours % 24) + 24) % 24 * 60;
  const hh = Math.floor(totalMinutes / 60);
  const mm = Math.floor(totalMinutes % 60);
  return `${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m`;
}

export function formatDeclination(degrees: number): string {
  return `${degrees >= 0 ? '+' : '−'}${Math.abs(degrees).toFixed(1)}°`;
}
