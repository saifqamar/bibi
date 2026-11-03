import { Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/tabs";
import { View } from "react-native";
import { MiniPlayer } from "@/components/MiniPlayer";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <View>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </View>
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
