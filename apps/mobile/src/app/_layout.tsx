import "../global.css";
import { ApiProvider } from "@bibi/query-hooks";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { makePersister, makeQueryClient } from "@/lib/queryClient";
import { useSession } from "@/lib/session";
import { useBackgroundSync } from "@/lib/sync";
import { useDownloads } from "@/downloads/store";
import { usePlayer } from "@/player/store";

/** Signed-out listeners only see the (auth) group; signed-in ones never see it. */
function AuthRedirect({ signedIn }: { signedIn: boolean }) {
  const inAuth = useSegments()[0] === "(auth)";
  if (!signedIn && !inAuth) return <Redirect href="/sign-in" />;
  if (signedIn && inAuth) return <Redirect href="/" />;
  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(makePersister);
  const { ready, user, load } = useSession();
  useEffect(() => {
    void load();
    void useDownloads.getState().load();
    void usePlayer.getState().loadRate();
  }, [load]);
  useBackgroundSync(ready && Boolean(user));

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <ApiProvider client={api}>
          {/* The navigator stays mounted so deep links resolve; the loader covers it until the
              stored session is read, so a signed-in listener never sees the sign-in screen. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen
              name="series/[id]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="downloads"
              options={{ headerShown: true, title: "Downloads" }}
            />
            <Stack.Screen
              name="player/[episodeId]"
              options={{ presentation: "modal" }}
            />
          </Stack>
          {ready && <AuthRedirect signedIn={Boolean(user)} />}
          {!ready && (
            <View style={StyleSheet.absoluteFill}>
              <Loading />
            </View>
          )}
        </ApiProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
