import { useProgress, useShelves, type Progress } from "@bibi/query-hooks";
import { Link } from "expo-router";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SeriesCard } from "@/components/SeriesCard";
import {
  Body,
  Empty,
  ErrorState,
  Loading,
  Screen,
  Title,
} from "@/components/ui";
import { errorMessage, formatDuration } from "@/lib/format";

function ContinueCard({ item }: { item: Progress }) {
  const left =
    Number(item.duration_seconds ?? 0) - Number(item.position_seconds);
  return (
    <Link
      href={{ pathname: "/series/[id]", params: { id: item.series_id } }}
      asChild
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Continue ${item.series_title}`}
        className="w-64 gap-1 rounded-xl border border-border p-3 dark:border-border-dark"
      >
        <Text
          numberOfLines={1}
          className="font-semibold text-foreground dark:text-foreground-dark"
        >
          {item.series_title}
        </Text>
        <Text
          numberOfLines={1}
          className="text-sm text-muted dark:text-muted-dark"
        >
          Episode {item.episode_number}: {item.episode_title} ·{" "}
          {formatDuration(left)} left
        </Text>
      </Pressable>
    </Link>
  );
}

export default function Home() {
  const shelves = useShelves();
  const progress = useProgress();
  const resume = (progress.data ?? []).filter((p) => !p.completed);

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 py-4">
        <View className="px-4">
          <Title>Listen</Title>
        </View>
        {resume.length > 0 && (
          <View accessibilityLabel="Continue listening" className="gap-3">
            <Text className="px-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Continue listening
            </Text>
            <FlatList
              horizontal
              data={resume}
              keyExtractor={(p) => p.episode_id}
              contentContainerClassName="gap-3 px-4"
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <ContinueCard item={item} />}
            />
          </View>
        )}
        {shelves.isPending ? (
          <Loading />
        ) : shelves.isError && !shelves.data ? (
          <ErrorState
            message={errorMessage(shelves.error)}
            onRetry={() => void shelves.refetch()}
          />
        ) : (shelves.data ?? []).length === 0 ? (
          <Empty
            title="No stories yet"
            hint="New series appear here as soon as they are published."
          />
        ) : (
          (shelves.data ?? []).map((shelf) => (
            <View
              key={shelf.id}
              accessibilityLabel={`Shelf ${shelf.title}`}
              className="gap-3"
            >
              <Text className="px-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
                {shelf.title}
              </Text>
              <FlatList
                horizontal
                data={shelf.series}
                keyExtractor={(s) => s.id}
                contentContainerClassName="gap-3 px-4"
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <SeriesCard series={item} />}
              />
            </View>
          ))
        )}
        <View className="px-4">
          <Body muted className="text-xs">
            Every Bibi story is written with AI assistance and shaped by a human
            writer.
          </Body>
        </View>
      </ScrollView>
    </Screen>
  );
}
