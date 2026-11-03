import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { usePlayer } from "@/player/store";

/** Shown above the tab bar on every tab while something is loaded in the player. */
export function MiniPlayer() {
  const router = useRouter();
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const share = usePlayer((s) =>
    s.duration ? Math.min(1, s.position / s.duration) : 0,
  );
  if (!current) return null;
  return (
    <View
      accessibilityLabel="Mini player"
      className="border-t border-border bg-card dark:border-border-dark dark:bg-card-dark"
    >
      <View className="h-0.5 bg-border dark:bg-border-dark">
        <View
          style={{ width: `${share * 100}%` }}
          className="h-0.5 bg-primary dark:bg-primary-dark"
        />
      </View>
      <View className="flex-row items-center gap-2 px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open player, ${current.seriesTitle}, episode ${current.number}`}
          onPress={() =>
            router.push({
              pathname: "/player/[episodeId]",
              params: { episodeId: current.episodeId },
            })
          }
          className="min-h-11 flex-1 justify-center"
        >
          <Text
            numberOfLines={1}
            className="font-semibold text-foreground dark:text-foreground-dark"
          >
            {current.title}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs text-muted dark:text-muted-dark"
          >
            {current.seriesTitle} · Episode {current.number}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? "Pause" : "Play"}
          onPress={() => usePlayer.getState().toggle()}
          className="h-11 w-11 items-center justify-center"
        >
          <Text className="text-lg text-foreground dark:text-foreground-dark">
            {playing ? "❚❚" : "▶"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop and close player"
          onPress={() => void usePlayer.getState().stop()}
          className="h-11 w-11 items-center justify-center"
        >
          <Text className="text-lg text-muted dark:text-muted-dark">✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
