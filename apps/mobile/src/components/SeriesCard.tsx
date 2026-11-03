import type { ListenerSeries } from "@bibi/query-hooks";
import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { AiBadge } from "./ui";

export function SeriesCard({
  series,
  width = 150,
}: {
  series: ListenerSeries;
  width?: number;
}) {
  return (
    <Link
      href={{ pathname: "/series/[id]", params: { id: series.id } }}
      asChild
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={series.title}
        style={{ width }}
        className="gap-2"
      >
        <View
          style={{ width, height: width }}
          className="overflow-hidden rounded-xl bg-border dark:bg-border-dark"
        >
          {series.cover_url ? (
            <Image
              source={{ uri: series.cover_url }}
              accessibilityIgnoresInvertColors
              style={{ width, height: width }}
            />
          ) : null}
        </View>
        <Text
          numberOfLines={2}
          className="text-sm font-semibold text-foreground dark:text-foreground-dark"
        >
          {series.title}
        </Text>
        <AiBadge />
      </Pressable>
    </Link>
  );
}
