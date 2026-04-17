import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, X, GripVertical, Check, ArrowUp, ArrowDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getWorstStatus } from "@/utils/dates";
import { TaskStatus, Area } from "@/constants/types";
import AreaCreationFlow from "@/components/AreaCreationFlow";

const STATUS_LABELS: Record<TaskStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due Soon",
  current: "All Current",
  not_started: "Not Started",
};

function resolveStatusColor(
  status: TaskStatus,
  c: { overdue: string; dueSoon: string; current: string; notStarted: string }
): string {
  switch (status) {
    case "overdue": return c.overdue;
    case "due_soon": return c.dueSoon;
    case "current": return c.current;
    case "not_started": return c.notStarted;
  }
}

interface EnrichedArea extends Area {
  worstStatus: TaskStatus;
  overdueCount: number;
  thingCount: number;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { areas, things, tasks, reorderAreas } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const enriched = useMemo<EnrichedArea[]>(() => {
    return [...areas]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((a) => {
        const areaThings = things.filter((t) => t.areaId === a.id);
        const thingIds = new Set(areaThings.map((t) => t.id));
        const areaTasks = tasks.filter((t) => thingIds.has(t.thingId));
        const statuses = areaTasks.map(getTaskStatus);
        const worst = getWorstStatus(statuses);
        const overdueCount = statuses.filter((s) => s === "overdue").length;
        return { ...a, worstStatus: worst, overdueCount, thingCount: areaThings.length };
      });
  }, [areas, things, tasks]);

  const openCreateArea = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAreaModal(true);
  }, []);

  const onAreaCreated = useCallback((area: Area) => {
    setShowAreaModal(false);
    router.push(`/area/${area.id}`);
  }, [router]);

  const moveArea = useCallback((index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= enriched.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const swapped = [...enriched];
    [swapped[index], swapped[newIndex]] = [swapped[newIndex], swapped[index]];
    reorderAreas(swapped);
  }, [enriched, reorderAreas]);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>My Setup</Text>
          {enriched.length > 0 && (
            <Text style={[s.meta, { color: colors.textSecondary }]}>
              {enriched.length} {enriched.length === 1 ? "Area" : "Areas"}
            </Text>
          )}
        </View>
        <View style={s.topActions}>
          {enriched.length > 1 && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: isReordering ? colors.accent : colors.card, borderColor: isReordering ? colors.accent : colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsReordering(p => !p); }}
              activeOpacity={0.7}
            >
              {isReordering ? <Check size={18} color="#FFF" strokeWidth={2.5} /> : <GripVertical size={18} color={colors.textSecondary} />}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="add-area-btn"
            style={[s.fab, { backgroundColor: colors.accent }]}
            onPress={openCreateArea}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {enriched.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔧</Text>
          <Text style={[s.emptyH, { color: colors.text }]}>Nothing to maintain yet.</Text>
          <Text style={[s.emptyB, { color: colors.textSecondary }]}>
            Tap + to create your first Area — like Home, Garage, or Cabin.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollInner, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {enriched.map((a, i) => {
            const bc = resolveStatusColor(a.worstStatus, colors);
            return (
              <View key={a.id} style={s.rowWrap}>
                {isReordering && (
                  <View style={s.reorderControls}>
                    <TouchableOpacity
                      onPress={() => moveArea(i, "up")}
                      style={[s.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      disabled={i === 0}
                      activeOpacity={0.6}
                    >
                      <ArrowUp size={16} color={i === 0 ? colors.border : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveArea(i, "down")}
                      style={[s.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      disabled={i === enriched.length - 1}
                      activeOpacity={0.6}
                    >
                      <ArrowDown size={16} color={i === enriched.length - 1 ? colors.border : colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  testID={`area-${a.id}`}
                  style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    if (isReordering) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/area/${a.id}`);
                  }}
                  activeOpacity={isReordering ? 1 : 0.7}
                >
                  <View style={s.cardTop}>
                    <Text style={s.cardEmoji}>{a.emoji}</Text>
                    <View style={[s.statusDot, { backgroundColor: bc }]} />
                  </View>
                  <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>{a.name}</Text>
                  <View style={s.cardMeta}>
                    <Text style={[s.cardMetaText, { color: colors.textSecondary }]}>
                      {a.thingCount} {a.thingCount === 1 ? "Thing" : "Things"}
                    </Text>
                    {a.overdueCount > 0 && (
                      <>
                        <Text style={[s.cardMetaDot, { color: colors.textSecondary }]}>·</Text>
                        <Text style={[s.cardMetaText, { color: colors.overdue, fontWeight: "600" as const }]}>
                          {a.overdueCount} overdue
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={[s.pill, { backgroundColor: bc + "14", alignSelf: "flex-start" as const, marginTop: 8 }]}>
                    <Text style={[s.pillT, { color: bc }]}>{STATUS_LABELS[a.worstStatus]}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={showAreaModal} animationType="slide" onRequestClose={() => setShowAreaModal(false)} presentationStyle="pageSheet">
        <View style={[s.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
          <View style={s.sheetHeader}>
            <Text style={[s.sheetTitle, { color: colors.text }]}>New Area</Text>
            <TouchableOpacity onPress={() => setShowAreaModal(false)} style={s.sheetClose} activeOpacity={0.6}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <AreaCreationFlow onDone={onAreaCreated} onCancel={() => setShowAreaModal(false)} />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.6 },
  meta: { fontSize: 14, marginTop: 2 },
  topActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  actionBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  fab: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, gap: 12 },
  rowWrap: { flexDirection: "row", alignItems: "center" },
  reorderControls: { flexDirection: "column", gap: 4, marginRight: 8 },
  reorderBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  card: { flex: 1, borderRadius: 16, padding: 18, borderWidth: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardEmoji: { fontSize: 42 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  cardName: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  cardMetaText: { fontSize: 14 },
  cardMetaDot: { fontSize: 14 },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillT: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyH: { fontSize: 20, fontWeight: "600" as const, marginBottom: 8, textAlign: "center" },
  emptyB: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  sheet: { flex: 1 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700" as const },
  sheetClose: { padding: 6 },
});
