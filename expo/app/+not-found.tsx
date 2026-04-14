import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MissingScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops" }} />
      <View style={styles.wrap}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.desc}>This screen doesn't exist in Buttoned Up.</Text>
        <Link href="/" style={styles.action}>Go back home</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFFFFF" },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700" as const, marginBottom: 6, color: "#1A1A1A" },
  desc: { fontSize: 15, textAlign: "center", marginBottom: 20, lineHeight: 22, color: "#6B7280" },
  action: { fontSize: 16, fontWeight: "600" as const, color: "#2563EB" },
});
