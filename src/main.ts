import './styles.css';
import { forgetSavedAudio, forgetSavedYouTube, getAudioState, loadLocalAudio, loadYouTubeAudio, onAudioChange, pauseAudio, playAudio, restoreSavedAudio, saveCurrentAudio, saveCurrentYouTube, setAudioVolume, stopAudio, useAmbient } from './audio';
import { mountYouTubePlayer } from './youtube';
import { CATALOGUE, DEFAULT_OBJECT_ID, getObject } from './catalogue';
import { calculateSky, compassDirection, formatDeclination, formatRightAscension } from './astronomy';
import { loadJournal, parseJournalFile, saveJournal, serializeJournal } from './journal';
import { loadObserverSettings, saveObserverSettings } from './settings';
import { observingWindowLabel, plannerRank } from './planner';
import { LEARNING_LESSONS, OBJECT_RELATIONSHIPS } from './relationships';
import { applyObserverPreset, normalizeLocationName, OBSERVER_PRESETS } from './observer';
import { DASHBOARD_MODULES, type DashboardModule, type DashboardView } from './dashboard';
import { fetchAdsbFiAircraft } from './aerialProviders';
import type { AerialSnapshot } from './aerial';
import { projectAerialObject } from './aerialRadar';
import type { CalculatedObject, JournalState, ObserverSettings, SkyCondition, SkySnapshot } from './types';

