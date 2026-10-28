import { clearYouTubePlayer, extractYouTubeVideoId, forgetYouTubeUrl, loadSavedYouTubeUrl, pauseYouTube, playYouTube, saveYouTubeUrl, setYouTubeUrl, setYouTubeVolume, stopYouTube } from './youtube';
export type AudioStatus = 'stopped' | 'playing' | 'paused';

export interface AudioState {
  mode: 'ambient' | 'local' | 'youtube';
  status: AudioStatus;
  label: string;
  volume: number;
  savedTrackAvailable: boolean;
  youtubeUrl: string | null;
  savedYouTubeAvailable: boolean;
}

type AudioListener = (state: AudioState) => void;
type StoredTrack = { id: 'last'; name: string; type: string; blob: Blob };

const AUDIO_DB_NAME = 'akasha-audio-v1';
const AUDIO_STORE_NAME = 'tracks';
const AMBIENT_GAIN_SCALE = 0.12;
const AMBIENT_NOTE_INTERVAL_MS = 8_000;
const AMBIENT_PHRASE = [261.63, 329.63, 392, 493.88, 392, 329.63, 293.66, 349.23];

const savedYouTubeUrl = loadSavedYouTubeUrl();
let state: AudioState = { mode: 'ambient', status: 'stopped', label: 'AKASHA · Space-Time', volume: 0.35, savedTrackAvailable: false, youtubeUrl: savedYouTubeUrl, savedYouTubeAvailable: Boolean(savedYouTubeUrl) };
let localAudio: HTMLAudioElement | null = null;
let localUrl: string | null = null;
let localBlob: Blob | null = null;
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let ambientDelay: DelayNode | null = null;
let ambientFeedback: GainNode | null = null;
let ambientWet: GainNode | null = null;
let ambientNodes: AudioScheduledSourceNode[] = [];
let ambientPhraseTimer: number | null = null;
let ambientPhraseIndex = 0;
const listeners = new Set<AudioListener>();

function openAudioDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('This browser does not provide local audio storage.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('The local audio database could not be opened.'));
  });
}

async function saveTrack(track: StoredTrack): Promise<void> {
  const database = await openAudioDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE_NAME, 'readwrite');
    transaction.objectStore(AUDIO_STORE_NAME).put(track);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('The audio track could not be saved locally.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('The audio track save was aborted.'));
  }).finally(() => database.close());
}

async function readSavedTrack(): Promise<StoredTrack | undefined> {
  const database = await openAudioDatabase();
  return new Promise<StoredTrack | undefined>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE_NAME, 'readonly');
    const request = transaction.objectStore(AUDIO_STORE_NAME).get('last');
    request.onsuccess = () => resolve(request.result as StoredTrack | undefined);
    request.onerror = () => reject(request.error ?? new Error('The saved audio track could not be read.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('The saved audio database could not be read.'));
  });
}

async function deleteSavedTrack(): Promise<void> {
  const database = await openAudioDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE_NAME, 'readwrite');
    transaction.objectStore(AUDIO_STORE_NAME).delete('last');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('The saved audio track could not be removed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('The audio track removal was aborted.'));
  }).finally(() => database.close());
}

function notify(): void {
  listeners.forEach((listener) => listener({ ...state }));
}

function updateStatus(status: AudioStatus): void {
  state = { ...state, status };
}

function stopAmbientNodes(): void {
  if (ambientPhraseTimer !== null) window.clearInterval(ambientPhraseTimer);
  ambientPhraseTimer = null;
  ambientNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // A node that has already stopped needs no further action.
    }
    node.disconnect();
  });
  ambientNodes = [];
  ambientFilter?.disconnect();
  ambientDelay?.disconnect();
  ambientFeedback?.disconnect();
  ambientWet?.disconnect();
  ambientFilter = null;
  ambientDelay = null;
  ambientFeedback = null;
  ambientWet = null;
  masterGain?.disconnect();
  masterGain = null;
  if (audioContext) void audioContext.close();
  audioContext = null;
}

function buildAmbientSoundscape(): void {
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = state.volume * AMBIENT_GAIN_SCALE;
  masterGain.connect(audioContext.destination);

  ambientFilter = audioContext.createBiquadFilter();
  ambientFilter.type = 'lowpass';
  ambientFilter.frequency.value = 1_100;
  ambientFilter.Q.value = 0.7;
  ambientFilter.connect(masterGain);

  ambientDelay = audioContext.createDelay(4);
  ambientDelay.delayTime.value = 1.8;
  ambientFeedback = audioContext.createGain();
  ambientFeedback.gain.value = 0.22;
  ambientWet = audioContext.createGain();
  ambientWet.gain.value = 0.16;
  ambientFilter.connect(ambientDelay);
  ambientDelay.connect(ambientFeedback);
  ambientFeedback.connect(ambientDelay);
  ambientDelay.connect(ambientWet);
  ambientWet.connect(masterGain);

  [55, 82.41, 110, 164.81].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const voiceGain = audioContext!.createGain();
    const pulse = audioContext!.createOscillator();
    const pulseGain = audioContext!.createGain();
    oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    voiceGain.gain.value = index === 0 ? 0.28 : 0.13;
    pulse.frequency.value = 0.035 + index * 0.012;
    pulseGain.gain.value = index === 0 ? 0.08 : 0.04;
    pulse.connect(pulseGain);
    pulseGain.connect(voiceGain.gain);
    oscillator.connect(voiceGain);
    voiceGain.connect(ambientFilter!);
    oscillator.start();
    pulse.start();
    ambientNodes.push(oscillator, pulse);
  });

  ambientPhraseIndex = 0;
  playAmbientNote();
  ambientPhraseTimer = window.setInterval(playAmbientNote, AMBIENT_NOTE_INTERVAL_MS);
}

