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

function calculateObject(object: CatalogueObject, instant: Date, observer: Astronomy.Observer, condition: SkyCondition): CalculatedObject {
  const body = getBody(object);
  const equatorial = Astronomy.Equator(body, instant, observer, true, true);
  const horizontal = Astronomy.Horizon(instant, observer, equatorial.ra, equatorial.dec, 'normal');
  let rise: Date | null = null;
  let transit: Date | null = null;
  let set: Date | null = null;

  try {
    rise = safeEvent(Astronomy.SearchRiseSet(body, observer, 1, instant, 1));
    set = safeEvent(Astronomy.SearchRiseSet(body, observer, -1, instant, 1));
    transit = safeEvent(Astronomy.SearchHourAngle(body, observer, 0, instant).time);
  } catch {
    // Some bodies may have no event in the search window at high latitudes.
  }

  return {
    ...object,
    rightAscension: equatorial.ra,
    declination: equatorial.dec,
    distanceAu: Number.isFinite(equatorial.dist) ? equatorial.dist : null,
    horizontal: { altitude: horizontal.altitude, azimuth: horizontal.azimuth },
    aboveHorizon: horizontal.altitude >= 0,
    observingStatus: horizontal.altitude < 0 ? 'below-horizon' : condition === 'night' ? 'good-window' : 'twilight',
    visibility: assessVisibility(object, horizontal.altitude, condition),
    rise,
    transit,
    set,
  };
}

export function calculateSky(instant: Date, settings: ObserverSettings): SkySnapshot {
  const observer = new Astronomy.Observer(settings.latitude, settings.longitude, settings.elevation);
  const sun = CATALOGUE.find((object) => object.id === 'sun');
  if (!sun) throw new Error('Catalogue is missing the Sun.');
  const sunBody = getBody(sun);
  const sunEquatorial = Astronomy.Equator(sunBody, instant, observer, true, true);
  const sunHorizontal = Astronomy.Horizon(instant, observer, sunEquatorial.ra, sunEquatorial.dec, 'normal');
  const skyCondition = calculateSkyCondition(sunHorizontal.altitude);
  const twilightWindows = calculateTwilightWindows(observer, instant);
  const objects = CATALOGUE.map((object) => calculateObject(object, instant, observer, skyCondition));
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
