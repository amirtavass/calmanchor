import { Stack } from "expo-router";

/**
 * Exercise stack (pushed over tabs):
 *   /exercise/[id]          — exercise detail
 *   /exercise/session/[id]  — guided session
 *   /exercise/category/[key]— exercises in one category
 */
export default function ExerciseStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="category/[key]" />
    </Stack>
  );
}