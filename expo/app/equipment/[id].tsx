import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getDueText, formatDate, statusSortKey } from "@/utils/dates";
import { TaskStatus } from "@/constants/types";
const SC: Record<TaskStatus, string> = { overdue: "#EF4444", due_soon: "#F59E0B", current: "#22C55E", not_started: "#9CA3AF" };
export default function EquipmentView() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { colors } = useTheme();
  const { equipment, tasks, deleteEquipment } = useData(); const router = useRouter(); const insets = useSafeAreaInsets();
  const eq = equipment.find(e => e.id === id);
  const eqTasks = useMemo(() => tasks.filter(t => t.equipmentId === id).map(t => ({ ...t, status: getTaskStatus(t), dueText: getDueText(t) })).sort((a, b) => statusSortKey(a.status) - statusSortKey(b.status)), [tasks, id]);
  const del = useCallback(() => { if (!eq) return; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(`Delete ${eq.name}?`, "This will permanently delete all its tasks and history.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { deleteEquipment(eq.id); router.back(); } }]);
  }, [eq, deleteEquipment, router]);
  if (!eq) return <View style={[st.c, { backgroundColor: colors.background, paddingTop: insets.top }]}><Text style={[st.nf, { color: colors.textSecondary }]}>Equipment not found</Text></View>;
  return (
    <View style={[st.c, { backgroundColor: colors.background }]}>
      <View style={[st.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.back} activeOpacity={0.6}><ArrowLeft size={24} color={colors.text} /></TouchableOpacity>
        <View style={st.hc}><Text style={st.he}>{eq.emoji}</Text><Text style={[st.ht, { color: colors.text }]} numberOfLines={1}>{eq.name}</Text></View>
        <View style={st.ha}><TouchableOpacity onPress={() => router.push(`/equipment/edit/${eq.id}`)} activeOpacity={0.6}><Pencil size={20} color={colors.textSecondary} /></TouchableOpacity>
          <TouchableOpacity onPress={del} activeOpacity={0.6}><Trash2 size={20} color="#EF4444" /></TouchableOpacity></View>
      </View>
      {eqTasks.length === 0 ? <View style={st.empty}><Text style={[st.et, { color: colors.text }]}>No tasks yet.</Text><Text style={[st.eb, { color: colors.textSecondary }]}>Tap + Add Task to get started.</Text></View>
      : <ScrollView style={st.sc} contentContainerStyle={[st.si, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          {eqTasks.map(t => <TouchableOpacity key={t.id} testID={`tr-${t.id}`} style={[st.tc, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/task/${t.id}`); }} activeOpacity={0.7}>
            <View style={[st.sd, { backgroundColor: SC[t.status] }]} /><View style={st.ti}><Text style={[st.tn, { color: colors.text }]}>{t.name}</Text><Text style={[st.td, { color: SC[t.status] }]}>{t.dueText}</Text>
              {t.lastCompletedDate && <Text style={[st.tl, { color: colors.textSecondary }]}>Last: {formatDate(t.lastCompletedDate)}</Text>}</View>
          </TouchableOpacity>)}
        </ScrollView>}
      <View style={[st.bb, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity testID="add-task" style={[st.ab, { backgroundColor: colors.accent }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(`/task/add?equipmentId=${eq.id}`); }} activeOpacity={0.8}>
          <Plus size={20} color="#FFF" strokeWidth={2.5} /><Text style={st.at}>Add Task</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1 }, h: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  back: { padding: 4 }, hc: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  he: { fontSize: 24 }, ht: { fontSize: 20, fontWeight: "700" as const, flex: 1 }, ha: { flexDirection: "row", gap: 16 },
  sc: { flex: 1 }, si: { paddingHorizontal: 20, gap: 8 },
  tc: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  sd: { width: 10, height: 10, borderRadius: 5 }, ti: { flex: 1 },
  tn: { fontSize: 16, fontWeight: "600" as const, marginBottom: 2 }, td: { fontSize: 13, fontWeight: "500" as const }, tl: { fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  et: { fontSize: 18, fontWeight: "600" as const, marginBottom: 6 }, eb: { fontSize: 14, textAlign: "center" },
  bb: { paddingHorizontal: 20, paddingTop: 12 },
  ab: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 50, borderRadius: 14, gap: 8 },
  at: { color: "#FFF", fontSize: 16, fontWeight: "600" as const }, nf: { fontSize: 16, textAlign: "center", marginTop: 100 },
});
