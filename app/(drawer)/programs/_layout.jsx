import { Stack } from "expo-router";

export default function ProgramsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="programSelection" />
      <Stack.Screen name="select-body-zone" />
      <Stack.Screen name="select-eletrode-positioning" />
    </Stack>
  );
}
