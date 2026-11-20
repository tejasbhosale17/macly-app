import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
      <Stack.Screen name="anthropometrics" options={{ title: 'Your Info' }} />
      <Stack.Screen name="goal-type" options={{ title: 'Your Goal' }} />
      <Stack.Screen name="goals" options={{ title: 'Daily Goals' }} />
    </Stack>
  );
}
