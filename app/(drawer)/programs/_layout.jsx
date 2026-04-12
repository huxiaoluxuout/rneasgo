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
      <Stack.Screen name="link-device" />
      <Stack.Screen name="devices-working" />
    </Stack>
  );
}
