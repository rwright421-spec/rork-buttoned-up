import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { ThemeKey } from "@/constants/types";
import { themeLabels, themePreviewColors } from "@/constants/themes";

const ALL_THEMES: ThemeKey[] = ["clean", "dark", "warm", "ocean"];
const REMINDER_DAYS = [1, 3, 7, 14];

export default function AppSettingsScreen() {
  const { colors, themeKey, setTheme } = useTheme();
  const { settings, updateSettings, resetAllData } = useData();
  const insets = useSafeAreaInsets();
  const confirmReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Reset All Data", "This will permanently delete all equipment, tasks, and history. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Everything", style: "destructive", onPress: () => { resetAllData(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  };
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}><Text style={[styles.heading, { color: colors.text }]}>Settings</Text></View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>THEME</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ALL_THEMES.map((key, idx) => { const p = themePreviewColors[key]; const a = themeKey === key; return (
            <TouchableOpacity key={key} testID={`theme-${key}`} style={[styles.themeRow, idx < ALL_THEMES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]} onPress={() => { setTheme(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.6}>
              <View style={[styles.swatch, { backgroundColor: p.bg, borderColor: colors.border }]}><View style={[styles.swI, { backgroundColor: p.card }]} /><View style={[styles.swD, { backgroundColor: p.accent }]} /></View>
              <Text style={[styles.themeLabel, { color: colors.text }]}>{themeLabels[key]}</Text>
              {a && <Check size={20} color={colors.accent} strokeWidth={2.5} />}
            </TouchableOpacity>
          ); })}
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchRow}><Text style={[styles.switchLabel, { color: colors.text }]}>Enable Reminders</Text>
            <Switch value={settings.notifications.enabled} onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, enabled: v } })} trackColor={{ true: colors.accent, false: colors.border }} />
          </View>
          {settings.notifications.enabled && (<><View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={styles.daysWrap}><Text style={[styles.daysTitle, { color: colors.textSecondary }]}>Remind me before due</Text>
              <View style={styles.chips}>{REMINDER_DAYS.map((d) => { const on = settings.notifications.daysBefore === d; return (
                <TouchableOpacity key={d} style={[styles.chip, { backgroundColor: on ? colors.accent : colors.background, borderColor: on ? colors.accent : colors.border }]} onPress={() => updateSettings({ notifications: { ...settings.notifications, daysBefore: d } })} activeOpacity={0.7}>
                  <Text style={[styles.chipText, { color: on ? "#FFF" : colors.text }]}>{d} {d === 1 ? "day" : "days"}</Text>
                </TouchableOpacity>); })}</View></View></>)}
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>DATA</Text>
        <TouchableOpacity testID="reset-btn" style={[styles.group, styles.dangerRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={confirmReset} activeOpacity={0.6}>
          <Trash2 size={18} color="#EF4444" strokeWidth={2} /><Text style={styles.dangerLabel}>Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, topBar: { paddingHorizontal: 20, paddingBottom: 16 },
  heading: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.6 }, scroll: { flex: 1 }, scrollInner: { paddingHorizontal: 20 },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.8, marginBottom: 8, marginTop: 28, marginLeft: 4 },
  group: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  themeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  swatch: { width: 42, height: 30, borderRadius: 7, borderWidth: 1, padding: 4, flexDirection: "row", alignItems: "flex-end", gap: 3, marginRight: 14 },
  swI: { flex: 1, height: 13, borderRadius: 3 }, swD: { width: 9, height: 9, borderRadius: 5 }, themeLabel: { flex: 1, fontSize: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16 },
  switchLabel: { fontSize: 16 }, line: { height: StyleSheet.hairlineWidth },
  daysWrap: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 }, daysTitle: { fontSize: 13 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 }, chipText: { fontSize: 14, fontWeight: "500" as const },
  dangerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  dangerLabel: { fontSize: 16, fontWeight: "600" as const, color: "#EF4444" },
});
