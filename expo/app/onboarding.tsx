import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useData } from "@/providers/DataProvider";
import { useTheme } from "@/providers/ThemeProvider";
import AreaCreationFlow from "@/components/AreaCreationFlow";

export default function WelcomeOnboarding() {
  const { colors } = useTheme();
  const { updateSettings } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<0 | 1>(0);

  const start = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(1);
  }, []);

  const done = useCallback(() => {
    updateSettings({ onboardingComplete: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  }, [updateSettings, router]);

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {step === 0 ? (
        <View style={s.center}>
          <Text style={s.bigEmoji}>🔧</Text>
          <Text style={[s.bigTitle, { color: colors.text }]}>Buttoned Up</Text>
          <Text style={[s.bigSub, { color: colors.textSecondary }]}>
            Track the routines that keep everything running.
          </Text>
          <TouchableOpacity
            testID="start"
            style={[s.btn, { backgroundColor: colors.accent }]}
            onPress={start}
            activeOpacity={0.8}
          >
            <Text style={s.btnT}>Let&apos;s Get Started</Text>
            <ChevronRight size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <AreaCreationFlow onDone={done} />
      )}
      <View style={{ height: insets.bottom + 20 }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  bigEmoji: { fontSize: 72, marginBottom: 16 },
  bigTitle: { fontSize: 36, fontWeight: "800" as const, letterSpacing: -0.8, marginBottom: 8 },
  bigSub: { fontSize: 17, textAlign: "center", lineHeight: 24, marginBottom: 40 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 6,
    alignSelf: "stretch",
  },
  btnT: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
