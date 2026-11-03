import type { EngineStatus, PlayerEngine, Track } from "./engine";

/** Deterministic engine for tests: time only moves when `advance` is called. */
export class FakeEngine implements PlayerEngine {
  track: Track | null = null;
  position = 0;
  duration = 600;
  playing = false;
  rate = 1;
  loads: { track: Track; startAt: number }[] = [];
  private listeners = new Set<(status: EngineStatus) => void>();

  async load(track: Track, startAt: number): Promise<void> {
    this.track = track;
    this.position = startAt;
    this.playing = false;
    this.loads.push({ track, startAt });
  }
  play(): void {
    this.playing = true;
    this.emit(false);
  }
  pause(): void {
    this.playing = false;
    this.emit(false);
  }
  async seekTo(seconds: number): Promise<void> {
    this.position = Math.max(0, Math.min(this.duration, seconds));
    this.emit(false);
  }
  setRate(rate: number): void {
    this.rate = rate;
  }
  onStatus(listener: (status: EngineStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  unload(): void {
    this.track = null;
    this.playing = false;
  }

  /** Plays `seconds` of media time (scaled by rate), reporting status every second. */
  advance(seconds: number): void {
    for (let i = 0; i < seconds && this.playing; i += 1) {
      this.position = Math.min(this.duration, this.position + this.rate);
      const ended = this.position >= this.duration;
      if (ended) this.playing = false;
      this.emit(ended);
      if (ended) return;
    }
  }

  private emit(ended: boolean): void {
    const status = {
      position: this.position,
      duration: this.duration,
      playing: this.playing,
      ended,
    };
    this.listeners.forEach((listener) => listener(status));
  }
}
