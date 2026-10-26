import * as Astronomy from 'astronomy-engine';
import { CATALOGUE } from './catalogue';
import type { CalculatedObject, CatalogueObject, ObserverSettings, SkySnapshot } from './types';

const STAR_SLOT = Astronomy.Body.Star1;

function getBody(object: CatalogueObject): Astronomy.Body {
  if (object.body) return object.body;
  if (object.raJ2000 === undefined || object.decJ2000 === undefined) {
    throw new Error(`Object ${object.id} has no astronomical coordinates.`);
  }
  Astronomy.DefineStar(STAR_SLOT, object.raJ2000, object.decJ2000, object.distanceLightYears ?? 1000);
  return STAR_SLOT;
}

function calculateTwilight(sunAltitude: number): SkySnapshot['twilight'] {
  if (sunAltitude >= -6) return sunAltitude >= 0 ? 'daylight' : 'astronomical-twilight';
  return 'night';
}

function safeEvent(event: Astronomy.AstroTime | null): Date | null {
  return event?.date ?? null;
}

function calculateObject(object: CatalogueObject, instant: Date, observer: Astronomy.Observer, twilight: SkySnapshot['twilight']): CalculatedObject {
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
    observingStatus: horizontal.altitude < 0 ? 'below-horizon' : twilight === 'night' ? 'good-window' : 'twilight',
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
  const twilight = calculateTwilight(sunHorizontal.altitude);
  const objects = CATALOGUE.map((object) => calculateObject(object, instant, observer, twilight));
  return { instant, observer: settings, sunAltitude: sunHorizontal.altitude, twilight, objects };
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
