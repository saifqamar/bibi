import {
  resumePoint,
  useProgress,
  useSeries,
  useSeriesEpisodes,
  type ListenerEpisode,
} from "@bibi/query-hooks";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  AiBadge,
  Body,
  Button,
  ErrorState,
  Loading,
  Title,
} from "@/components/ui";
import { errorMessage, formatDuration } from "@/lib/format";

function EpisodeRow({
  episode,
  progress,
  onPlay,
}: {
  episode: ListenerEpisode;
  progress?: { position: number; completed: boolean };
  onPlay: () => void;
}) {
  const duration = Number(episode.duration_seconds ?? 0);
  const share = progress?.completed
    ? 1
    : progress && duration
      ? Math.min(1, progress.position / duration)
      : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play episode ${episode.number}, ${episode.title}`}
      onPress={onPlay}
      className="gap-1 border-b border-border py-3 dark:border-border-dark"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          numberOfLines={1}
          className="flex-1 font-semibold text-foreground dark:text-foreground-dark"
        >
          {episode.number}. {episode.title}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {episode.is_free ? "Free" : "Paid"}
        </Text>
      </View>
      <Text className="text-sm text-muted dark:text-muted-dark">
        {formatDuration(episode.duration_seconds)}
        {progress?.completed
          ? " · Finished"
          : share > 0
            ? ` · ${Math.round(share * 100)}% listened`
            : ""}
      </Text>
      {share > 0 && (
        <View
          accessibilityLabel={`Progress ${Math.round(share * 100)}%`}
          className="h-1 overflow-hidden rounded-full bg-border dark:bg-border-dark"
        >
          <View
            style={{ width: `${share * 100}%` }}
            className="h-1 bg-primary dark:bg-primary-dark"
          />
        </View>
      )}
    </Pressable>
  );
}

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const series = useSeries(id);
  const episodes = useSeriesEpisodes(id);
  const progress = useProgress();
  const resume = resumePoint(progress.data, id);
  const first = episodes.data?.[0];
  const play = (episodeId: string, position = 0) =>
    router.push({
      pathname: "/player/[episodeId]",
      params: { episodeId, position: String(position) },
    });

  if (series.isPending) return <Loading />;
  if (series.isError)
    return (
      <ErrorState
        message={errorMessage(series.error)}
        onRetry={() => void series.refetch()}
      />
    );
  const s = series.data;
  const byEpisode = new Map(
    (progress.data ?? [])
      .filter((p) => p.series_id === id)
      .map((p) => [
        p.episode_id,
        { position: Number(p.position_seconds), completed: p.completed },
      ]),
  );

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="gap-4 p-4"
    >
      <Stack.Screen options={{ title: s.title }} />
      <View className="flex-row gap-4">
        <View className="h-32 w-32 overflow-hidden rounded-xl bg-border dark:bg-border-dark">
          {s.cover_url ? (
            <Image
              source={{ uri: s.cover_url }}
              accessibilityIgnoresInvertColors
              style={{ width: 128, height: 128 }}
            />
          ) : null}
        </View>
        <View className="flex-1 gap-2">
          <Title>{s.title}</Title>
          <AiBadge />
          <Text className="text-sm text-muted dark:text-muted-dark">
            {s.language.toUpperCase()} · {s.play_count} plays
          </Text>
        </View>
      </View>
      {s.themes.length > 0 && (
        <Body muted className="text-sm">
          {s.themes.join(" · ")}
        </Body>
      )}
      <Body>{s.premise}</Body>
      {resume ? (
        <Button
          label={`Continue episode ${resume.episode_number}`}
          onPress={() =>
            play(resume.episode_id, Number(resume.position_seconds))
          }
        />
      ) : first ? (
        <Button label="Play episode 1" onPress={() => play(first.id)} />
      ) : null}
      <View>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Episodes
        </Text>
        {episodes.isPending ? (
          <Loading />
        ) : (
          (episodes.data ?? []).map((episode) => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              progress={byEpisode.get(episode.id)}
              onPlay={() =>
                play(
                  episode.id,
                  byEpisode.get(episode.id)?.completed
                    ? 0
                    : (byEpisode.get(episode.id)?.position ?? 0),
                )
              }
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
