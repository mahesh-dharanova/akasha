import './styles.css';
import { CATALOGUE, DEFAULT_OBJECT_ID, getObject } from './catalogue';
import { calculateSky, compassDirection, formatDeclination, formatRightAscension } from './astronomy';
import { loadJournal, parseJournalFile, saveJournal, serializeJournal } from './journal';
import type { CalculatedObject, JournalState, ObserverSettings, SkyCondition, SkySnapshot } from './types';

const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const TIME_ZONES = Array.from(new Set([detectedTimeZone, 'UTC', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney']));

const DEFAULT_OBSERVER: ObserverSettings = {
  latitude: 12.9716,
  longitude: 77.5946,
  elevation: 920,
  timeZone: detectedTimeZone,
};

const app = document.querySelector<HTMLDivElement>('#app') ?? (() => {
  throw new Error('AKASHA app root is missing.');
})();

const state: {
  instant: Date;
  observer: ObserverSettings;
  selectedId: string;
  filter: 'all' | 'star' | 'planet' | 'moon' | 'sun' | 'deep-sky';
  query: string;
  zoom: number;
  panX: number;
  panY: number;
  playing: boolean;
  timer: number | null;
  journal: JournalState;
  journalMessage: string;
  snapshot: SkySnapshot;
} = {
  instant: new Date(),
  observer: { ...DEFAULT_OBSERVER },
  selectedId: DEFAULT_OBJECT_ID,
  filter: 'all',
  query: '',
  zoom: 1,
  panX: 0,
  panY: 0,
  playing: false,
  timer: null,
  journal: loadJournal(),
  journalMessage: '',
  snapshot: calculateSky(new Date(), DEFAULT_OBSERVER),
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function formatDateTime(date: Date, timeZone = state.observer.timeZone): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
}

function formatInputDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function parseInputDate(value: string, timeZone: string): Date {
  const rough = new Date(`${value}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(rough).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  const displayedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return new Date(rough.getTime() - (displayedAsUtc - rough.getTime()));
}

function updateSnapshot(): void {
  state.snapshot = calculateSky(state.instant, state.observer);
}

function selectedObject(): CalculatedObject {
  return state.snapshot.objects.find((object) => object.id === state.selectedId) ?? state.snapshot.objects[0];
}

function displayTime(date: Date | null): string {
  return date ? formatDateTime(date, state.observer.timeZone) : 'Not found in next 24 h';
}

function formatDistance(object: CalculatedObject): string {
  if (!object.body) return object.distanceLightYears ? `${object.distanceLightYears.toLocaleString()} ly · catalogue value` : 'Unavailable';
  if (object.distanceAu === null) return 'Unavailable';
  if (object.distanceAu < 0.01) return `${Math.round(object.distanceAu * 149_597_870.7).toLocaleString()} km`;
  return `${object.distanceAu.toFixed(2)} AU · calculated`;
}

function statusLabel(object: CalculatedObject): string {
  return object.visibility.label;
}

function statusClass(object: CalculatedObject): string {
  return object.visibility.band === 'excellent' || object.visibility.band === 'good' ? 'status-good' : object.visibility.band === 'challenging' ? 'status-warn' : 'status-muted';
}

function conditionLabel(condition: SkyCondition): string {
  return { daylight: 'daylight', 'civil-twilight': 'civil twilight', 'nautical-twilight': 'nautical twilight', 'astronomical-twilight': 'astronomical twilight', night: 'dark sky' }[condition];
}

function formatClock(date: Date | null): string {
  return date ? new Intl.DateTimeFormat(undefined, { timeStyle: 'short', timeZone: state.observer.timeZone }).format(date) : '—';
}

function renderObservingTimeline(object: CalculatedObject): string {
  const windows = state.snapshot.twilightWindows;
  const events = [
    { label: 'rise', date: object.rise, className: 'timeline-object-event' },
    { label: 'transit', date: object.transit, className: 'timeline-object-event' },
    { label: 'set', date: object.set, className: 'timeline-object-event' },
    { label: 'civil dusk', date: windows.civilDusk, className: 'timeline-twilight-event' },
    { label: 'astronomical dusk', date: windows.astronomicalDusk, className: 'timeline-dark-event' },
    { label: 'astronomical dawn', date: windows.astronomicalDawn, className: 'timeline-dark-event' },
    { label: 'civil dawn', date: windows.civilDawn, className: 'timeline-twilight-event' },
  ].filter((event): event is { label: string; date: Date; className: string } => event.date !== null);
  const eventTimes = events.map((event) => event.date.getTime());
  const start = Math.min(state.instant.getTime() - 6 * 60 * 60_000, ...eventTimes.map((time) => time - 60 * 60_000));
  const end = Math.max(state.instant.getTime() + 6 * 60 * 60_000, ...eventTimes.map((time) => time + 60 * 60_000));
  const position = (date: Date): number => Math.max(0, Math.min(100, ((date.getTime() - start) / (end - start)) * 100));
  const markers = events.map((event) => `<button class="timeline-marker ${event.className}" data-event-time="${event.date.toISOString()}" style="left:${position(event.date).toFixed(2)}%" title="Show ${event.label} at ${formatDateTime(event.date)}"><span>${escapeHtml(event.label)}</span></button>`).join('');
  const currentPosition = position(state.instant);
  const dusk = windows.astronomicalDusk;
  const dawn = windows.astronomicalDawn;
  const darkRanges: Array<[Date, Date]> = dusk && dawn && dawn > dusk
    ? [[dusk, dawn]]
    : state.snapshot.skyCondition === 'night'
      ? [[new Date(start), dawn ?? new Date(end)], [dusk ?? new Date(end), new Date(end)]]
      : [];
  const darkBands = darkRanges.map(([from, to]) => `<span class="timeline-night-band" style="left:${position(from).toFixed(2)}%;width:${Math.max(0, position(to) - position(from)).toFixed(2)}%"></span>`).join('');
  return `<div class="observing-timeline"><div class="event-caption">Observing window · ${conditionLabel(state.snapshot.skyCondition)}</div><div class="timeline-axis"><span>${formatDateTime(new Date(start))}</span><span>${formatDateTime(new Date(end))}</span></div><div class="timeline-bar">${darkBands}<span class="timeline-current" style="left:${currentPosition.toFixed(2)}%"><i></i><small>now</small></span>${markers}</div><div class="timeline-note">Dark bands mark astronomical night. Click an event marker to move the sky map to that calculated time. Twilight markers are solar crossings; rise, transit, and set belong to ${escapeHtml(object.name)}.</div></div>`;
}

function trackingSamples(objectId: string): Array<{ instant: Date; object: CalculatedObject }> {
  return Array.from({ length: 7 }, (_, index) => {
    const instant = new Date(state.instant.getTime() + index * 60 * 60_000);
    const object = calculateSky(instant, state.observer).objects.find((item) => item.id === objectId);
    return object ? { instant, object } : null;
  }).filter((sample): sample is { instant: Date; object: CalculatedObject } => sample !== null);
}

function renderTracking(objectId: string): string {
  const samples = trackingSamples(objectId);
  return `<div class="tracking-block"><div class="event-caption">Next 6 hours · calculated track</div><div class="tracking-list">${samples.map(({ instant, object }) => `<button class="tracking-row" data-track-time="${instant.toISOString()}" title="Show this time on the sky map"><span>${formatClock(instant)}</span><strong>${object.geometricAltitude.toFixed(1)}°</strong><span>${compassDirection(object.horizontal.azimuth)} ${object.horizontal.azimuth.toFixed(0)}°</span><small>${object.aboveHorizon ? escapeHtml(object.visibility.label) : 'below horizon'}</small></button>`).join('')}</div><p class="science-note">The large change over one night is mainly Earth's rotation. The object's slower orbital motion changes its position relative to the background stars.</p></div>`;
}

function project(object: CalculatedObject): { x: number; y: number } {
  const radius = ((90 - Math.max(0, object.geometricAltitude)) / 90) * 43;
  const angle = object.horizontal.azimuth * Math.PI / 180;
  return { x: 50 + Math.sin(angle) * radius, y: 50 - Math.cos(angle) * radius };
}

function mapTransform(): string {
  return `translate(50 50) scale(${state.zoom}) translate(-50 -50) translate(${state.panX} ${state.panY})`;
}

function seededStars(): string {
  const stars = Array.from({ length: 105 }, (_, index) => {
    const x = (index * 47.37 + 13) % 94 + 3;
    const y = (index * 71.11 + 7) % 94 + 3;
    const radius = index % 11 === 0 ? 0.34 : index % 4 === 0 ? 0.22 : 0.12;
    const opacity = index % 7 === 0 ? 0.8 : 0.48;
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius}" fill="#d8e8ff" opacity="${opacity}" />`;
  }).join('');
  return stars;
}

function constellationLines(objects: CalculatedObject[]): string {
  const byId = new Map(objects.filter((object) => object.aboveHorizon).map((object) => [object.id, object]));
  const pairs = [['vega', 'altair'], ['altair', 'deneb'], ['deneb', 'vega'], ['betelgeuse', 'rigel'], ['aldebaran', 'betelgeuse'], ['sirius', 'rigel']];
  return pairs.map(([from, to]) => {
    const first = byId.get(from);
    const second = byId.get(to);
    if (!first || !second) return '';
    const a = project(first);
    const b = project(second);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="constellation-line" />`;
  }).join('');
}

function renderMap(): string {
  const visible = state.snapshot.objects.filter((object) => object.aboveHorizon);
  const selected = selectedObject();
  const selectedPoint = selected.aboveHorizon ? project(selected) : null;
  const objectDots = visible.map((object) => {
    const point = project(object);
    const selectedClass = object.id === state.selectedId ? ' object-dot-selected' : '';
    const radius = object.id === state.selectedId ? 1.3 : object.kind === 'star' ? Math.max(0.45, 1.3 - (object.magnitude ?? 2) * 0.12) : object.kind === 'deep-sky' ? 1.1 : 1;
    return `<g class="object-hit${selectedClass}" data-object-id="${object.id}" tabindex="0" role="button" aria-label="Select ${escapeHtml(object.name)}"><circle cx="${point.x}" cy="${point.y}" r="${radius + 1.1}" class="object-halo" /><circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${object.color}" class="object-dot" /><text x="${point.x + 1.7}" y="${point.y - 1.3}" class="object-label">${escapeHtml(object.name)}</text></g>`;
  }).join('');
  const focus = selectedPoint ? `<circle cx="${selectedPoint.x}" cy="${selectedPoint.y}" r="3.3" class="selection-ring" /><line x1="${selectedPoint.x - 4}" y1="${selectedPoint.y}" x2="${selectedPoint.x + 4}" y2="${selectedPoint.y}" class="selection-crosshair" /><line x1="${selectedPoint.x}" y1="${selectedPoint.y - 4}" x2="${selectedPoint.x}" y2="${selectedPoint.y + 4}" class="selection-crosshair" />` : '';
  return `<svg id="sky-map" viewBox="0 0 100 100" role="img" aria-label="Interactive altitude and azimuth sky map"><defs><radialGradient id="sky-glow"><stop offset="0" stop-color="#16284a" stop-opacity=".58" /><stop offset=".7" stop-color="#0b1326" stop-opacity=".18" /><stop offset="1" stop-color="#050811" stop-opacity="0" /></radialGradient></defs><g id="map-content" transform="${mapTransform()}"><circle cx="50" cy="50" r="47" fill="url(#sky-glow)" /><circle cx="50" cy="50" r="43" class="horizon-ring" /><circle cx="50" cy="50" r="28.7" class="altitude-ring" /><circle cx="50" cy="50" r="14.3" class="altitude-ring" /><line x1="50" y1="7" x2="50" y2="93" class="grid-line" /><line x1="7" y1="50" x2="93" y2="50" class="grid-line" />${seededStars()}${constellationLines(state.snapshot.objects)}<text x="50" y="4" class="direction north">N</text><text x="96" y="51.5" class="direction">E</text><text x="50" y="98" class="direction">S</text><text x="2" y="51.5" class="direction">W</text><text x="50" y="48.5" class="zenith-label">ZENITH</text>${objectDots}${focus}</g></svg>`;
}

function renderObjectPanel(): string {
  const object = selectedObject();
  const favourite = state.journal.favourites.includes(object.id);
  const solarSeparation = object.solarSeparation === null ? 'Not applicable' : `${object.solarSeparation.toFixed(1)}°`;
  const source = object.source ? `<p class="source-note">Catalogue: ${escapeHtml(object.source)}${object.catalogueId ? ` · ${escapeHtml(object.catalogueId)}` : ''}</p>` : '';
  return `<section class="panel object-panel"><div class="panel-kicker">OBJECT TRACKER</div><div class="object-title-row"><div><h2>${escapeHtml(object.name)}</h2><p>${escapeHtml(object.classification)}</p></div><button class="icon-button ${favourite ? 'is-favourite' : ''}" data-action="toggle-favourite" aria-label="${favourite ? 'Remove from' : 'Add to'} favourites">${favourite ? '★' : '☆'}</button></div><div class="status-pill ${statusClass(object)}">${statusLabel(object)}</div><div class="visibility-summary"><div class="visibility-score"><strong>${object.visibility.score}</strong><span>/ 100<br />visibility</span></div><div><strong>${object.visibility.reasons[0]}</strong><p>${object.visibility.reasons.slice(1, 3).join(' · ')}</p></div></div><div class="metric-grid"><div><span>Apparent altitude</span><strong>${object.apparentAltitude.toFixed(1)}°</strong></div><div><span>Geometric altitude</span><strong>${object.geometricAltitude.toFixed(1)}°</strong></div><div><span>Direction</span><strong>${compassDirection(object.horizontal.azimuth)} ${object.horizontal.azimuth.toFixed(1)}°</strong></div><div><span>Right ascension</span><strong>${formatRightAscension(object.rightAscension)}</strong></div><div><span>Declination</span><strong>${formatDeclination(object.declination)}</strong></div><div><span>Magnitude</span><strong>${object.magnitude?.toFixed(2) ?? 'Unavailable'}</strong></div><div><span>Distance</span><strong>${formatDistance(object)}</strong></div><div><span>Sun separation</span><strong>${solarSeparation}</strong></div></div><div class="event-caption">Next coherent observing window</div><div class="event-grid"><div><span>Rise</span><strong>${displayTime(object.rise)}</strong></div><div><span>Transit</span><strong>${displayTime(object.transit)}</strong></div><div><span>Set</span><strong>${displayTime(object.set)}</strong></div></div>${renderObservingTimeline(object)}${renderTracking(object.id)}<div class="copy-block"><h3>About ${escapeHtml(object.name)}</h3><p>${escapeHtml(object.description)}</p><h3>How to find it</h3><p>${escapeHtml(object.guidance)}</p>${source}<p class="science-note">The score combines geometric altitude and solar twilight with catalogue brightness and observing difficulty. Apparent altitude includes normal atmospheric refraction. It does not model clouds, transparency, light pollution, obstructions, optics, or eyesight.</p></div></section>`;
}

function recommendedObjects(): CalculatedObject[] {
  return state.snapshot.objects.filter((object) => object.kind !== 'sun' && object.aboveHorizon && object.visibility.score >= 25).sort((a, b) => b.visibility.score - a.visibility.score).slice(0, 5);
}

function renderPlanner(): string {
  const targets = recommendedObjects();
  const targetMarkup = targets.length ? targets.map((object) => `<button class="planner-item" data-select-object="${object.id}"><span class="planner-dot" style="background:${object.color}"></span><span><strong>${escapeHtml(object.name)}</strong><small>${object.visibility.score}/100 · ${escapeHtml(object.visibility.label)} · ${object.difficulty ?? 'naked-eye'}</small><small>${escapeHtml(object.visibility.reasons.slice(0, 2).join(' · '))}</small></span><span class="planner-arrow">→</span></button>`).join('') : '<p class="empty-state">No starter targets meet the current altitude and darkness threshold.</p>';
  return `${targetMarkup}<div class="planner-twilight">${renderTwilightPanel()}</div>`;
}

function renderTwilightPanel(): string {
  const windows = state.snapshot.twilightWindows;
  const rows = [
    ['Civil', windows.civilDusk, windows.civilDawn],
    ['Nautical', windows.nauticalDusk, windows.nauticalDawn],
    ['Astronomical', windows.astronomicalDusk, windows.astronomicalDawn],
  ] as const;
  return `<section class="panel twilight-panel"><div class="panel-kicker">TWILIGHT WINDOWS</div><div class="section-heading"><div><h2>When the sky gets dark</h2><p>Next calculated crossings for the Sun at this location.</p></div><span class="condition-chip condition-${state.snapshot.skyCondition}">${conditionLabel(state.snapshot.skyCondition)}</span></div><div class="twilight-list">${rows.map(([label, dusk, dawn]) => `<div class="twilight-row"><strong>${label}</strong><span><small>dusk</small>${formatClock(dusk)}</span><span><small>dawn</small>${formatClock(dawn)}</span></div>`).join('')}</div></section>`;
}

function renderJournal(): string {
  const object = selectedObject();
  const entry = state.journal.entries.find((item) => item.objectId === object.id);
  const entries = state.journal.entries.slice().reverse().slice(0, 3);
  return `<section class="panel journal-panel"><div class="journal-heading"><div><div class="panel-kicker">OBSERVATION JOURNAL</div><h2>Make this sky yours</h2></div><div class="journal-tools"><button class="button button-quiet" data-action="export-journal">Export</button><button class="button button-quiet" data-action="import-journal">Import</button><input id="journal-file" type="file" accept="application/json" hidden /></div></div><p class="panel-intro">Save a note for ${escapeHtml(object.name)}. It stays in this browser unless you export it.</p>${state.journalMessage ? `<p class="journal-message" role="status">${escapeHtml(state.journalMessage)}</p>` : ''}<textarea id="journal-note" placeholder="What did you notice?">${escapeHtml(entry?.note ?? '')}</textarea><div class="journal-actions"><label class="checkbox-label"><input type="checkbox" id="journal-observed" ${entry ? 'checked' : ''} /> Mark observed</label><button class="button button-primary" data-action="save-note">Save note</button></div>${entries.length ? `<div class="journal-list">${entries.map((item) => `<button class="journal-entry" data-select-object="${item.objectId}"><strong>${escapeHtml(getObject(item.objectId).name)}</strong><span>${escapeHtml(item.note || 'Observed without a note')}</span></button>`).join('')}</div>` : '<p class="empty-state">Your observing history will appear here.</p>'}</section>`;
}

function render(): void {
  const inputValue = formatInputDate(state.instant, state.observer.timeZone);
  const filterObjects = CATALOGUE.filter((item) => {
    const query = state.query.toLowerCase();
    return (state.filter === 'all' || item.kind === state.filter) && (item.name.toLowerCase().includes(query) || item.catalogueId?.toLowerCase().includes(query));
  });
  app.innerHTML = `<header class="topbar"><div class="brand-mark">✦</div><div><div class="eyebrow">PERSONAL ASTRONOMY OBSERVATORY</div><h1>AKASHA</h1></div><div class="topbar-status"><span class="live-dot"></span> local calculation · ${escapeHtml(state.observer.timeZone)}</div></header><main class="app-shell"><section class="control-panel panel"><div class="control-group location-controls"><div class="panel-kicker">OBSERVER</div><div class="control-row"><label>Latitude<input id="latitude" type="number" min="-90" max="90" step="0.0001" value="${state.observer.latitude}" /></label><label>Longitude<input id="longitude" type="number" min="-180" max="180" step="0.0001" value="${state.observer.longitude}" /></label><label>Elevation <span class="unit">m</span><input id="elevation" type="number" min="-500" max="9000" step="1" value="${state.observer.elevation}" /></label><label>Time zone<select id="timezone">${TIME_ZONES.map((zone) => `<option value="${zone}" ${zone === state.observer.timeZone ? 'selected' : ''}>${zone}</option>`).join('')}</select></label></div><div class="preset-row"><span>Presets</span><button data-preset="12.9716,77.5946,920">Bengaluru</button><button data-preset="51.5072,-0.1276,11">London</button><button data-preset="40.7128,-74.006,10">New York</button><button data-preset="-33.9249,18.4241,15">Cape Town</button></div></div><div class="control-group time-controls"><div class="panel-kicker">OBSERVATION TIME</div><div class="time-row"><input id="observation-time" type="datetime-local" value="${inputValue}" /><button class="button button-quiet" data-action="now">Now</button></div><div class="time-actions"><button class="button button-quiet" data-step="-60">− 1 h</button><button class="button button-primary play-button" data-action="toggle-play">${state.playing ? 'Ⅱ Pause' : '▶ Play'}</button><button class="button button-quiet" data-step="60">+ 1 h</button></div><div class="time-readout">${formatDateTime(state.instant)} · ${state.snapshot.twilight.replace('-', ' ')}</div></div></section><section class="workspace"><section class="panel map-panel"><div class="map-heading"><div><div class="panel-kicker">THE SKY ABOVE YOU</div><h2>${formatDateTime(state.instant)}</h2><p>Zenith at centre · horizon at edge · drag to pan · scroll to zoom</p></div><div class="map-status"><strong>${state.snapshot.objects.filter((item) => item.aboveHorizon).length}</strong><span>starter objects<br />above horizon</span></div></div><div class="sky-stage">${renderMap()}<div class="map-scale"><span>30°</span><span>60°</span><span>horizon</span></div></div><div class="map-footer"><span><i class="legend-line legend-horizon"></i> horizon</span><span><i class="legend-line legend-constellation"></i> constellation guide</span><span><i class="legend-dot"></i> calculated object</span><button data-action="reset-map">Reset view</button></div></section><aside class="side-column">${renderObjectPanel()}<section class="panel catalogue-panel"><div class="panel-kicker">OBJECT CATALOGUE</div><div class="catalogue-tools"><input id="catalogue-search" type="search" placeholder="Search objects" value="${escapeHtml(state.query)}" /><select id="catalogue-filter"><option value="all" ${state.filter === 'all' ? 'selected' : ''}>All types</option><option value="star" ${state.filter === 'star' ? 'selected' : ''}>Stars</option><option value="planet" ${state.filter === 'planet' ? 'selected' : ''}>Planets</option><option value="moon" ${state.filter === 'moon' ? 'selected' : ''}>Moon</option><option value="deep-sky" ${state.filter === 'deep-sky' ? 'selected' : ''}>Deep sky</option></select></div><div class="catalogue-list">${filterObjects.map((item) => `<button class="catalogue-item ${item.id === state.selectedId ? 'is-selected' : ''}" data-select-object="${item.id}"><span class="catalogue-symbol" style="color:${item.color}">${item.kind === 'star' ? '✦' : item.kind === 'moon' ? '◐' : item.kind === 'deep-sky' ? '◇' : '●'}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.classification)}</small></span><span class="catalogue-alt">${state.snapshot.objects.find((calculated) => calculated.id === item.id)?.horizontal.altitude.toFixed(0)}°</span></button>`).join('')}</div></section></aside></section><section class="lower-grid"><section class="panel planner-panel"><div class="panel-kicker">TONIGHT'S OBSERVATION PLANNER</div><div class="section-heading"><div><h2>Start with what is ready</h2><p>Ranked from the local calculation for ${escapeHtml(state.observer.timeZone)}.</p></div><span class="planner-badge">${state.snapshot.twilight === 'night' ? 'dark sky' : state.snapshot.twilight}</span></div><div class="planner-list">${renderPlanner()}</div></section>${renderJournal()}</section><footer class="app-footer"><span>AKASHA v0.3.4 · positions calculated locally with Astronomy Engine</span><span>Geometric horizon and twilight are not a promise of visibility.</span></footer></main>`;
  bindEvents();
  updateMapInteractions();
  updateLegendLabel();
}

