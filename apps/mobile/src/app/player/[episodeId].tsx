import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Body, Title } from "@/components/ui";

/** Placeholder until the player lands (plan 11): shows where playback would start. */
export default function PlayerScreen() {
  const { episodeId, position } = useLocalSearchParams<{
    episodeId: string;
    position?: string;
  }>();
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background p-6 dark:bg-background-dark">
      <Title>Player</Title>
      <Body muted>
        Episode {episodeId} from {position ?? 0} s
      </Body>
    </View>
  );
}
