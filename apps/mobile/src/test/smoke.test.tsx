import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

it("renders with NativeWind classes", async () => {
  await render(
    <View className="p-4">
      <Text className="text-lg text-foreground">Hello Bibi</Text>
    </View>,
  );
  expect(screen.getByText("Hello Bibi")).toBeTruthy();
});
