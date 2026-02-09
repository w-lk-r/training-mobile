import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Sign In" }} />
        <Stack.Screen name="(auth)/signup" options={{ title: "Sign Up" }} />
        <Stack.Screen
          name="onboarding"
          options={{ title: "Set Up Program" }}
        />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
