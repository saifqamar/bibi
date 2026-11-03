import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { AiBadge, Body, ErrorState, Loading, Title } from "@/components/ui";
import { formatClock } from "@/lib/format";
import {
  SKIP_SECONDS,
  SLEEP_MINUTES,
  SPEEDS,
  usePlayer,
  type Sleep,
} from "@/player/store";

function Control({
  label,
  text,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  text: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`items-center justify-center rounded-full ${primary ? "h-20 w-20 bg-primary dark:bg-primary-dark" : "h-14 w-14 border border-border dark:border-border-dark"} ${disabled ? "opacity-40" : ""}`}
    >
      <Text
        className={`font-semibold ${primary ? "text-lg text-white dark:text-black" : "text-sm text-foreground dark:text-foreground-dark"}`}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-11 justify-center rounded-full px-3 ${selected ? "bg-foreground dark:bg-foreground-dark" : "border border-border dark:border-border-dark"}`}
    >
      <Text
        className={`text-sm ${selected ? "text-background dark:text-background-dark" : "text-foreground dark:text-foreground-dark"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function sleepLabel(sleep: Sleep): string {
  if (sleep.mode === "end") return "Sleep: end of episode";
  if (sleep.mode === "timer")
    return `Sleep in ${Math.max(1, Math.ceil((sleep.endsAt - Date.now()) / 60_000))} min`;
  return "Sleep timer off";
}

export default function PlayerScreen() {
  const params = useLocalSearchParams<{
    episodeId: string;
    position?: string;
    updatedAt?: string;
    completed?: string;
  }>();
  const router = useRouter();
  const player = usePlayer();
  const {
    current,
    position,
    duration,
    playing,
    loading,
    error,
    rate,
    sleep,
    source,
  } = player;

  useEffect(() => {
    if (usePlayer.getState().current?.episodeId === params.episodeId) return;
    void usePlayer.getState().start(params.episodeId, {
      server: params.updatedAt
        ? {
            position: Number(params.position ?? 0),
            updatedAt: params.updatedAt,
            completed: params.completed === "true",
          }
        : null,
    });
  }, [params.episodeId, params.position, params.updatedAt, params.completed]);

  if (error && !current)
    return (
      <ErrorState
        message={error}
        onRetry={() => void usePlayer.getState().start(params.episodeId)}
      />
    );
  if (loading || !current) return <Loading />;

  const share = duration ? Math.min(1, position / duration) : 0;
  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="items-center gap-5 p-6"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close player"
        onPress={() => router.back()}
        className="min-h-11 self-start justify-center"
      >
        <Text className="text-primary dark:text-primary-dark">Close</Text>
      </Pressable>
      <View className="h-56 w-56 overflow-hidden rounded-2xl bg-border dark:bg-border-dark">
        {current.coverUrl ? (
          <Image
            source={{ uri: current.coverUrl }}
            accessibilityIgnoresInvertColors
            style={{ width: 224, height: 224 }}
          />
        ) : null}
      </View>
      <View className="items-center gap-1">
        <Body muted className="text-sm">
          {current.seriesTitle}
        </Body>
        <Title>{`${current.number}. ${current.title}`}</Title>
        <AiBadge />
        {source === "download" && (
          <Body muted className="text-xs">
            Playing from your downloads
          </Body>
        )}
      </View>

      <View className="w-full gap-1">
        <View
          accessibilityRole="adjustable"
          accessibilityLabel="Position"
          accessibilityValue={{
            min: 0,
            max: Math.round(duration),
            now: Math.round(position),
            text: `${formatClock(position)} of ${formatClock(duration)}`,
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            void usePlayer
              .getState()
              .seekBy(
                e.nativeEvent.actionName === "increment"
                  ? SKIP_SECONDS
                  : -SKIP_SECONDS,
              )
          }
          className="h-2 overflow-hidden rounded-full bg-border dark:bg-border-dark"
        >
          <View
            style={{ width: `${share * 100}%` }}
            className="h-2 bg-primary dark:bg-primary-dark"
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted dark:text-muted-dark">
            {formatClock(position)}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            -{formatClock(Math.max(0, duration - position))}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Control
          label="Previous episode"
          text="⏮"
          onPress={() => void player.previous()}
        />
        <Control
          label={`Back ${SKIP_SECONDS} seconds`}
          text={`-${SKIP_SECONDS}`}
          onPress={() => void player.seekBy(-SKIP_SECONDS)}
        />
        <Control
          primary
          label={playing ? "Pause" : "Play"}
          text={playing ? "❚❚" : "▶"}
          onPress={player.toggle}
        />
        <Control
          label={`Forward ${SKIP_SECONDS} seconds`}
          text={`+${SKIP_SECONDS}`}
          onPress={() => void player.seekBy(SKIP_SECONDS)}
        />
        <Control
          label="Next episode"
          text="⏭"
          disabled={!current.nextEpisodeId}
          onPress={() => void player.next()}
        />
      </View>

      <View className="w-full gap-2">
        <Text className="font-semibold text-foreground dark:text-foreground-dark">
          Speed
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SPEEDS.map((speed) => (
            <Chip
              key={speed}
              label={`${speed}x`}
              accessibilityLabel={`Speed ${speed}x`}
              selected={rate === speed}
              onPress={() => player.setRate(speed)}
            />
          ))}
        </View>
      </View>

      <View className="w-full gap-2">
        <Text className="font-semibold text-foreground dark:text-foreground-dark">
          {sleepLabel(sleep)}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SLEEP_MINUTES.map((minutes) => (
            <Chip
              key={minutes}
              label={`${minutes} min`}
              accessibilityLabel={`Sleep in ${minutes} minutes`}
              selected={sleep.mode === "timer" && sleep.minutes === minutes}
              onPress={() => player.setSleep(minutes)}
            />
          ))}
          <Chip
            label="End of episode"
            accessibilityLabel="Sleep at end of episode"
            selected={sleep.mode === "end"}
            onPress={() => player.setSleep("end")}
          />
          {sleep.mode !== "off" && (
            <Chip
              label="Off"
              accessibilityLabel="Turn sleep timer off"
              selected={false}
              onPress={() => player.setSleep("off")}
            />
          )}
        </View>
      </View>
      {error && (
        <Text accessibilityRole="alert" className="text-danger">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}
