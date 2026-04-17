import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Calendar, Plus, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { Schedule } from "@/constants/types";
import { computeAllUpcomingDue } from "@/utils/dates";
import ScheduleEditor from "@/components/ScheduleEditor";
import CalendarPicker from "@/components/CalendarPicker";

export default function ModifyTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { tasks, updateTask } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const task = tasks.find(t => t.id === id);

  const [name, setName] = useState(task?.name ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [schedule, setSchedule] = useState<Schedule>(
    task?.schedule ?? { kind: "interval_from_completion", intervalValue: 3, intervalUnit: "months" }
  );
  const [dueDates, setDueDates] = useState<string[]>(task?.dueDates ?? []);
  const [addPickerVisible, setAddPickerVisible] = useState(false);

  const onScheduleChange = useCallback((next: Schedule) => {
    setSchedule(next);
    const upcoming = computeAllUpcomingDue(next, task?.lastCompletedDate ?? null, 1).map(d => d.toISOString());
    setDueDates(upcoming);
  }, [task]);

  const removeDate = useCallback((iso: string) => {
    setDueDates(prev => prev.filter(d => d !== iso));
  }, []);

  const save = useCallback(() => {
    if (!name.trim() || !id) return;
    const sorted = [...dueDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    updateTask(id, { name: name.trim(), notes: notes.trim(), schedule, dueDates: sorted });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, id, notes, schedule, dueDates, updateTask, router]);

  if (!task) return null;

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Edit Task</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[s.f, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <Text style={[s.l, { color: colors.textSecondary }]}>Task Name</Text>
          <TextInput style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} />

          <View style={{ marginTop: 20 }}>
            <ScheduleEditor schedule={schedule} onChange={onScheduleChange} />
          </View>

          <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Upcoming due dates</Text>
          {dueDates.length === 0 && <Text style={[s.empty, { color: colors.textSecondary }]}>No dates yet</Text>}
          {[...dueDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map((d) => (
            <View key={d} style={[s.dueRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[s.dueText, { color: colors.text }]}>{new Date(d).toLocaleDateString()}</Text>
              <TouchableOpacity onPress={() => removeDate(d)} hitSlop={8}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[s.addDateBtn, { borderColor: colors.border }]}
            onPress={() => setAddPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Plus size={16} color={colors.text} />
            <Text style={[s.addDateText, { color: colors.text }]}>Add another due date</Text>
          </TouchableOpacity>
          <CalendarPicker
            visible={addPickerVisible}
            title="Add due date"
            onClose={() => setAddPickerVisible(false)}
            onSelect={(d) => {
              const iso = d.toISOString();
              setDueDates(prev => prev.includes(iso) ? prev : [...prev, iso]);
              setAddPickerVisible(false);
            }}
          />

          <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Notes</Text>
          <TextInput style={[s.i, s.ni, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={notes} onChangeText={setNotes} multiline />
          <TouchableOpacity style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}>
            <Text style={s.st}>Save Changes</Text>
          </TouchableOpacity>
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
  empty: { fontSize: 13, paddingVertical: 6 },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  dueText: { flex: 1, fontSize: 15 },
  addDateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: "dashed" as const, marginTop: 4 },
  addDateText: { fontSize: 14, fontWeight: "500" as const },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 },
  st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
