import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { IntervalUnit } from "@/constants/types";
const UNITS: IntervalUnit[] = ["days","weeks","months","years"];
export default function ModifyTask() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { colors } = useTheme();
  const { tasks, updateTask } = useData(); const router = useRouter(); const insets = useSafeAreaInsets();
  const task = tasks.find(t => t.id === id);
  const [name, setName] = useState(task?.name ?? ""); const [iv, setIv] = useState(String(task?.intervalValue ?? 3));
  const [iu, setIu] = useState<IntervalUnit>(task?.intervalUnit ?? "months"); const [notes, setNotes] = useState(task?.notes ?? "");
  const [lastDate, setLastDate] = useState<Date | null>(task?.lastCompletedDate ? new Date(task.lastCompletedDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const save = useCallback(() => { if (!name.trim() || !id) return;
    updateTask(id, { name: name.trim(), intervalValue: parseInt(iv, 10) || 1, intervalUnit: iu, notes: notes.trim(), lastCompletedDate: lastDate ? lastDate.toISOString() : null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back();
  }, [name, iv, iu, notes, id, lastDate, updateTask, router]);
  if (!task) return null;
  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}><TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity><Text style={[s.ht, { color: colors.text }]}>Edit Task</Text><View style={{ width: 24 }} /></View>
      <ScrollView contentContainerStyle={s.f} keyboardShouldPersistTaps="handled">
        <Text style={[s.l, { color: colors.textSecondary }]}>Task Name</Text>
        <TextInput style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} />
        <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Interval</Text>
        <View style={s.ir}><TextInput style={[s.ii, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} keyboardType="number-pad" value={iv} onChangeText={setIv} />
          <View style={s.ur}>{UNITS.map(u => { const a = iu === u; return (
            <TouchableOpacity key={u} style={[s.uc, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]} onPress={() => setIu(u)} activeOpacity={0.7}>
              <Text style={[s.ut, { color: a ? "#FFF" : colors.text }]}>{u}</Text></TouchableOpacity>); })}</View></View>
        <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Last Completed Date</Text>
        <TouchableOpacity style={[s.db, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <Calendar size={18} color={colors.textSecondary} />
          <Text style={[s.dt, { color: lastDate ? colors.text : colors.textSecondary }]}>{lastDate ? lastDate.toLocaleDateString() : "Not set"}</Text>
          {lastDate && <TouchableOpacity onPress={() => { setLastDate(null); setShowDatePicker(false); }} hitSlop={8}><X size={16} color={colors.textSecondary} /></TouchableOpacity>}
        </TouchableOpacity>
        {showDatePicker && (Platform.OS === 'web' ? (
          <input type="date" value={lastDate ? lastDate.toISOString().split('T')[0] : ''} onChange={(e) => { const v = e.target.value; if (v) { setLastDate(new Date(v + 'T12:00:00')); } setShowDatePicker(false); }} style={{ height: 44, fontSize: 16, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '0 16px', marginTop: 8, backgroundColor: colors.card, color: colors.text }} />
        ) : (
          <DateTimePicker value={lastDate ?? new Date()} mode="date" display="spinner" maximumDate={new Date()} onChange={(_, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setLastDate(d); }} />
        ))}
        <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Notes</Text>
        <TextInput style={[s.i, s.ni, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={notes} onChangeText={setNotes} multiline />
        <TouchableOpacity style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}><Text style={s.st}>Save Changes</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1 }, h: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  ht: { fontSize: 18, fontWeight: "700" as const }, f: { paddingHorizontal: 20, paddingBottom: 40 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 }, ni: { height: 80, paddingTop: 14, textAlignVertical: "top" },
  ir: { gap: 12 }, ii: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, width: 80 },
  ur: { flexDirection: "row", gap: 8 }, uc: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  ut: { fontSize: 14, fontWeight: "500" as const },
  db: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  dt: { flex: 1, fontSize: 16 },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 }, st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
