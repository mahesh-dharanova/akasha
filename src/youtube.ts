const YOUTUBE_STORAGE_KEY = 'akasha-youtube-v1';

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface YouTubeApiWindow extends Window {
  YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
  onYouTubeIframeAPIReady?: () => void;
}

let videoId: string | null = null;
let videoUrl: string | null = null;
let player: YouTubePlayer | null = null;
let apiPromise: Promise<void> | null = null;
let playerReady = false;

function youtubeWindow(): YouTubeApiWindow {
  return window as YouTubeApiWindow;
}

export function extractYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadSavedYouTubeUrl(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem(YOUTUBE_STORAGE_KEY);
  if (!saved || !extractYouTubeVideoId(saved)) return null;
  videoUrl = saved;
  videoId = extractYouTubeVideoId(saved);
  return saved;
}

export function saveYouTubeUrl(url: string): void {
  if (typeof localStorage === 'undefined') throw new Error('This browser does not provide local link storage.');
  localStorage.setItem(YOUTUBE_STORAGE_KEY, url);
}

export function forgetYouTubeUrl(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(YOUTUBE_STORAGE_KEY);
}

export function getYouTubeState(): { videoId: string | null; url: string | null; playerReady: boolean } {
  return { videoId, url: videoUrl, playerReady };
}

export function setYouTubeUrl(url: string): string {
  const parsedVideoId = extractYouTubeVideoId(url);
  if (!parsedVideoId) throw new Error('Paste a valid YouTube video link.');
  videoUrl = url.trim();
  videoId = parsedVideoId;
  playerReady = false;
  return parsedVideoId;
}

function loadYouTubeApi(): Promise<void> {
  const api = youtubeWindow();
  if (api.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-akasha-youtube-api]');
    const script = existing ?? document.createElement('script');
    api.onYouTubeIframeAPIReady = () => resolve();
    script.addEventListener('error', () => reject(new Error('The YouTube player API could not be loaded.')));
    if (!existing) {
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.akashaYoutubeApi = 'true';
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export async function mountYouTubePlayer(container: HTMLElement): Promise<void> {
  if (!videoId) return;
  player?.destroy();
  player = null;
  playerReady = false;
  container.replaceChildren();
  const playerElement = document.createElement('div');
  container.appendChild(playerElement);
  await loadYouTubeApi();
  const api = youtubeWindow();
  if (!api.YT?.Player || !videoId || !container.isConnected) return;
  player = new api.YT.Player(playerElement, {
    width: '220',
    height: '200',
    videoId,
    playerVars: { playsinline: 1, controls: 1, rel: 0 },
    events: { onReady: () => { playerReady = true; } },
  });
}

export function playYouTube(): void {
  if (!player || !playerReady) throw new Error('The YouTube player is still loading.');
  player.playVideo();
}

export function pauseYouTube(): void {
  player?.pauseVideo();
}

export function stopYouTube(): void {
  player?.stopVideo();
}

export function setYouTubeVolume(volume: number): void {
  player?.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100));
}

export function clearYouTubePlayer(): void {
  player?.destroy();
  player = null;
  playerReady = false;
  videoId = null;
  videoUrl = null;
}
