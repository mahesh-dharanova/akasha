export type AudioStatus = 'stopped' | 'playing' | 'paused';

export interface AudioState {
  mode: 'ambient' | 'local';
  status: AudioStatus;
  label: string;
  volume: number;
  savedTrackAvailable: boolean;
}

type AudioListener = (state: AudioState) => void;
type StoredTrack = { id: 'last'; name: string; type: string; blob: Blob };

const AUDIO_DB_NAME = 'akasha-audio-v1';
const AUDIO_STORE_NAME = 'tracks';

let state: AudioState = { mode: 'ambient', status: 'stopped', label: 'AKASHA ambient', volume: 0.35, savedTrackAvailable: false };
let localAudio: HTMLAudioElement | null = null;
let localUrl: string | null = null;
let localBlob: Blob | null = null;
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: AudioScheduledSourceNode[] = [];
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
  notify();
}

function stopAmbientNodes(): void {
  ambientNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // A node that has already stopped needs no further action.
    }
    node.disconnect();
  });
  ambientNodes = [];
  masterGain?.disconnect();
  masterGain = null;
  if (audioContext) void audioContext.close();
  audioContext = null;
}

function buildAmbientSoundscape(): void {
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = state.volume * 0.18;
  masterGain.connect(audioContext.destination);

  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  filter.connect(masterGain);

  [55, 82.41, 110, 164.81].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const voiceGain = audioContext!.createGain();
    oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    voiceGain.gain.value = index === 0 ? 0.34 : 0.16;
    oscillator.connect(voiceGain);
    voiceGain.connect(filter);
    oscillator.start();
    ambientNodes.push(oscillator);
  });
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
  state = { ...state, mode: 'local', status: 'stopped', label, savedTrackAvailable };
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
  if (masterGain) masterGain.gain.value = state.volume * 0.18;
  notify();
}

export function loadLocalAudio(file: File): void {
  if (!file.type.startsWith('audio/')) throw new Error('Choose an audio file such as MP3, WAV, or OGG.');
  assignLocalAudio(file, file.name, false);
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
  stopAmbientNodes();
  state = { ...state, mode: 'ambient', status: 'stopped', label: 'AKASHA ambient' };
  notify();
}

export async function playAudio(): Promise<void> {
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
  if (state.mode === 'local') localAudio?.pause();
  else if (audioContext) await audioContext.suspend();
  if (state.status === 'playing') updateStatus('paused');
}

export async function stopAudio(): Promise<void> {
  if (state.mode === 'local') {
    localAudio?.pause();
    if (localAudio) localAudio.currentTime = 0;
  } else {
    stopAmbientNodes();
  }
  updateStatus('stopped');
}
