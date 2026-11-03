/** What the player store needs from an audio backend. The app uses expo-audio; tests use a fake. */
export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  artworkUrl?: string | null;
}

export interface EngineStatus {
  position: number;
  duration: number;
  playing: boolean;
  /** True once, when the track reaches its end. */
  ended: boolean;
}

export interface PlayerEngine {
  load(track: Track, startAt: number): Promise<void>;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  setRate(rate: number): void;
  onStatus(listener: (status: EngineStatus) => void): () => void;
  /** Stops playback and clears the lock-screen controls. */
  unload(): void;
}

let engine: PlayerEngine | null = null;

export function setEngine(next: PlayerEngine | null): void {
  engine = next;
}

export function getEngine(): PlayerEngine {
  if (!engine) {
    // Loaded lazily so tests and screens that never play do not touch the native module.
    const { ExpoAudioEngine } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./expoAudioEngine") as typeof import("./expoAudioEngine");
    engine = new ExpoAudioEngine();
  }
  return engine;
}
