import { useProgress } from "@bibi/query-hooks";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Empty, Loading, Screen, Title } from "@/components/ui";

export default function Library() {
  const progress = useProgress();
  const inProgress = (progress.data ?? []).filter((p) => !p.completed);
  const finished = (progress.data ?? []).filter((p) => p.completed);
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-4 py-4">
        <Title>Library</Title>
        {progress.isPending ? (
          <Loading />
        ) : inProgress.length + finished.length === 0 ? (
          <Empty
            title="Nothing here yet"
            hint="Stories you start listening to appear here."
          />
        ) : (
          [
            ["In progress", inProgress],
            ["Finished", finished],
          ].map(([label, items]) =>
            (items as typeof inProgress).length ? (
              <View key={label as string} className="gap-2">
                <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                  {label as string}
                </Text>
                {(items as typeof inProgress).map((p) => (
                  <Link
                    key={p.episode_id}
                    href={{
                      pathname: "/series/[id]",
                      params: { id: p.series_id },
                    }}
                    asChild
                  >
                    <Pressable
                      accessibilityRole="link"
                      className="rounded-xl border border-border p-3 dark:border-border-dark"
                    >
                      <Text className="font-semibold text-foreground dark:text-foreground-dark">
                        {p.series_title}
                      </Text>
                      <Text className="text-sm text-muted dark:text-muted-dark">
                        Episode {p.episode_number}: {p.episode_title}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null,
          )
        )}
      </ScrollView>
    </Screen>
  );
}
