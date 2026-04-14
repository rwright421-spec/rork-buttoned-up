import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { DataProvider, useData } from "@/providers/DataProvider";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ButtonedUpNav() {
  const { settings, loaded } = useData();
  const { themeKey, colors } = useTheme();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loaded && !ready) {
      setReady(true);
      console.log("[ButtonedUp] Ready. Onboarding:", settings.onboardingComplete);
      SplashScreen.hideAsync();
      if (!settings.onboardingComplete) {
        setTimeout(() => router.replace("/onboarding"), 100);
      }
    }
  }, [loaded, ready]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <>
      <StatusBar style={themeKey === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerBackTitle: "Back", animation: "default", contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="equipment/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="equipment/add" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="equipment/edit/[id]" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="task/add" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="task/add-bulk" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="task/edit/[id]" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
      </Stack>
    </>
  );
}

function RootLayoutNav() {
  return <ButtonedUpNav />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DataProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </DataProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
