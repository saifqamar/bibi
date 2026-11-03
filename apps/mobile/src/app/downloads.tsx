import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Body, Button, Empty } from "@/components/ui";
import { useDownloads, type DownloadItem } from "@/downloads/store";
import { formatBytes } from "@/lib/format";

const statusText: Record<DownloadItem["status"], string> = {
  queued: "Waiting",
  downloading: "Downloading",
  paused: "Paused",
  done: "Downloaded",
  failed: "Failed",
};

/** Storage screen: what is on the device, how much space it takes, and deleting it. */
export default function DownloadsScreen() {
  const items = Object.values(useDownloads((s) => s.items)).sort(
    (a, b) =>
      a.meta.seriesTitle.localeCompare(b.meta.seriesTitle) ||
      a.meta.number - b.meta.number,
  );
  const [confirming, setConfirming] = useState(false);
  const total = items.reduce((sum, item) => sum + item.bytes, 0);
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <FlatList
        data={items}
        keyExtractor={(item) => item.meta.episodeId}
        contentContainerClassName="gap-2 p-4"
        ListHeaderComponent={
          <Body muted className="pb-2 text-sm">
            {`${items.length} ${items.length === 1 ? "episode" : "episodes"} · ${formatBytes(total)} used`}
          </Body>
        }
        ListEmptyComponent={
          <Empty
            title="No downloads"
            hint="Download episodes from a series page to listen offline."
          />
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-xl border border-border p-3 dark:border-border-dark">
            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="font-semibold text-foreground dark:text-foreground-dark"
              >
                {item.meta.seriesTitle}
              </Text>
              <Text
                numberOfLines={1}
                className="text-sm text-muted dark:text-muted-dark"
              >
                {`Episode ${item.meta.number}: ${item.meta.title}`}
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark">
                {item.status === "done"
                  ? formatBytes(item.bytes)
                  : `${statusText[item.status]}${item.status === "downloading" ? ` ${Math.round(item.progress * 100)}%` : ""}`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.meta.seriesTitle} episode ${item.meta.number}`}
              onPress={() =>
                void useDownloads.getState().remove(item.meta.episodeId)
              }
              className="min-h-11 justify-center px-2"
            >
              <Text className="text-danger">Delete</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          items.length > 0 ? (
            <View className="gap-2 pt-4">
              {confirming ? (
                <>
                  <Button
                    variant="danger"
                    label="Delete all downloads"
                    onPress={() => {
                      setConfirming(false);
                      void useDownloads.getState().removeAll();
                    }}
                  />
                  <Button
                    variant="outline"
                    label="Keep them"
                    onPress={() => setConfirming(false)}
                  />
                </>
              ) : (
                <Button
                  variant="outline"
                  label="Delete all…"
                  onPress={() => setConfirming(true)}
                />
              )}
            </View>
          ) : undefined
        }
      />
    </View>
  );
}
