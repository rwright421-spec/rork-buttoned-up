import React, { useMemo, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown, Check, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getWorstStatus } from "@/utils/dates";
import { TaskStatus, Thing } from "@/constants/types";
import EmojiPicker from "@/components/EmojiPicker";
import SwipeableCard from "@/components/SwipeableCard";

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

interface EnrichedThing extends Thing {
  worstStatus: TaskStatus;
  counts: Record<TaskStatus, number>;
  taskCount: number;
}

export default function AreaView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { areas, things, tasks, reorderThings, updateArea, deleteArea, deleteThing } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isReordering, setIsReordering] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("📁");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const area = areas.find(a => a.id === id);

  const enriched = useMemo<EnrichedThing[]>(() => {
    return things
      .filter(t => t.areaId === id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(th => {
        const et = tasks.filter(t => t.thingId === th.id);
        const st = et.map(getTaskStatus);
        const ws = getWorstStatus(st);
        const cn: Record<TaskStatus, number> = { overdue: 0, due_soon: 0, current: 0, not_started: 0 };
        st.forEach(s => cn[s]++);
        return { ...th, worstStatus: ws, counts: cn, taskCount: et.length };
      });
  }, [things, tasks, id]);

  const moveThing = useCallback((index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= enriched.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const swapped = [...enriched];
    [swapped[index], swapped[newIndex]] = [swapped[newIndex], swapped[index]];
    const newOrders = new Map<string, number>();
    swapped.forEach((t, i) => newOrders.set(t.id, i));
    const updated = things.map(t => {
      const no = newOrders.get(t.id);
      return no !== undefined ? { ...t, sortOrder: no } : t;
    });
    reorderThings(updated);
  }, [enriched, things, reorderThings]);

  const openEdit = useCallback(() => {
    if (!area) return;
    setEditName(area.name);
    setEditEmoji(area.emoji ?? "📁");
    setShowEdit(true);
  }, [area]);

  const saveEdit = useCallback(() => {
    if (!area || !editName.trim()) return;
    updateArea(area.id, { name: editName.trim(), emoji: editEmoji });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEdit(false);
  }, [area, editName, editEmoji, updateArea]);

  const del = useCallback(() => {
    if (!area) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const thingCount = things.filter(t => t.areaId === area.id).length;
    const message = thingCount === 0
      ? "This Area has no Things. This cannot be undone."
      : `This will permanently delete this Area and all ${thingCount} ${thingCount === 1 ? 'Thing' : 'Things'} inside it. This cannot be undone.`;
    Alert.alert(`Delete ${area.name}?`, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteArea(area.id); router.back(); } },
    ]);
  }, [area, things, deleteArea, router]);

  if (!area) return (
    <View style={[s.c, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[s.nf, { color: colors.textSecondary }]}>Area not found</Text>
    </View>
  );

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.back} activeOpacity={0.6}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={s.hc}>
          <Text style={s.he}>{area.emoji}</Text>
          <Text style={[s.ht, { color: colors.text }]} numberOfLines={1}>{area.name}</Text>
        </View>
        <View style={s.ha}>
          {enriched.length > 0 && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsReordering(p => !p); }} activeOpacity={0.6}>
              {isReordering ? (
                <View style={[s.doneBtn, { backgroundColor: colors.accent }]}>
                  <Check size={16} color="#FFF" strokeWidth={2.5} />
                </View>
              ) : (
                <GripVertical size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openEdit} activeOpacity={0.6}>
            <Pencil size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={del} activeOpacity={0.6}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {enriched.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>{area.emoji}</Text>
          <Text style={[s.emptyH, { color: colors.text }]}>No Things in this Area yet.</Text>
          <Text style={[s.emptyB, { color: colors.textSecondary }]}>Tap + Add Thing to start tracking.</Text>
        </View>
      ) : (
        <ScrollView
          style={s.sc}
          contentContainerStyle={[s.si, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {enriched.map((th, i) => {
            const bc = resolveStatusColor(th.worstStatus, colors);
            const card = (
              <View key={th.id} style={s.cardWrapper}>
                {isReordering && (
                  <View style={s.reorderControls}>
                    <TouchableOpacity
                      onPress={() => moveThing(i, "up")}
                      style={[s.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      disabled={i === 0}
                      activeOpacity={0.6}
                    >
                      <ArrowUp size={16} color={i === 0 ? colors.border : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveThing(i, "down")}
                      style={[s.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      disabled={i === enriched.length - 1}
                      activeOpacity={0.6}
                    >
                      <ArrowDown size={16} color={i === enriched.length - 1 ? colors.border : colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  testID={`thing-${th.id}`}
                  style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    if (isReordering) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/thing/${th.id}`);
                  }}
                  activeOpacity={isReordering ? 1 : 0.7}
                >
                  <View style={s.row}>
                    <View style={s.iconBox}>
                      <Text style={s.emoji}>{th.emoji}</Text>
                    </View>
                    <View style={s.info}>
                      <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>{th.name}</Text>
                      <Text style={[s.taskNum, { color: colors.textSecondary }]}>
                        {th.taskCount} {th.taskCount === 1 ? "task" : "tasks"}
                      </Text>
                      {th.taskCount > 0 && (
                        <View style={s.statusRow}>
                          {th.counts.overdue > 0 && (
                            <Text style={[s.st, { color: colors.overdue }]}>
                              {th.counts.overdue} overdue
                            </Text>
                          )}
                          {th.counts.due_soon > 0 && (
                            <Text style={[s.st, { color: colors.dueSoon }]}>
                              {th.counts.overdue > 0 ? " · " : ""}
                              {th.counts.due_soon} due soon
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    {!isReordering && (
                      <View style={[s.pill, { backgroundColor: bc + "14" }]}>
                        <View style={[s.dot, { backgroundColor: bc }]} />
                        <Text style={[s.pillT, { color: bc }]}>{STATUS_LABELS[th.worstStatus]}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
            if (isReordering) return card;
            return (
              <SwipeableCard
                key={th.id}
                onDelete={() => deleteThing(th.id)}
                confirmTitle={`Delete "${th.name}"?`}
                confirmMessage="All Tasks on this Thing will also be deleted."
                testID={`swipe-thing-${th.id}`}
              >
                {card}
              </SwipeableCard>
            );
          })}
        </ScrollView>
      )}

      <View style={[s.bb, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity
          testID="add-thing"
          style={[s.ab, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/thing/add?areaId=${area.id}`);
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFF" strokeWidth={2.5} />
          <Text style={s.at}>Add Thing</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowEdit(false)}>
          <TouchableOpacity activeOpacity={1} style={[s.modalContent, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Edit Area</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={s.groupEmojiRow}>
              <TouchableOpacity
                style={[s.groupEmojiBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => { setShowEdit(false); setTimeout(() => setShowEmojiPicker(true), 300); }}
                activeOpacity={0.7}
              >
                <Text style={s.groupEmojiBtnText}>{editEmoji}</Text>
              </TouchableOpacity>
              <TextInput
                style={[s.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, flex: 1 }]}
                placeholder="Area name..."
                placeholderTextColor={colors.textSecondary}
                value={editName}
                onChangeText={setEditName}
              />
            </View>
            <TouchableOpacity
              style={[s.modalSave, { backgroundColor: editName.trim() ? colors.accent : colors.border }]}
              onPress={saveEdit}
              disabled={!editName.trim()}
              activeOpacity={0.8}
            >
              <Text style={s.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => { setShowEmojiPicker(false); setShowEdit(true); }}
        onSelect={(em) => { setEditEmoji(em); setShowEmojiPicker(false); setShowEdit(true); }}
        currentEmoji={editEmoji}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  back: { padding: 4 },
  hc: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  he: { fontSize: 24 },
  ht: { fontSize: 20, fontWeight: "700" as const, flex: 1 },
  ha: { flexDirection: "row", gap: 16, alignItems: "center" },
  doneBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sc: { flex: 1 },
  si: { paddingHorizontal: 20, gap: 10 },
  cardWrapper: { flexDirection: "row", alignItems: "center" },
  reorderControls: { flexDirection: "column", gap: 4, marginRight: 8 },
  reorderBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  emoji: { fontSize: 34 },
  info: { flex: 1, marginRight: 8, paddingTop: 2 },
  name: { fontSize: 17, fontWeight: "600" as const, marginBottom: 2 },
  taskNum: { fontSize: 13, marginBottom: 4 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  st: { fontSize: 12, fontWeight: "500" as const },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillT: { fontSize: 11, fontWeight: "600" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyH: { fontSize: 18, fontWeight: "600" as const, marginBottom: 6, textAlign: "center" as const },
  emptyB: { fontSize: 14, textAlign: "center" as const },
  bb: { paddingHorizontal: 20, paddingTop: 12 },
  ab: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 50, borderRadius: 14, gap: 8 },
  at: { color: "#FFF", fontSize: 16, fontWeight: "600" as const },
  nf: { fontSize: 16, textAlign: "center", marginTop: 100 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 30 },
  modalContent: { borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700" as const },
  groupEmojiRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  groupEmojiBtn: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  groupEmojiBtnText: { fontSize: 28 },
  modalInput: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  modalSave: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalSaveText: { color: "#FFF", fontSize: 16, fontWeight: "600" as const },
});
