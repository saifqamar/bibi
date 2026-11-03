import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState } from "react-native";
import { useDownloads } from "@/downloads/store";
import { flushEvents } from "@/events/queue";
import { syncProgress } from "@/player/progress";
import { usePlayer } from "@/player/store";

export async function syncAll(): Promise<void> {
  await Promise.all([
    flushEvents(),
    syncProgress(),
    useDownloads.getState().sync(),
  ]);
}

/**
 * Sends queued events and progress, and reconciles downloads, whenever the app comes to the
 * foreground or the network comes back. Progress is also saved when the app goes to the background.
 */
export function useBackgroundSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    void syncAll();
    const net = NetInfo.addEventListener((state) => {
      if (state.isConnected) void syncAll();
    });
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncAll();
      else if (state === "background") {
        usePlayer.getState().saveNow();
        void flushEvents();
        void syncProgress();
      }
    });
    return () => {
      net?.();
      app.remove();
    };
  }, [enabled]);
}