const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const TIME_ZONES = Array.from(new Set([detectedTimeZone, 'UTC', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', ...OBSERVER_PRESETS.map((preset) => preset.timeZone)]));
const BORTLE_LABELS = ['pristine', 'dark rural', 'rural', 'suburban-rural', 'suburban', 'bright suburban', 'urban', 'city', 'inner city'];
const AERIAL_REFRESH_INTERVAL_MS = 15_000;

const DEFAULT_OBSERVER: ObserverSettings = {
  locationName: 'Bengaluru',
  latitude: 12.9716,
  longitude: 77.5946,
  elevation: 920,
  timeZone: detectedTimeZone,
  lightPollution: 6,
  cloudCover: 0,
  transparency: 70,
  horizonObstruction: 0,
};
const initialObserver = loadObserverSettings(DEFAULT_OBSERVER);

const app = document.querySelector<HTMLDivElement>('#app') ?? (() => {
  throw new Error('AKASHA app root is missing.');
})();
const audioHost = document.createElement('div');
audioHost.id = 'audio-host';
document.body.appendChild(audioHost);

const state: {
  instant: Date;
  observer: ObserverSettings;
  activeView: DashboardView;
  aerialRadiusNauticalMiles: number;
  aerialTracking: boolean;
  aerialTimer: number | null;
  aerialStatus: 'idle' | 'loading' | 'ready' | 'error';
  aerialMessage: string;
  aerialSnapshot: AerialSnapshot | null;
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
  audioMessage: string;
  audioMinimized: boolean;
  snapshot: SkySnapshot;
} = {
  instant: new Date(),
  observer: { ...initialObserver },
  activeView: 'sky',
  aerialRadiusNauticalMiles: 25,
  aerialTracking: false,
  aerialTimer: null,
  aerialStatus: 'idle',
  aerialMessage: '',
  aerialSnapshot: null,
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
  audioMessage: '',
  audioMinimized: false,
  snapshot: calculateSky(new Date(), initialObserver),
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

function conditionsSummary(): string {
  return `Bortle ${state.observer.lightPollution} · ${BORTLE_LABELS[state.observer.lightPollution - 1]} · clouds ${state.observer.cloudCover}% · transparency ${state.observer.transparency}% · horizon clear ${100 - state.observer.horizonObstruction}%`;
}

function renderAudioPlayer(): string {
  const audio = getAudioState();
  const playLabel = audio.status === 'playing' ? 'Playing' : audio.status === 'paused' ? 'Resume' : 'Play';
  const saveLabel = audio.savedTrackAvailable ? 'Forget' : 'Save';
  const youtubeSaveLabel = audio.savedYouTubeAvailable ? 'Forget link' : 'Save link';
  const youtubePlayer = audio.mode === 'youtube' ? '<div class="youtube-player" id="youtube-player" aria-label="YouTube video player"></div><small class="youtube-note">YouTube playback uses the official player and an internet connection.</small>' : '';
  return `<section class="audio-dock ${audio.mode === 'youtube' ? 'audio-dock-youtube' : ''} ${state.audioMinimized ? 'is-minimized' : ''}" aria-label="AKASHA ambient audio"><div class="audio-info"><span class="audio-kicker">AMBIENT AUDIO</span><strong>${escapeHtml(audio.label)}</strong>${state.audioMessage ? `<small>${escapeHtml(state.audioMessage)}</small>` : ''}</div><div class="audio-actions"><button class="audio-button audio-play" data-action="audio-play" aria-label="${playLabel}">${audio.status === 'playing' ? 'Ⅱ' : '▶'}</button><button class="audio-button" data-action="audio-pause" aria-label="Pause audio">Ⅱ</button><button class="audio-button" data-action="audio-stop" aria-label="Stop audio">■</button><label class="audio-volume" title="Volume"><span>♫</span><input id="audio-volume" type="range" min="0" max="1" step="0.05" value="${audio.volume}" /></label><button class="audio-load" data-action="audio-load">Load track</button><button class="audio-save" data-action="audio-save" title="${audio.savedTrackAvailable ? 'Remove the saved local track' : 'Save this track in this browser'}">${saveLabel}</button><button class="audio-ambient" data-action="audio-ambient">Ambient</button><input id="audio-file" type="file" accept="audio/*" hidden /></div><button class="audio-button audio-minimize" data-action="audio-minimize" aria-expanded="${!state.audioMinimized}" aria-label="${state.audioMinimized ? 'Expand audio dock' : 'Minimize audio dock'}">${state.audioMinimized ? '↗' : '—'}</button><div class="youtube-input"><input id="youtube-url" type="url" placeholder="Paste YouTube link" value="${escapeHtml(audio.youtubeUrl ?? '')}" /><button class="audio-load" data-action="youtube-load">Use YouTube</button><button class="audio-save" data-action="youtube-save">${youtubeSaveLabel}</button></div>${youtubePlayer}</section>`;
}

function renderAudioDock(): void {
  audioHost.innerHTML = renderAudioPlayer();
  bindAudioEvents();
  if (getAudioState().mode !== 'youtube') return;
  const youtubePlayer = audioHost.querySelector<HTMLElement>('#youtube-player');
  if (!youtubePlayer) return;
  void mountYouTubePlayer(youtubePlayer).catch((error: unknown) => {
    state.audioMessage = error instanceof Error ? error.message : 'The YouTube player could not be loaded.';
    const audioInfo = audioHost.querySelector<HTMLElement>('.audio-info');
    let message = audioInfo?.querySelector<HTMLElement>('small');
    if (!message && audioInfo) {
      message = document.createElement('small');
      audioInfo.appendChild(message);
    }
    if (message) message.textContent = state.audioMessage;
  });
}

function renderVisibilityBreakdown(object: CalculatedObject): string {
  const { breakdown } = object.visibility;
  if (!breakdown.factors.length) return '';
  const factors = breakdown.factors.map((factor) => `<div class="visibility-factor"><div><span>${escapeHtml(factor.label)}</span><small>${factor.value.toFixed(0)}/100 · ${factor.weight}% weight</small></div><strong>+${factor.contribution.toFixed(1)}</strong><i><b style="width:${factor.value.toFixed(0)}%"></b></i></div>`).join('');
  const cap = breakdown.cap === null ? '' : ` · capped at ${breakdown.cap}`;
  const penalty = breakdown.obstructionPenalty > 0 ? `<span>−${breakdown.obstructionPenalty.toFixed(1)} low-horizon penalty</span>` : '';
  return `<details class="visibility-breakdown"><summary>Why this score?</summary><div class="visibility-factors">${factors}</div><p class="visibility-formula">${breakdown.uncappedScore} calculated before limits${cap} ${penalty}</p></details>`;
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

function renderRelatedObjects(object: CalculatedObject): string {
  const relationships = OBJECT_RELATIONSHIPS[object.id] ?? [];
  if (!relationships.length) return '';
  const lesson = LEARNING_LESSONS[relationships[0].lessonId];
  const lessonMarkup = lesson ? `<div class="learning-lesson"><div class="panel-kicker">LEARN THIS CONNECTION</div><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.summary)}</p><ol>${lesson.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></div>` : '';
  return `<section class="related-objects">${lessonMarkup}<div class="panel-kicker">EXPLORE CONNECTIONS</div><p class="related-intro">Application-authored observing links, not automatic physical-association claims.</p><div class="related-list">${relationships.map((relationship) => { const target = getObject(relationship.targetId); return `<button class="related-item" data-select-object="${target.id}"><span><strong>${escapeHtml(target.name)}</strong><small>${escapeHtml(relationship.label)}</small><em>${escapeHtml(relationship.explanation)}</em></span><span class="related-arrow">→</span></button>`; }).join('')}</div></section>`;
}

function renderObjectPanel(): string {
  const object = selectedObject();
  const favourite = state.journal.favourites.includes(object.id);
  const solarSeparation = object.solarSeparation === null ? 'Not applicable' : `${object.solarSeparation.toFixed(1)}°`;
  const source = `${renderRelatedObjects(object)}${object.source ? `<p class="source-note">Catalogue: ${escapeHtml(object.source)}${object.catalogueId ? ` · ${escapeHtml(object.catalogueId)}` : ''}</p>` : ''}`;
  return `<section class="panel object-panel"><div class="panel-kicker">OBJECT TRACKER</div><div class="object-title-row"><div><h2>${escapeHtml(object.name)}</h2><p>${escapeHtml(object.classification)}</p></div><button class="icon-button ${favourite ? 'is-favourite' : ''}" data-action="toggle-favourite" aria-label="${favourite ? 'Remove from' : 'Add to'} favourites">${favourite ? '★' : '☆'}</button></div><div class="status-pill ${statusClass(object)}">${statusLabel(object)}</div><div class="visibility-summary"><div class="visibility-score"><strong>${object.visibility.score}</strong><span>/ 100<br />visibility</span></div><div><strong>${object.visibility.reasons[0]}</strong><p>${object.visibility.reasons.slice(1, 3).join(' · ')}</p></div></div><p class="conditions-summary">Manual conditions: ${conditionsSummary()}</p>${renderVisibilityBreakdown(object)}<div class="metric-grid"><div><span>Apparent altitude</span><strong>${object.apparentAltitude.toFixed(1)}°</strong></div><div><span>Geometric altitude</span><strong>${object.geometricAltitude.toFixed(1)}°</strong></div><div><span>Direction</span><strong>${compassDirection(object.horizontal.azimuth)} ${object.horizontal.azimuth.toFixed(1)}°</strong></div><div><span>Right ascension</span><strong>${formatRightAscension(object.rightAscension)}</strong></div><div><span>Declination</span><strong>${formatDeclination(object.declination)}</strong></div><div><span>Magnitude</span><strong>${object.magnitude?.toFixed(2) ?? 'Unavailable'}</strong></div><div><span>Distance</span><strong>${formatDistance(object)}</strong></div><div><span>Sun separation</span><strong>${solarSeparation}</strong></div></div><div class="event-caption">Next coherent observing window</div><div class="event-grid"><div><span>Rise</span><strong>${displayTime(object.rise)}</strong></div><div><span>Transit</span><strong>${displayTime(object.transit)}</strong></div><div><span>Set</span><strong>${displayTime(object.set)}</strong></div></div><p class="window-summary">Dark-sky overlap: ${observingWindowLabel(object, state.instant)}</p>${renderObservingTimeline(object)}${renderTracking(object.id)}<div class="copy-block"><h3>About ${escapeHtml(object.name)}</h3><p>${escapeHtml(object.description)}</p><h3>How to find it</h3><p>${escapeHtml(object.guidance)}</p>${source}<p class="science-note">The score combines geometric altitude, solar twilight, light pollution, cloud cover, transparency, horizon obstruction, catalogue brightness, and observing difficulty. It does not model local weather automatically, optics, or eyesight.</p></div></section>`;
}

function recommendedObjects(): CalculatedObject[] {
  return state.snapshot.objects.filter((object) => object.kind !== 'sun' && object.aboveHorizon && object.visibility.score >= 25).sort((a, b) => plannerRank(b) - plannerRank(a)).slice(0, 5);
}

function renderPlanner(): string {
  const targets = recommendedObjects();
  const targetMarkup = targets.length ? targets.map((object) => `<button class="planner-item" data-select-object="${object.id}"><span class="planner-dot" style="background:${object.color}"></span><span><strong>${escapeHtml(object.name)}</strong><small class="planner-primary">${escapeHtml(observingWindowLabel(object, state.instant))}</small><small>${object.visibility.score}/100 · ${escapeHtml(object.visibility.label)} · ${object.difficulty ?? 'naked-eye'}</small><small>${escapeHtml(object.visibility.reasons.slice(0, 2).join(' · '))}</small></span><span class="planner-arrow">→</span></button>`).join('') : '<p class="empty-state">No starter targets meet the current altitude and darkness threshold.</p>';
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

function stopAerialTracking(): void {
  if (state.aerialTimer !== null) window.clearInterval(state.aerialTimer);
  state.aerialTimer = null;
  state.aerialTracking = false;
}

async function refreshAerial(): Promise<void> {
  if (state.aerialStatus === 'loading') return;
  state.aerialStatus = 'loading';
  state.aerialMessage = '';
  render();
  try {
    state.aerialSnapshot = await fetchAdsbFiAircraft({
      latitude: state.observer.latitude,
      longitude: state.observer.longitude,
      radiusNauticalMiles: state.aerialRadiusNauticalMiles,
    });
    state.aerialStatus = 'ready';
  } catch (error) {
    state.aerialStatus = 'error';
    state.aerialMessage = error instanceof Error ? error.message : 'The aircraft provider could not be reached.';
  }
  render();
}

function startAerialTracking(): void {
  stopAerialTracking();
  state.aerialTracking = true;
  state.aerialTimer = window.setInterval(() => { void refreshAerial(); }, AERIAL_REFRESH_INTERVAL_MS);
  void refreshAerial();
}

function aerialFreshness(snapshot: AerialSnapshot): string {
  const ageSeconds = Math.max(0, Math.round((Date.now() - Date.parse(snapshot.retrievedAt)) / 1000));
  return ageSeconds < 10 ? 'just now' : ageSeconds < 60 ? `${ageSeconds}s ago` : `${Math.round(ageSeconds / 60)}m ago`;
}

function renderAerialModule(): string {
  const snapshot = state.aerialSnapshot;
  const status = state.aerialStatus === 'loading' ? 'Updating…' : state.aerialStatus === 'error' ? state.aerialMessage : state.aerialTracking ? `Tracking · ${snapshot ? aerialFreshness(snapshot) : 'starting'}` : snapshot ? `${snapshot.objects.length} aircraft returned` : 'No request made';
  const objects = snapshot?.objects ?? [];
  const rows = objects.map((object) => `<div class="aerial-row"><div><strong>${escapeHtml(object.name)}</strong><small>${escapeHtml(object.id.replace('adsb-fi:', ''))}</small></div><span>${object.altitudeMeters.toFixed(0)} m</span><span>${object.speedMetersPerSecond === null ? 'speed unavailable' : `${(object.speedMetersPerSecond * 3.6).toFixed(0)} km/h`}</span><span>${object.headingDegrees === null ? 'heading unavailable' : `${object.headingDegrees.toFixed(0)}°`}</span></div>`).join('');
  return `<section class="panel aerial-panel"><div class="panel-kicker">AIRCRAFT TRACKING</div><div class="section-heading"><div><h2>Aircraft near ${escapeHtml(state.observer.locationName)}</h2><p>Optional personal-use query through the adsb.fi public endpoint. This is not an astronomical position calculation.</p></div><span class="condition-chip">${escapeHtml(status)}</span></div><div class="aerial-controls"><label>Ground radius <span class="unit">nautical miles</span><input id="aerial-radius" type="number" min="1" max="250" step="1" value="${state.aerialRadiusNauticalMiles}" /></label><button class="button button-primary" data-action="load-aerial" ${state.aerialStatus === 'loading' ? 'disabled' : ''}>${state.aerialStatus === 'loading' ? 'Updating…' : 'Refresh now'}</button><button class="button button-quiet" data-action="toggle-aerial-tracking" ${state.aerialStatus === 'loading' && !state.aerialTracking ? 'disabled' : ''}>${state.aerialTracking ? 'Pause tracking' : 'Start tracking'}</button></div>${state.aerialMessage && state.aerialStatus === 'error' ? `<p class="journal-message" role="alert">${escapeHtml(state.aerialMessage)}</p>` : ''}${snapshot ? `<div class="aerial-meta"><span>Retrieved ${formatDateTime(new Date(snapshot.retrievedAt))} · ${aerialFreshness(snapshot)}</span><span>Coverage ${snapshot.coverage.radiusKm?.toFixed(1) ?? '—'} km ground radius</span><span>Source: ${escapeHtml(snapshot.source.label)}</span><span>Auto-refresh: ${state.aerialTracking ? '15 seconds' : 'off'}</span></div><div class="radar-layout"><div class="radar-screen" aria-label="Radar view of aircraft near the observer"><div class="radar-sweep" aria-hidden="true"></div>${renderAerialRadar(snapshot)}</div><div class="radar-key"><strong>RADAR VIEW</strong><span>Centre: ${escapeHtml(state.observer.locationName)}</span><span>North is up · east is right</span><span>Rings show 25%, 50%, 75%, and 100% of the selected ground radius.</span></div></div>${rows ? `<div class="aerial-list">${rows}</div>` : '<p class="empty-state">No aircraft with usable position and altitude data were returned in this radius.</p>'}` : '<div class="module-boundary"><strong>No live data loaded</strong><p>Choose a radius and press Refresh now, or start tracking. Observer coordinates are sent to the provider only when you request data.</p></div>'}<p class="science-note">adsb.fi provides community ADS-B data with limited coverage. It may omit aircraft, contain stale positions, or lack altitude/identity fields. Personal, non-commercial terms and attribution apply.</p></section>`;
}

function renderAerialRadar(snapshot: AerialSnapshot): string {
  const points = snapshot.objects.map((object) => {
    const point = projectAerialObject(object, snapshot.coverage);
    const label = `${object.name} · ${object.altitudeMeters.toFixed(0)} m · ${point.distanceKm.toFixed(1)} km ${point.bearingDegrees.toFixed(0)}°`;
    const icon = object.kind === 'aircraft' ? `<path class="radar-plane" d="M0 -3 L0.9 -0.9 L3 0 L0.9 0.9 L0 3 L-0.55 1 L-2.9 1 L-2.9 0.25 L-1 0 L-2.9 -0.25 L-2.9 -1 L-0.55 -1 Z"></path>` : '<circle r="1.65"></circle>';
    return `<g class="radar-object ${point.withinRadius ? '' : 'is-outside'}" transform="translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})"><title>${escapeHtml(label)}</title><g transform="rotate(${(object.headingDegrees ?? 0).toFixed(1)})">${icon}</g><text x="2.6" y="-2.2">${escapeHtml(object.name)}</text></g>`;
  }).join('');
  return `<svg class="radar-svg" viewBox="0 0 100 100" role="img" aria-label="Top-down aircraft radar"><circle class="radar-ring" cx="50" cy="50" r="44"></circle><circle class="radar-ring" cx="50" cy="50" r="33"></circle><circle class="radar-ring" cx="50" cy="50" r="22"></circle><circle class="radar-ring" cx="50" cy="50" r="11"></circle><path class="radar-axis" d="M50 6V94M6 50H94"></path><text class="radar-direction" x="50" y="4">N</text><text class="radar-direction" x="96" y="51">E</text><text class="radar-direction" x="50" y="98">S</text><text class="radar-direction" x="4" y="51">W</text><circle class="radar-observer" cx="50" cy="50" r="1.7"></circle>${points}</svg>`;
}

function renderPlannedModule(module: DashboardModule): string {
  if (module.id === 'aerial') return renderAerialModule();
  return `<section class="panel module-placeholder"><div class="panel-kicker">PLANNED MODULE</div><h2>${escapeHtml(module.label)}</h2><p class="panel-intro">${escapeHtml(module.description)}</p><div class="module-boundary"><strong>Not connected yet</strong><p>This view is reserved for a future data adapter. AKASHA will show source, timestamp, coverage, freshness, and uncertainty before presenting live results.</p></div><p class="science-note">The current local astronomy calculation remains available in the Sky map view. No placeholder data is being presented as real aircraft, weather, event, or Space POV information.</p></section>`;
}

function setupDashboardViews(): void {
  const controlPanel = app.querySelector<HTMLElement>('.control-panel');
  const workspace = app.querySelector<HTMLElement>('.workspace');
  const lowerGrid = app.querySelector<HTMLElement>('.lower-grid');
  if (!controlPanel || !workspace) return;

  const plannerPanel = lowerGrid?.querySelector<HTMLElement>('.planner-panel');
  const journalPanel = lowerGrid?.querySelector<HTMLElement>('.journal-panel');
  const nav = document.createElement('nav');
  nav.className = 'dashboard-tabs';
  nav.setAttribute('aria-label', 'Dashboard views');
  nav.innerHTML = DASHBOARD_MODULES.map((module) => `<button type="button" class="dashboard-tab ${module.id === state.activeView ? 'is-active' : ''} ${module.implemented ? '' : 'is-planned'}" data-dashboard-view="${module.id}" aria-current="${module.id === state.activeView ? 'page' : 'false'}"><strong>${escapeHtml(module.label)}</strong><small>${module.implemented ? 'available' : 'planned'}</small></button>`).join('');

  const viewHost = document.createElement('div');
  viewHost.className = 'dashboard-views';
  for (const module of DASHBOARD_MODULES) {
    const view = document.createElement('section');
    view.className = `dashboard-view ${module.id === state.activeView ? 'is-active' : ''}`;
    view.dataset.dashboardView = module.id;
    view.setAttribute('aria-hidden', String(module.id !== state.activeView));
    if (module.id === 'sky') view.append(workspace);
    else if (module.id === 'planner' && plannerPanel) view.append(plannerPanel);
    else if (module.id === 'journal' && journalPanel) view.append(journalPanel);
    else view.innerHTML = renderPlannedModule(module);
    viewHost.append(view);
  }
  lowerGrid?.remove();
  controlPanel.insertAdjacentElement('afterend', nav);
  nav.insertAdjacentElement('afterend', viewHost);
  nav.querySelectorAll<HTMLButtonElement>('[data-dashboard-view]').forEach((button) => button.addEventListener('click', () => {
    const view = button.dataset.dashboardView as DashboardView | undefined;
    if (!view) return;
    state.activeView = view;
    nav.querySelectorAll<HTMLButtonElement>('[data-dashboard-view]').forEach((item) => {
      const active = item.dataset.dashboardView === view;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });
    viewHost.querySelectorAll<HTMLElement>('[data-dashboard-view]').forEach((item) => {
      const active = item.dataset.dashboardView === view;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-hidden', String(!active));
    });
  }));
}

function render(): void {
  const inputValue = formatInputDate(state.instant, state.observer.timeZone);
  const filterObjects = CATALOGUE.filter((item) => {
    const query = state.query.toLowerCase();
    return (state.filter === 'all' || item.kind === state.filter) && (item.name.toLowerCase().includes(query) || item.catalogueId?.toLowerCase().includes(query));
  });
  app.innerHTML = `<header class="topbar"><div class="brand-mark">✦</div><div><div class="eyebrow">PERSONAL ASTRONOMY OBSERVATORY</div><h1>AKASHA</h1></div><div class="topbar-status"><span class="live-dot"></span> local calculation · ${escapeHtml(state.observer.timeZone)}</div></header><main class="app-shell"><section class="control-panel panel"><div class="control-group location-controls"><div class="panel-kicker">OBSERVER</div><div class="control-row"><label>Latitude<input id="latitude" type="number" min="-90" max="90" step="0.0001" value="${state.observer.latitude}" /></label><label>Longitude<input id="longitude" type="number" min="-180" max="180" step="0.0001" value="${state.observer.longitude}" /></label><label>Elevation <span class="unit">m</span><input id="elevation" type="number" min="-500" max="9000" step="1" value="${state.observer.elevation}" /></label><label>Time zone<select id="timezone">${TIME_ZONES.map((zone) => `<option value="${zone}" ${zone === state.observer.timeZone ? 'selected' : ''}>${zone}</option>`).join('')}</select></label></div><div class="preset-row"><span>Presets</span><button data-preset="12.9716,77.5946,920">Bengaluru</button><button data-preset="51.5072,-0.1276,11">London</button><button data-preset="40.7128,-74.006,10">New York</button><button data-preset="-33.9249,18.4241,15">Cape Town</button><button class="reset-observer-button" data-action="reset-observer">Reset setup</button></div><div class="conditions-row"><label>Light pollution<select id="light-pollution">${BORTLE_LABELS.map((label, index) => `<option value="${index + 1}" ${state.observer.lightPollution === index + 1 ? 'selected' : ''}>Bortle ${index + 1} · ${label}</option>`).join('')}</select></label><label>Cloud cover <output>${state.observer.cloudCover}%</output><input id="cloud-cover" type="range" min="0" max="100" step="5" value="${state.observer.cloudCover}" /></label><label>Transparency <output>${state.observer.transparency}%</output><input id="transparency" type="range" min="0" max="100" step="5" value="${state.observer.transparency}" /></label><label>Horizon obstruction <output>${state.observer.horizonObstruction}%</output><input id="horizon-obstruction" type="range" min="0" max="100" step="5" value="${state.observer.horizonObstruction}" /></label></div><p class="conditions-note">Manual observing conditions · ${conditionsSummary()} · saved locally in this browser · these adjust guidance, not astronomical positions.</p></div><div class="control-group time-controls"><div class="panel-kicker">OBSERVATION TIME</div><div class="time-row"><input id="observation-time" type="datetime-local" value="${inputValue}" /><button class="button button-quiet" data-action="now">Now</button></div><div class="time-actions"><button class="button button-quiet" data-step="-60">− 1 h</button><button class="button button-primary play-button" data-action="toggle-play">${state.playing ? 'Ⅱ Pause' : '▶ Play'}</button><button class="button button-quiet" data-step="60">+ 1 h</button></div><div class="time-readout">${formatDateTime(state.instant)} · ${state.snapshot.twilight.replace('-', ' ')}</div></div></section><section class="workspace"><section class="panel map-panel"><div class="map-heading"><div><div class="panel-kicker">THE SKY ABOVE YOU</div><h2>${formatDateTime(state.instant)}</h2><p>Zenith at centre · horizon at edge · drag to pan · scroll to zoom</p></div><div class="map-status"><strong>${state.snapshot.objects.filter((item) => item.aboveHorizon).length}</strong><span>starter objects<br />above horizon</span></div></div><div class="sky-stage">${renderMap()}<div class="map-scale"><span>30°</span><span>60°</span><span>horizon</span></div></div><div class="map-footer"><span><i class="legend-line legend-horizon"></i> horizon</span><span><i class="legend-line legend-constellation"></i> constellation guide</span><span><i class="legend-dot"></i> calculated object</span><button data-action="reset-map">Reset view</button></div></section><aside class="side-column">${renderObjectPanel()}<section class="panel catalogue-panel"><div class="panel-kicker">OBJECT CATALOGUE</div><div class="catalogue-tools"><input id="catalogue-search" type="search" placeholder="Search objects" value="${escapeHtml(state.query)}" /><select id="catalogue-filter"><option value="all" ${state.filter === 'all' ? 'selected' : ''}>All types</option><option value="star" ${state.filter === 'star' ? 'selected' : ''}>Stars</option><option value="planet" ${state.filter === 'planet' ? 'selected' : ''}>Moon</option><option value="deep-sky" ${state.filter === 'deep-sky' ? 'selected' : ''}>Deep sky</option></select></div><div class="catalogue-list">${filterObjects.map((item) => `<button class="catalogue-item ${item.id === state.selectedId ? 'is-selected' : ''}" data-select-object="${item.id}"><span class="catalogue-symbol" style="color:${item.color}">${item.kind === 'star' ? '✦' : item.kind === 'moon' ? '◐' : item.kind === 'deep-sky' ? '◇' : '●'}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.classification)}</small></span><span class="catalogue-alt">${state.snapshot.objects.find((calculated) => calculated.id === item.id)?.horizontal.altitude.toFixed(0)}°</span></button>`).join('')}</div></section></aside></section><section class="lower-grid"><section class="panel planner-panel"><div class="panel-kicker">TONIGHT'S OBSERVATION PLANNER</div><div class="section-heading"><div><h2>Start with what is ready</h2><p>Ranked from the local calculation for ${escapeHtml(state.observer.timeZone)}.</p></div><span class="planner-badge">${state.snapshot.twilight === 'night' ? 'dark sky' : state.snapshot.twilight}</span></div><div class="planner-list">${renderPlanner()}</div></section>${renderJournal()}</section><footer class="app-footer"><span>AKASHA v0.3.9 · positions calculated locally with Astronomy Engine</span><span>Geometric horizon and twilight are not a promise of visibility.</span></footer></main>`;
  const locationControls = app.querySelector<HTMLElement>('.location-controls');
  locationControls?.insertAdjacentHTML('afterbegin', `<div class="location-name-row"><label>Location name<input id="location-name" type="text" maxlength="80" value="${escapeHtml(state.observer.locationName)}" placeholder="e.g. Bengaluru" /></label><p class="field-help">A label for this observer. The sky is calculated from the coordinates below.</p></div>`);
  const catalogueFilter = app.querySelector<HTMLSelectElement>('#catalogue-filter');
  const planetOption = catalogueFilter?.querySelector<HTMLOptionElement>('option[value="planet"]');
  if (planetOption) planetOption.textContent = 'Planets';
  if (catalogueFilter && !catalogueFilter.querySelector('option[value="moon"]')) catalogueFilter.insertAdjacentHTML('beforeend', `<option value="moon" ${state.filter === 'moon' ? 'selected' : ''}>Moon</option>`);
  const versionLabel = app.querySelector<HTMLElement>('.app-footer span');
  if (versionLabel) versionLabel.textContent = 'AKASHA v0.4.0 · positions calculated locally with Astronomy Engine';
  setupDashboardViews();
  bindEvents();
  updateMapInteractions();
  updateLegendLabel();
}

function rerender(): void {
  saveObserverSettings(state.observer);
  updateSnapshot();
  render();
}

function bindAudioEvents(): void {
  const audioDock = audioHost.querySelector<HTMLElement>('.audio-dock');
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-minimize"]')?.addEventListener('click', (event) => {
    state.audioMinimized = !state.audioMinimized;
    audioDock?.classList.toggle('is-minimized', state.audioMinimized);
    const button = event.currentTarget as HTMLButtonElement;
    button.textContent = state.audioMinimized ? '↗' : '—';
    button.setAttribute('aria-expanded', String(!state.audioMinimized));
    button.setAttribute('aria-label', state.audioMinimized ? 'Expand audio dock' : 'Minimize audio dock');
  });
  const audioFile = audioHost.querySelector<HTMLInputElement>('#audio-file');
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-load"]')?.addEventListener('click', () => audioFile?.click());
  audioFile?.addEventListener('change', () => {
    const file = audioFile.files?.[0];
    if (!file) return;
    try {
      state.audioMessage = '';
      loadLocalAudio(file);
    } catch (error) {
      state.audioMessage = error instanceof Error ? error.message : 'The audio file could not be loaded.';
      renderAudioDock();
    }
  });
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-play"]')?.addEventListener('click', () => {
    state.audioMessage = '';
    void playAudio().catch((error: unknown) => {
      state.audioMessage = error instanceof Error ? error.message : 'Audio playback could not start.';
      renderAudioDock();
    });
  });
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-pause"]')?.addEventListener('click', () => {
    void pauseAudio().catch(() => {
      state.audioMessage = 'Audio could not be paused.';
      renderAudioDock();
    });
  });
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-stop"]')?.addEventListener('click', () => {
    void stopAudio().catch(() => {
      state.audioMessage = 'Audio could not be stopped.';
      renderAudioDock();
    });
  });
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-ambient"]')?.addEventListener('click', () => useAmbient());
  audioHost.querySelector<HTMLButtonElement>('[data-action="audio-save"]')?.addEventListener('click', () => {
    const operation = getAudioState().savedTrackAvailable ? forgetSavedAudio() : saveCurrentAudio();
    void operation.catch((error: unknown) => {
      state.audioMessage = error instanceof Error ? error.message : 'The audio track could not be saved locally.';
      renderAudioDock();
    });
  });
  audioHost.querySelector<HTMLInputElement>('#audio-volume')?.addEventListener('input', (event) => setAudioVolume(Number((event.target as HTMLInputElement).value)));
  const youtubeUrl = audioHost.querySelector<HTMLInputElement>('#youtube-url');
  audioHost.querySelector<HTMLButtonElement>('[data-action="youtube-load"]')?.addEventListener('click', () => {
    try {
      state.audioMessage = '';
      loadYouTubeAudio(youtubeUrl?.value ?? '');
    } catch (error) {
      state.audioMessage = error instanceof Error ? error.message : 'The YouTube link could not be loaded.';
      renderAudioDock();
    }
  });
  audioHost.querySelector<HTMLButtonElement>('[data-action="youtube-save"]')?.addEventListener('click', () => {
    try {
      if (getAudioState().savedYouTubeAvailable) forgetSavedYouTube();
      else saveCurrentYouTube();
      state.audioMessage = '';
    } catch (error) {
      state.audioMessage = error instanceof Error ? error.message : 'The YouTube link could not be saved locally.';
      renderAudioDock();
    }
  });
}

