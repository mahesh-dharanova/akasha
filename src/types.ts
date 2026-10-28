import type { Body } from 'astronomy-engine';

export type ObjectKind = 'star' | 'planet' | 'moon' | 'sun' | 'deep-sky';
export type ObservingDifficulty = 'naked-eye' | 'binocular' | 'telescope';
export type SkyCondition = 'daylight' | 'civil-twilight' | 'nautical-twilight' | 'astronomical-twilight' | 'night';

export interface TwilightWindows {
  civilDawn: Date | null;
  nauticalDawn: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
  nauticalDusk: Date | null;
  civilDusk: Date | null;
}

export interface VisibilityFactor {
  label: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface VisibilityBreakdown {
  factors: VisibilityFactor[];
  obstructionPenalty: number;
  uncappedScore: number;
  cap: number | null;
}

export interface VisibilityAssessment {
  score: number;
  band: 'excellent' | 'good' | 'challenging' | 'not-recommended';
  label: string;
  reasons: string[];
  breakdown: VisibilityBreakdown;
}

export interface CatalogueObject {
  id: string;
  name: string;
  kind: ObjectKind;
  body?: Body;
  raJ2000?: number;
  decJ2000?: number;
  distanceLightYears?: number;
  angularSizeArcmin?: number;
  surfaceBrightness?: number;
  difficulty?: ObservingDifficulty;
  catalogueId?: string;
  source?: string;
  magnitude: number | null;
  classification: string;
  description: string;
  guidance: string;
  color: string;
}

export interface ObserverSettings {
  locationName: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timeZone: string;
  lightPollution: number;
  cloudCover: number;
  transparency: number;
  horizonObstruction: number;
}

export interface HorizontalPosition {
  altitude: number;
  azimuth: number;
}

export interface ObservingWindow {
  start: Date | null;
  end: Date | null;
  durationMinutes: number;
}

export interface CalculatedObject extends CatalogueObject {
  rightAscension: number;
  declination: number;
  distanceAu: number | null;
  solarSeparation: number | null;
  horizontal: HorizontalPosition;
  geometricAltitude: number;
  apparentAltitude: number;
  aboveHorizon: boolean;
  observingStatus: 'good-window' | 'twilight' | 'below-horizon';
  visibility: VisibilityAssessment;
  observingWindow: ObservingWindow;
  rise: Date | null;
  transit: Date | null;
  set: Date | null;
}

export interface SkySnapshot {
  instant: Date;
  observer: ObserverSettings;
  sunAltitude: number;
  skyCondition: SkyCondition;
  /** Backward-compatible display alias used by the v0.1 shell. */
  twilight: SkyCondition;
  twilightWindows: TwilightWindows;
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
