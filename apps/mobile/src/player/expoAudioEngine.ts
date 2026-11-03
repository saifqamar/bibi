import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from "expo-audio";
import type { EngineStatus, PlayerEngine, Track } from "./engine";

/**
 * expo-audio backed engine: plays in the background, shows lock-screen / notification controls
 * (play, pause, ±seek) and pauses on interruptions such as calls or unplugged headphones, which
 * the OS reports and expo-audio applies.
 */
export class ExpoAudioEngine implements PlayerEngine {
  private player: AudioPlayer | null = null;
  private listeners = new Set<(status: EngineStatus) => void>();
  private configured = false;

  private emit = (status: AudioStatus) => {
    const next: EngineStatus = {
      position: status.currentTime,
      duration: status.duration,
      playing: status.playing,
      ended: status.didJustFinish,
    };
    this.listeners.forEach((listener) => listener(next));
  };

  async load(track: Track, startAt: number): Promise<void> {
    if (!this.configured) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
      this.configured = true;
    }
    if (!this.player) {
      this.player = createAudioPlayer({ uri: track.url }, { updateInterval: 500 });
      this.player.addListener("playbackStatusUpdate", this.emit);
    } else {
      this.player.replace({ uri: track.url });
    }
    if (startAt > 0) await this.player.seekTo(startAt);
    this.player.setActiveForLockScreen(
      true,
      { title: track.title, artist: track.artist, artworkUrl: track.artworkUrl ?? undefined },
      { showSeekBackward: true, showSeekForward: true },
    );
  }

  play(): void {
    this.player?.play();
  }

  pause(): void {
    this.player?.pause();
  }

  async seekTo(seconds: number): Promise<void> {
    await this.player?.seekTo(seconds);
  }

  setRate(rate: number): void {
    this.player?.setPlaybackRate(rate);
  }

  onStatus(listener: (status: EngineStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  unload(): void {
    if (!this.player) return;
    this.player.pause();
    this.player.clearLockScreenControls();
    this.player.remove();
    this.player = null;
  }
}
