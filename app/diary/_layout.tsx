import { Stack } from "expo-router";

export default function DiaryStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="trigger" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}