import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getWorstStatus, statusSortKey } from "@/utils/dates";
import { TaskStatus } from "@/constants/types";

const STATUS_LABELS: Record<TaskStatus, string> = { overdue: "Overdue", due_soon: "Due Soon", current: "All Current", not_started: "Not Started" };

function resolveStatusColor(status: TaskStatus, c: { overdue: string; dueSoon: string; current: string; notStarted: string }): string {
  switch (status) { case "overdue": return c.overdue; case "due_soon": return c.dueSoon; case "current": return c.current; case "not_started": return c.notStarted; }
}

export default function MainHomeScreen() {
  const { colors } = useTheme();
  const { equipment, tasks } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sorted = useMemo(() => equipment.map((eq) => {
    const et = tasks.filter((t) => t.equipmentId === eq.id); const st = et.map(getTaskStatus); const ws = getWorstStatus(st);
    const cn: Record<TaskStatus, number> = { overdue: 0, due_soon: 0, current: 0, not_started: 0 }; st.forEach((s) => cn[s]++);
    return { ...eq, worstStatus: ws, counts: cn, taskCount: et.length };
  }).sort((a, b) => statusSortKey(a.worstStatus) - statusSortKey(b.worstStatus)), [equipment, tasks]);
  const onAdd = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/equipment/add"); }, [router]);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Buttoned Up</Text>
          {sorted.length > 0 && <Text style={[styles.meta, { color: colors.textSecondary }]}>{equipment.length} {equipment.length === 1 ? "item" : "items"} tracked</Text>}
        </View>
        <TouchableOpacity testID="add-equipment-btn" style={[styles.fab, { backgroundColor: colors.accent }]} onPress={onAdd} activeOpacity={0.7}>
          <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      {sorted.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyIcon}>🔧</Text><Text style={[styles.emptyH, { color: colors.text }]}>Nothing to maintain yet.</Text><Text style={[styles.emptyB, { color: colors.textSecondary }]}>Tap + to add your first piece of equipment.</Text></View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          {sorted.map((eq) => { const bc = resolveStatusColor(eq.worstStatus, colors); return (
            <TouchableOpacity key={eq.id} testID={`eq-${eq.id}`} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/equipment/${eq.id}`); }} activeOpacity={0.7}>
              <View style={styles.row}>
                <View style={styles.iconBox}><Text style={styles.emoji}>{eq.emoji}</Text></View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{eq.name}</Text>
                  <Text style={[styles.taskNum, { color: colors.textSecondary }]}>{eq.taskCount} {eq.taskCount === 1 ? "task" : "tasks"}</Text>
                  {eq.taskCount > 0 && <View style={styles.statusRow}>
                    {eq.counts.overdue > 0 && <Text style={[styles.st, { color: colors.overdue }]}>{eq.counts.overdue} overdue</Text>}
                    {eq.counts.due_soon > 0 && <Text style={[styles.st, { color: colors.dueSoon }]}>{eq.counts.overdue > 0 ? " \u00b7 " : ""}{eq.counts.due_soon} due soon</Text>}
                    {eq.counts.current > 0 && <Text style={[styles.st, { color: colors.current }]}>{(eq.counts.overdue > 0 || eq.counts.due_soon > 0) ? " \u00b7 " : ""}{eq.counts.current} current</Text>}
                  </View>}
                </View>
                <View style={[styles.pill, { backgroundColor: bc + "14" }]}><View style={[styles.dot, { backgroundColor: bc }]} /><Text style={[styles.pillT, { color: bc }]}>{STATUS_LABELS[eq.worstStatus]}</Text></View>
              </View>
            </TouchableOpacity>
          ); })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.6 }, meta: { fontSize: 14, marginTop: 2 },
  fab: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginTop: 4 },
  scroll: { flex: 1 }, scrollInner: { paddingHorizontal: 20, gap: 12 }, card: { borderRadius: 14, padding: 16, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  emoji: { fontSize: 34 }, info: { flex: 1, marginRight: 8, paddingTop: 2 },
  name: { fontSize: 17, fontWeight: "600" as const, marginBottom: 2 }, taskNum: { fontSize: 13, marginBottom: 4 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" }, st: { fontSize: 12, fontWeight: "500" as const },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 }, pillT: { fontSize: 11, fontWeight: "600" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 }, emptyH: { fontSize: 20, fontWeight: "600" as const, marginBottom: 8, textAlign: "center" },
  emptyB: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
