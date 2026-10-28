export type DashboardView = 'sky' | 'planner' | 'journal' | 'aerial' | 'weather' | 'events' | 'space';

export interface DashboardModule {
  id: DashboardView;
  label: string;
  description: string;
  implemented: boolean;
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  { id: 'sky', label: 'Sky map', description: 'Calculated sky, object profile, and catalogue.', implemented: true },
  { id: 'planner', label: 'Planner', description: 'Tonight targets and twilight windows.', implemented: true },
  { id: 'journal', label: 'Journal', description: 'Local notes, favourites, and observations.', implemented: true },
  { id: 'aerial', label: 'Aerial', description: 'Aircraft, helicopters, rockets, and satellites.', implemented: false },
  { id: 'weather', label: 'Weather', description: 'Cloud and precipitation overlays.', implemented: false },
  { id: 'events', label: 'Events', description: 'Eclipses, asteroids, and meteor activity.', implemented: false },
  { id: 'space', label: 'Space POV', description: 'Earth from a defined external observer.', implemented: false },
];
