import {
  resumePoint,
  useProgress,
  useSeries,
  useSeriesEpisodes,
  type ListenerEpisode,
  type ListenerSeries,
  type Progress,
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
import { useDownloads, type DownloadItem } from "@/downloads/store";
import { errorMessage, formatDuration } from "@/lib/format";

function downloadLabel(item: DownloadItem | undefined): string {
  if (!item) return "Download";
  switch (item.status) {
    case "queued":
      return "Waiting…";
    case "downloading":
      return `${Math.round(item.progress * 100)}%`;
    case "paused":
      return "Paused";
    case "done":
      return "Downloaded";
    case "failed":
      return "Retry download";
  }
}

function DownloadButton({
  series,
  episode,
  previousEpisodeId,
}: {
  series: ListenerSeries;
  episode: ListenerEpisode;
  previousEpisodeId: string | null;
}) {
  const item = useDownloads((s) => s.items[episode.id]);
  const { download, pause, resume, remove } = useDownloads.getState();
  const onPress = () => {
    if (!item) {
      void download({
        episodeId: episode.id,
        seriesId: series.id,
        seriesTitle: series.title,
        coverUrl: series.cover_url,
        title: episode.title,
        number: episode.number,
        previousEpisodeId,
      });
    } else if (item.status === "downloading") void pause(episode.id);
    else if (item.status === "paused" || item.status === "failed")
      void resume(episode.id);
    else if (item.status === "done") void remove(episode.id);
  };
  const action = !item
    ? `Download episode ${episode.number}`
    : item.status === "done"
      ? `Remove download of episode ${episode.number}`
      : item.status === "downloading"
        ? `Pause download of episode ${episode.number}`
        : `Resume download of episode ${episode.number}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action}
      onPress={onPress}
      className="min-h-11 justify-center rounded-lg border border-border px-3 dark:border-border-dark"
    >
      <Text className="text-xs font-semibold text-foreground dark:text-foreground-dark">
        {downloadLabel(item)}
      </Text>
    </Pressable>
  );
}

function EpisodeRow({
  series,
  episode,
  previousEpisodeId,
  progress,
  onPlay,
}: {
  series: ListenerSeries;
  episode: ListenerEpisode;
  previousEpisodeId: string | null;
  progress?: Progress;
  onPlay: () => void;
}) {
  const duration = Number(episode.duration_seconds ?? 0);
  const position = Number(progress?.position_seconds ?? 0);
  const share = progress?.completed
    ? 1
    : progress && duration
      ? Math.min(1, position / duration)
      : 0;
  return (
    <View className="flex-row items-center gap-3 border-b border-border py-3 dark:border-border-dark">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play episode ${episode.number}, ${episode.title}`}
        onPress={onPlay}
        className="flex-1 gap-1"
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
      <DownloadButton
        series={series}
        episode={episode}
        previousEpisodeId={previousEpisodeId}
      />
    </View>
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
  /** Opens the player; the server's saved position goes along so the newer of it and the device's wins. */
  const play = (episodeId: string, saved?: Progress) =>
    router.push({
      pathname: "/player/[episodeId]",
      params: {
        episodeId,
        position: String(
          saved && !saved.completed ? Number(saved.position_seconds) : 0,
        ),
        ...(saved
          ? { updatedAt: saved.updated_at, completed: String(saved.completed) }
          : {}),
      },
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
      .map((p) => [p.episode_id, p]),
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
          onPress={() => play(resume.episode_id, resume)}
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
          (episodes.data ?? []).map((episode, index, list) => (
            <EpisodeRow
              key={episode.id}
              series={s}
              episode={episode}
              previousEpisodeId={index > 0 ? list[index - 1]!.id : null}
              progress={byEpisode.get(episode.id)}
              onPlay={() => play(episode.id, byEpisode.get(episode.id))}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
