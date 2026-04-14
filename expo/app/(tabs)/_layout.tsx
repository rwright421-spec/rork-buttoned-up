import { Tabs } from "expo-router";
import { Home, Settings } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export default function MainTabLayout() {
  const { colors } = useTheme();
  const tabBarStyle = StyleSheet.flatten([
    { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5, elevation: 0, shadowOpacity: 0 },
    Platform.OS === "web" ? { height: 60 } : {},
  ]);
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.textSecondary, tabBarStyle, tabBarLabelStyle: { fontSize: 11, fontWeight: "500" as const } }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={1.8} /> }} />
    </Tabs>
  );
}
