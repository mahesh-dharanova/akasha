import type { Body } from 'astronomy-engine';

export type ObjectKind = 'star' | 'planet' | 'moon' | 'sun';

export interface CatalogueObject {
  id: string;
  name: string;
  kind: ObjectKind;
  body?: Body;
  raJ2000?: number;
  decJ2000?: number;
  distanceLightYears?: number;
  magnitude: number | null;
  classification: string;
  description: string;
  guidance: string;
  color: string;
}

export interface ObserverSettings {
  latitude: number;
  longitude: number;
  elevation: number;
  timeZone: string;
}

export interface HorizontalPosition {
  altitude: number;
  azimuth: number;
}

export interface CalculatedObject extends CatalogueObject {
  rightAscension: number;
  declination: number;
  distanceAu: number | null;
  horizontal: HorizontalPosition;
  aboveHorizon: boolean;
  observingStatus: 'good-window' | 'twilight' | 'below-horizon';
  rise: Date | null;
  transit: Date | null;
  set: Date | null;
}

export interface SkySnapshot {
  instant: Date;
  observer: ObserverSettings;
  sunAltitude: number;
  twilight: 'night' | 'astronomical-twilight' | 'daylight';
  objects: CalculatedObject[];
}

export interface JournalEntry {
  id: string;
  objectId: string;
  note: string;
  observedAt: string;
  latitude: number;
  longitude: number;
}

export interface JournalState {
  favourites: string[];
  entries: JournalEntry[];
}
