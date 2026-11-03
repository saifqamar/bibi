import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

// Queries pause while offline and resume on reconnect.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 60_000, gcTime: 7 * 24 * 60 * 60 * 1000 },
    },
  });
}

/** Cached home, series and progress data survive restarts so the app opens offline. */
export function makePersister() {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "bibi.query-cache",
  });
}