function rerender(): void {
  updateSnapshot();
  render();
}

function bindEvents(): void {
  app.querySelectorAll<HTMLElement>('[data-select-object]').forEach((element) => element.addEventListener('click', () => {
    state.selectedId = element.dataset.selectObject ?? state.selectedId;
    render();
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => button.addEventListener('click', () => {
    const [latitude, longitude, elevation] = (button.dataset.preset ?? '').split(',').map(Number);
    state.observer.latitude = latitude;
    state.observer.longitude = longitude;
    state.observer.elevation = elevation;
    rerender();
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => button.addEventListener('click', () => {
    state.instant = new Date(state.instant.getTime() + Number(button.dataset.step) * 60_000);
    rerender();
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-track-time]').forEach((button) => button.addEventListener('click', () => {
    const instant = new Date(button.dataset.trackTime ?? '');
    if (!Number.isNaN(instant.getTime())) {
      state.instant = instant;
      rerender();
    }
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-event-time]').forEach((button) => button.addEventListener('click', () => {
    const instant = new Date(button.dataset.eventTime ?? '');
    if (!Number.isNaN(instant.getTime())) {
      state.instant = instant;
      rerender();
    }
  }));
  const timeInput = app.querySelector<HTMLInputElement>('#observation-time');
  timeInput?.addEventListener('change', () => {
    state.instant = parseInputDate(timeInput.value, state.observer.timeZone);
    rerender();
  });
  const timezone = app.querySelector<HTMLSelectElement>('#timezone');
  timezone?.addEventListener('change', () => {
    state.observer.timeZone = timezone.value;
    render();
  });
  ['latitude', 'longitude', 'elevation'].forEach((id) => app.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('change', (event) => {
    const value = Number((event.target as HTMLInputElement).value);
    if (id === 'latitude') state.observer.latitude = Math.max(-90, Math.min(90, value));
    if (id === 'longitude') state.observer.longitude = Math.max(-180, Math.min(180, value));
    if (id === 'elevation') state.observer.elevation = Math.max(-500, Math.min(9000, value));
    rerender();
  }));
  app.querySelector<HTMLInputElement>('#catalogue-search')?.addEventListener('input', (event) => {
    state.query = (event.target as HTMLInputElement).value;
    render();
  });
  app.querySelector<HTMLSelectElement>('#catalogue-filter')?.addEventListener('change', (event) => {
    state.filter = (event.target as HTMLSelectElement).value as typeof state.filter;
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="now"]')?.addEventListener('click', () => {
    state.instant = new Date();
    rerender();
  });
  app.querySelector<HTMLButtonElement>('[data-action="toggle-play"]')?.addEventListener('click', () => {
    state.playing = !state.playing;
    if (state.playing) state.timer = window.setInterval(() => {
      state.instant = new Date(state.instant.getTime() + 15 * 60_000);
      rerender();
    }, 900);
    else if (state.timer !== null) window.clearInterval(state.timer);
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="reset-map"]')?.addEventListener('click', () => {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="toggle-favourite"]')?.addEventListener('click', () => {
    const index = state.journal.favourites.indexOf(state.selectedId);
    if (index >= 0) state.journal.favourites.splice(index, 1);
    else state.journal.favourites.push(state.selectedId);
    saveJournal(state.journal);
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="save-note"]')?.addEventListener('click', () => {
    const note = app.querySelector<HTMLTextAreaElement>('#journal-note')?.value.trim() ?? '';
    const observed = app.querySelector<HTMLInputElement>('#journal-observed')?.checked ?? false;
    const existing = state.journal.entries.find((entry) => entry.objectId === state.selectedId);
    if (observed || note) {
      const entry = existing ?? { id: crypto.randomUUID(), objectId: state.selectedId, note: '', observedAt: state.instant.toISOString(), latitude: state.observer.latitude, longitude: state.observer.longitude };
      entry.note = note;
      entry.observedAt = state.instant.toISOString();
      entry.latitude = state.observer.latitude;
      entry.longitude = state.observer.longitude;
      if (!existing) state.journal.entries.push(entry);
    } else if (existing) {
      state.journal.entries = state.journal.entries.filter((entry) => entry.id !== existing.id);
    }
    saveJournal(state.journal);
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="export-journal"]')?.addEventListener('click', () => {
    const blob = new Blob([serializeJournal(state.journal)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'akasha-journal.json';
    link.click();
    URL.revokeObjectURL(url);
    state.journalMessage = 'Journal exported as akasha-journal.json.';
    render();
  });
  const journalFile = app.querySelector<HTMLInputElement>('#journal-file');
  app.querySelector<HTMLButtonElement>('[data-action="import-journal"]')?.addEventListener('click', () => journalFile?.click());
  journalFile?.addEventListener('change', async () => {
    const file = journalFile.files?.[0];
    if (!file) return;
    try {
      state.journal = parseJournalFile(await file.text());
      saveJournal(state.journal);
      state.journalMessage = 'Journal imported and saved in this browser.';
    } catch (error) {
      state.journalMessage = error instanceof Error ? error.message : 'The journal could not be imported.';
    }
    render();
  });
}

function updateMapInteractions(): void {
  const map = app.querySelector<SVGSVGElement>('#sky-map');
  const group = app.querySelector<SVGGElement>('#map-content');
  if (!map || !group) return;
  map.querySelectorAll<SVGGElement>('[data-object-id]').forEach((hit) => hit.addEventListener('click', () => {
    state.selectedId = hit.dataset.objectId ?? state.selectedId;
    render();
  }));
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;
  map.addEventListener('wheel', (event) => {
    event.preventDefault();
    state.zoom = Math.max(0.78, Math.min(2.2, state.zoom + (event.deltaY < 0 ? 0.08 : -0.08)));
    group.setAttribute('transform', mapTransform());
  }, { passive: false });
  map.addEventListener('pointerdown', (event) => {
    if ((event.target as Element).closest('[data-object-id]')) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    initialX = state.panX;
    initialY = state.panY;
    map.setPointerCapture(event.pointerId);
  });
  map.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    state.panX = initialX + (event.clientX - startX) / map.clientWidth * 100;
    state.panY = initialY + (event.clientY - startY) / map.clientHeight * 100;
    group.setAttribute('transform', mapTransform());
  });
  map.addEventListener('pointerup', () => { dragging = false; });
  map.addEventListener('pointercancel', () => { dragging = false; });
}

function updateLegendLabel(): void {
  const legend = app.querySelector<HTMLElement>('.legend-constellation')?.parentElement;
  const swatch = legend?.querySelector('i');
  if (!legend || !swatch) return;
  legend.replaceChildren(swatch, document.createTextNode(' orientation guide'));
}

render();