function playAmbientNote(): void {
  if (!audioContext || !ambientFilter) return;
  const oscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.value = AMBIENT_PHRASE[ambientPhraseIndex % AMBIENT_PHRASE.length];
  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.exponentialRampToValueAtTime(0.055, now + 1.8);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.2);
  oscillator.connect(noteGain);
  noteGain.connect(ambientFilter);
  oscillator.start(now);
  oscillator.stop(now + 7.4);
  oscillator.addEventListener('ended', () => noteGain.disconnect());
  ambientNodes.push(oscillator);
  ambientPhraseIndex += 1;
}

function assignLocalAudio(blob: Blob, label: string, savedTrackAvailable: boolean): void {
  stopAmbientNodes();
  localAudio?.pause();
  if (localUrl) URL.revokeObjectURL(localUrl);
  localBlob = blob;
  localUrl = URL.createObjectURL(blob);
  localAudio = new Audio(localUrl);
  localAudio.loop = true;
  localAudio.volume = state.volume;
  localAudio.addEventListener('ended', () => updateStatus('stopped'));
  state = { ...state, mode: 'local', status: 'stopped', label, savedTrackAvailable, youtubeUrl: null };
}

export function getAudioState(): AudioState {
  return { ...state };
}

export function onAudioChange(listener: AudioListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAudioVolume(volume: number): void {
  state = { ...state, volume: Math.max(0, Math.min(1, volume)) };
  if (localAudio) localAudio.volume = state.volume;
  if (masterGain) masterGain.gain.value = state.volume * AMBIENT_GAIN_SCALE;
  if (state.mode === 'youtube') setYouTubeVolume(state.volume);
}

export function loadLocalAudio(file: File): void {
  if (!file.type.startsWith('audio/')) throw new Error('Choose an audio file such as MP3, WAV, or OGG.');
  clearYouTubePlayer();
  assignLocalAudio(file, file.name, false);
  notify();
}

export function loadYouTubeAudio(url: string): void {
  const parsedVideoId = extractYouTubeVideoId(url);
  if (!parsedVideoId) throw new Error('Paste a valid YouTube video link.');
  stopAmbientNodes();
  localAudio?.pause();
  clearYouTubePlayer();
  setYouTubeUrl(url);
  state = { ...state, mode: 'youtube', status: 'stopped', label: `YouTube · ${parsedVideoId}`, youtubeUrl: url.trim(), savedYouTubeAvailable: state.savedYouTubeAvailable && state.youtubeUrl === url.trim() };
  notify();
}

export function saveCurrentYouTube(): void {
  if (state.mode !== 'youtube' || !state.youtubeUrl) throw new Error('Load a YouTube video before saving it.');
  saveYouTubeUrl(state.youtubeUrl);
  state = { ...state, savedYouTubeAvailable: true };
  notify();
}

export function forgetSavedYouTube(): void {
  forgetYouTubeUrl();
  if (state.mode === 'youtube') {
    clearYouTubePlayer();
    state = { ...state, mode: 'ambient', status: 'stopped', label: 'AKASHA · Space-Time', youtubeUrl: null, savedYouTubeAvailable: false };
  } else {
    state = { ...state, youtubeUrl: null, savedYouTubeAvailable: false };
  }
  notify();
}

export async function saveCurrentAudio(): Promise<void> {
  if (state.mode !== 'local' || !localBlob) throw new Error('Load a local track before saving it.');
  await saveTrack({ id: 'last', name: state.label, type: localBlob.type, blob: localBlob });
  state = { ...state, savedTrackAvailable: true };
  notify();
}

export async function forgetSavedAudio(): Promise<void> {
  await deleteSavedTrack();
  state = { ...state, savedTrackAvailable: false };
  notify();
}

export async function restoreSavedAudio(): Promise<void> {
  const savedTrack = await readSavedTrack();
  if (!savedTrack?.blob) return;
  assignLocalAudio(savedTrack.blob, savedTrack.name, true);
  notify();
}

export function useAmbient(): void {
  localAudio?.pause();
  localAudio = null;
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = null;
  localBlob = null;
  clearYouTubePlayer();
  stopAmbientNodes();
  state = { ...state, mode: 'ambient', status: 'stopped', label: 'AKASHA · Space-Time', youtubeUrl: null };
  notify();
}

export async function playAudio(): Promise<void> {
  if (state.mode === 'youtube') {
    playYouTube();
    updateStatus('playing');
    return;
  }
  if (state.mode === 'local') {
    if (!localAudio) throw new Error('Choose a local track before playing.');
    await localAudio.play();
    updateStatus('playing');
    return;
  }
  if (!audioContext) buildAmbientSoundscape();
  await audioContext!.resume();
  updateStatus('playing');
}

export async function pauseAudio(): Promise<void> {
  if (state.mode === 'youtube') pauseYouTube();
  else if (state.mode === 'local') localAudio?.pause();
  else if (audioContext) await audioContext.suspend();
  if (state.status === 'playing') updateStatus('paused');
}

export async function stopAudio(): Promise<void> {
  if (state.mode === 'youtube') stopYouTube();
  else if (state.mode === 'local') {
    localAudio?.pause();
    if (localAudio) localAudio.currentTime = 0;
  } else {
    stopAmbientNodes();
  }
  updateStatus('stopped');
}
