export type AudioStatus = 'stopped' | 'playing' | 'paused';

export interface AudioState {
  mode: 'ambient' | 'local';
  status: AudioStatus;
  label: string;
  volume: number;
}

type AudioListener = (state: AudioState) => void;

let state: AudioState = { mode: 'ambient', status: 'stopped', label: 'AKASHA ambient', volume: 0.35 };
let localAudio: HTMLAudioElement | null = null;
let localUrl: string | null = null;
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: AudioScheduledSourceNode[] = [];
const listeners = new Set<AudioListener>();

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
  stopAmbientNodes();
  localAudio?.pause();
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = URL.createObjectURL(file);
  localAudio = new Audio(localUrl);
  localAudio.loop = true;
  localAudio.volume = state.volume;
  localAudio.addEventListener('ended', () => updateStatus('stopped'));
  state = { ...state, mode: 'local', status: 'stopped', label: file.name };
  notify();
}

export function useAmbient(): void {
  localAudio?.pause();
  localAudio = null;
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = null;
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