function bindEvents(): void {
  app.querySelectorAll<HTMLElement>('[data-select-object]').forEach((element) => element.addEventListener('click', () => {
    state.selectedId = element.dataset.selectObject ?? state.selectedId;
    render();
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => button.addEventListener('click', () => {
    const [latitude, longitude, elevation] = (button.dataset.preset ?? '').split(',').map(Number);
    const preset = OBSERVER_PRESETS.find((item) => item.latitude === latitude && item.longitude === longitude && item.elevation === elevation);
    state.observer = preset ? applyObserverPreset(state.observer, preset) : { ...state.observer, latitude, longitude, elevation };
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
    saveObserverSettings(state.observer);
    render();
  });
  app.querySelector<HTMLInputElement>('#location-name')?.addEventListener('change', (event) => {
    state.observer.locationName = normalizeLocationName((event.target as HTMLInputElement).value);
    rerender();
  });
  ['latitude', 'longitude', 'elevation'].forEach((id) => app.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('change', (event) => {
    const value = Number((event.target as HTMLInputElement).value);
    if (id === 'latitude') state.observer.latitude = Math.max(-90, Math.min(90, value));
    if (id === 'longitude') state.observer.longitude = Math.max(-180, Math.min(180, value));
    if (id === 'elevation') state.observer.elevation = Math.max(-500, Math.min(9000, value));
    rerender();
  }));
  app.querySelector<HTMLSelectElement>('#light-pollution')?.addEventListener('change', (event) => {
    state.observer.lightPollution = Math.max(1, Math.min(9, Number((event.target as HTMLSelectElement).value)));
    rerender();
  });
  app.querySelectorAll<HTMLInputElement>('#cloud-cover, #transparency, #horizon-obstruction').forEach((input) => input.addEventListener('change', () => {
    const value = Math.max(0, Math.min(100, Number(input.value)));
    if (input.id === 'cloud-cover') state.observer.cloudCover = value;
    if (input.id === 'transparency') state.observer.transparency = value;
    if (input.id === 'horizon-obstruction') state.observer.horizonObstruction = value;
    rerender();
  }));
  app.querySelector<HTMLButtonElement>('[data-action="reset-observer"]')?.addEventListener('click', () => {
    state.observer = { ...DEFAULT_OBSERVER };
    rerender();
  });
  app.querySelector<HTMLInputElement>('#aerial-radius')?.addEventListener('change', (event) => {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) state.aerialRadiusNauticalMiles = Math.max(1, Math.min(250, value));
  });
  app.querySelector<HTMLButtonElement>('[data-action="load-aerial"]')?.addEventListener('click', () => { void refreshAerial(); });
  app.querySelector<HTMLButtonElement>('[data-action="toggle-aerial-tracking"]')?.addEventListener('click', () => {
    if (state.aerialTracking) {
      stopAerialTracking();
      render();
    } else startAerialTracking();
  });
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

onAudioChange(() => renderAudioDock());
void restoreSavedAudio().catch((error: unknown) => {
  state.audioMessage = error instanceof Error ? error.message : 'Saved audio could not be restored.';
  renderAudioDock();
});
render();
renderAudioDock();
