import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { IntervalUnit } from "@/constants/types";

const UNITS: IntervalUnit[] = ["days", "weeks", "months", "years"];

export default function NewTaskForm() {
  const { thingId } = useLocalSearchParams<{ thingId: string }>();
  const { colors } = useTheme();
  const { addTask } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [iv, setIv] = useState("3");
  const [iu, setIu] = useState<IntervalUnit>("months");
  const [notes, setNotes] = useState("");

  const save = useCallback(() => {
    if (!name.trim() || !thingId) return;
    addTask({ thingId, name: name.trim(), intervalValue: parseInt(iv, 10) || 1, intervalUnit: iu, lastCompletedDate: null, notes: notes.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, iv, iu, notes, thingId, addTask, router]);

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Add Task</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.f} keyboardShouldPersistTaps="handled">
          <Text style={[s.l, { color: colors.textSecondary }]}>Task Name</Text>
          <TextInput testID="task-name" style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="e.g. Oil Change" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} autoFocus />
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Interval</Text>
          <View style={s.ir}>
            <TextInput style={[s.ii, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} keyboardType="number-pad" value={iv} onChangeText={setIv} />
            <View style={s.ur}>{UNITS.map(u => { const a = iu === u; return (
              <TouchableOpacity key={u} style={[s.uc, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]} onPress={() => setIu(u)} activeOpacity={0.7}>
                <Text style={[s.ut, { color: a ? "#FFF" : colors.text }]}>{u}</Text>
              </TouchableOpacity>); })}</View>
          </View>
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Notes (optional)</Text>
          <TextInput style={[s.i, s.ni, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="Details..." placeholderTextColor={colors.textSecondary} value={notes} onChangeText={setNotes} multiline />
          <TouchableOpacity testID="save-task" style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}><Text style={s.st}>Save Task</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  ht: { fontSize: 18, fontWeight: "700" as const },
  f: { paddingHorizontal: 20, paddingBottom: 40 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  ni: { height: 80, paddingTop: 14, textAlignVertical: "top" },
  ir: { gap: 12 },
  ii: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, width: 80 },
  ur: { flexDirection: "row", gap: 8 },
  uc: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  ut: { fontSize: 14, fontWeight: "500" as const },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 },
  st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
