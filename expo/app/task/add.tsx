import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { Schedule } from "@/constants/types";
import ScheduleEditor from "@/components/ScheduleEditor";
import CalendarPicker from "@/components/CalendarPicker";

export default function NewTaskForm() {
  const { thingId } = useLocalSearchParams<{ thingId: string }>();
  const { colors } = useTheme();
  const { addTask, addCompletionLog } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState<Schedule>({ kind: "interval_from_completion", intervalValue: 3, intervalUnit: "months" });
  const [notes, setNotes] = useState("");
  const [lastDone, setLastDone] = useState<Date | null>(null);
  const [showLastPicker, setShowLastPicker] = useState(false);

  const save = useCallback(() => {
    if (!name.trim() || !thingId) return;
    const last = lastDone ? lastDone.toISOString() : null;
    const created = addTask({
      thingId,
      name: name.trim(),
      schedule,
      notes: notes.trim(),
      lastCompletedDate: last,
    });
    if (last) {
      addCompletionLog(created.id, last, "");
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, schedule, notes, thingId, addTask, addCompletionLog, lastDone, router]);

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Add Task</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[s.f, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <Text style={[s.l, { color: colors.textSecondary }]}>Task Name</Text>
          <TextInput testID="task-name" style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="e.g. Oil Change" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} autoFocus />

          <View style={{ marginTop: 20 }}>
            <ScheduleEditor schedule={schedule} onChange={setSchedule} />
          </View>

          <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>When was this last done? (optional)</Text>
          <TouchableOpacity
            style={[s.db, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowLastPicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={colors.textSecondary} />
            <Text style={[s.dt, { color: lastDone ? colors.text : colors.textSecondary }]}>
              {lastDone ? lastDone.toLocaleDateString() : "Not set"}
            </Text>
            {lastDone && (
              <TouchableOpacity onPress={() => setLastDone(null)} hitSlop={8}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <CalendarPicker
            visible={showLastPicker}
            initialDate={lastDone}
            maxDate={new Date()}
            title="Last completed"
            onClose={() => setShowLastPicker(false)}
            onSelect={(d) => { setLastDone(d); setShowLastPicker(false); }}
          />

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
  f: { paddingHorizontal: 20 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  ni: { height: 80, paddingTop: 14, textAlignVertical: "top" },
  db: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  dt: { flex: 1, fontSize: 16 },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 },
  st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
