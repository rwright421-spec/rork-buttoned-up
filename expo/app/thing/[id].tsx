import React, { useMemo, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Pencil, Trash2, Plus, GripVertical, ArrowUp, ArrowDown, Check, Sparkles, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getDueText, formatDate } from "@/utils/dates";
import { TaskStatus, Task, Thing } from "@/constants/types";
import { matchDecomposeTemplate } from "@/constants/templates";

const SC: Record<TaskStatus, string> = { overdue: "#EF4444", due_soon: "#F59E0B", current: "#22C55E", not_started: "#9CA3AF" };

export default function ThingView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { things, tasks, logs, deleteThing, reorderTasks, addThing, moveTaskToThing, updateThing } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isReordering, setIsReordering] = useState(false);

  const thing = things.find(e => e.id === id);

  const eqTasks = useMemo(() =>
    tasks
      .filter(t => t.thingId === id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(t => ({ ...t, status: getTaskStatus(t), dueText: getDueText(t) })),
    [tasks, id]
  );

  const del = useCallback(() => {
    if (!thing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const taskCount = tasks.filter(t => t.thingId === thing.id).length;
    const taskIds = new Set(tasks.filter(t => t.thingId === thing.id).map(t => t.id));
    const logCount = logs.filter(l => taskIds.has(l.taskId)).length;
    const message = taskCount === 0
      ? "This Thing has no tasks. This cannot be undone."
      : `This will permanently delete ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} and ${logCount} ${logCount === 1 ? 'history entry' : 'history entries'}. This cannot be undone.`;
    Alert.alert(
      `Delete ${thing.name}?`,
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => { deleteThing(thing.id); router.back(); } },
      ]
    );
  }, [thing, deleteThing, router, tasks, logs]);

  const toggleReorder = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReordering(prev => !prev);
  }, []);

  const moveTask = useCallback((index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= eqTasks.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const reordered = [...eqTasks];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const baseTasks: Task[] = reordered.map(({ status, dueText, ...rest }) => rest);
    reorderTasks(id!, baseTasks);
  }, [eqTasks, id, reorderTasks]);

  const showDecomposeBanner = useMemo(() => {
    if (!thing) return false;
    if (thing.decomposeDismissed) return false;
    if (eqTasks.length < 5) return false;
    const matchCount = eqTasks.filter(t => matchDecomposeTemplate(t.name)).length;
    return matchCount >= 2;
  }, [thing, eqTasks]);

  const dismissDecompose = useCallback(() => {
    if (!thing) return;
    updateThing(thing.id, { decomposeDismissed: true });
  }, [thing, updateThing]);

  const doDecompose = useCallback(() => {
    if (!thing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const siblingThings = things.filter(t => t.areaId === thing.areaId);
    const nameToThing = new Map<string, Thing>();
    siblingThings.forEach(t => nameToThing.set(t.name.toLowerCase(), t));

    let movedCount = 0;
    const newThingNames = new Set<string>();

    eqTasks.forEach(task => {
      const tpl = matchDecomposeTemplate(task.name);
      if (!tpl) return;
      let dest = nameToThing.get(tpl.name.toLowerCase());
      if (!dest) {
        dest = addThing({
          name: tpl.name,
          type: tpl.type,
          emoji: tpl.emoji,
          areaId: thing.areaId,
        });
        nameToThing.set(tpl.name.toLowerCase(), dest);
        newThingNames.add(tpl.name);
      }
      if (dest.id !== thing.id) {
        moveTaskToThing(task.id, dest.id);
        movedCount++;
      }
    });

    const stayedCount = eqTasks.length - movedCount;
    updateThing(thing.id, { decomposeDismissed: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Split complete",
      `Moved ${movedCount} task${movedCount === 1 ? '' : 's'} into ${newThingNames.size} new Thing${newThingNames.size === 1 ? '' : 's'}. ${stayedCount} task${stayedCount === 1 ? '' : 's'} stayed on ${thing.name}.`
    );
  }, [thing, things, eqTasks, addThing, moveTaskToThing, updateThing]);

  if (!thing) return (
    <View style={[st.c, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[st.nf, { color: colors.textSecondary }]}>Thing not found</Text>
    </View>
  );

  return (
    <View style={[st.c, { backgroundColor: colors.background }]}>
      <View style={[st.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.back} activeOpacity={0.6}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={st.hc}>
          <Text style={st.he}>{thing.emoji}</Text>
          <Text style={[st.ht, { color: colors.text }]} numberOfLines={1}>{thing.name}</Text>
        </View>
        <View style={st.ha}>
          {eqTasks.length > 0 && (
            <TouchableOpacity onPress={toggleReorder} activeOpacity={0.6}>
              {isReordering ? (
                <View style={[st.reorderDoneBtn, { backgroundColor: colors.accent }]}>
                  <Check size={16} color="#FFF" strokeWidth={2.5} />
                </View>
              ) : (
                <GripVertical size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push(`/thing/edit/${thing.id}`)} activeOpacity={0.6}>
            <Pencil size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={del} activeOpacity={0.6}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {eqTasks.length === 0 ? (
        <View style={st.empty}>
          <Text style={[st.et, { color: colors.text }]}>No tasks yet.</Text>
          <Text style={[st.eb, { color: colors.textSecondary }]}>Tap + Add Task to get started.</Text>
        </View>
      ) : (
        <ScrollView
          style={st.sc}
          contentContainerStyle={[st.si, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {showDecomposeBanner && (
            <View style={[st.decompose, { backgroundColor: colors.accent + "12", borderColor: colors.accent + "40" }]}>
              <View style={st.decomposeHeader}>
                <Sparkles size={18} color={colors.accent} />
                <Text style={[st.decomposeTitle, { color: colors.text }]}>Split this Thing?</Text>
                <TouchableOpacity onPress={dismissDecompose} hitSlop={8}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[st.decomposeBody, { color: colors.textSecondary }]}>
                This Thing has a lot of Tasks. Want to split them into separate Things like HVAC System, Water Heater, etc.?
              </Text>
              <View style={st.decomposeActions}>
                <TouchableOpacity style={[st.decomposeBtn, { backgroundColor: colors.accent }]} onPress={doDecompose} activeOpacity={0.8}>
                  <Text style={st.decomposeBtnText}>Split</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.decomposeBtn, { borderColor: colors.border, borderWidth: 1 }]} onPress={dismissDecompose} activeOpacity={0.7}>
                  <Text style={[st.decomposeBtnText, { color: colors.text }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {eqTasks.map((t, index) => (
            <View key={t.id} style={st.taskRow}>
              {isReordering && (
                <View style={st.taskReorderControls}>
                  <TouchableOpacity
                    onPress={() => moveTask(index, "up")}
                    style={[st.taskReorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    disabled={index === 0}
                    activeOpacity={0.6}
                  >
                    <ArrowUp size={14} color={index === 0 ? colors.border : colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveTask(index, "down")}
                    style={[st.taskReorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    disabled={index === eqTasks.length - 1}
                    activeOpacity={0.6}
                  >
                    <ArrowDown size={14} color={index === eqTasks.length - 1 ? colors.border : colors.text} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                testID={`tr-${t.id}`}
                style={[st.tc, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}
                onPress={() => {
                  if (isReordering) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/task/${t.id}`);
                }}
                activeOpacity={isReordering ? 1 : 0.7}
              >
                {isReordering && (
                  <GripVertical size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                )}
                <View style={[st.sd, { backgroundColor: SC[t.status] }]} />
                <View style={st.ti}>
                  <Text style={[st.tn, { color: colors.text }]}>{t.name}</Text>
                  <Text style={[st.td, { color: SC[t.status] }]}>{t.dueText}</Text>
                  {t.lastCompletedDate && (
                    <Text style={[st.tl, { color: colors.textSecondary }]}>
                      Last: {formatDate(t.lastCompletedDate)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[st.bb, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity
          testID="add-task"
          style={[st.ab, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/task/add?thingId=${thing.id}`);
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFF" strokeWidth={2.5} />
          <Text style={st.at}>Add Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  back: { padding: 4 },
  hc: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  he: { fontSize: 24 },
  ht: { fontSize: 20, fontWeight: "700" as const, flex: 1 },
  ha: { flexDirection: "row", gap: 16, alignItems: "center" },
  reorderDoneBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sc: { flex: 1 },
  si: { paddingHorizontal: 20, gap: 8 },
  decompose: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 6, gap: 10 },
  decomposeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  decomposeTitle: { flex: 1, fontSize: 15, fontWeight: "700" as const },
  decomposeBody: { fontSize: 13, lineHeight: 19 },
  decomposeActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  decomposeBtn: { flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  decomposeBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" as const },
  taskRow: { flexDirection: "row", alignItems: "center" },
  taskReorderControls: { flexDirection: "column", gap: 4, marginRight: 8 },
  taskReorderBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tc: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  sd: { width: 10, height: 10, borderRadius: 5 },
  ti: { flex: 1 },
  tn: { fontSize: 16, fontWeight: "600" as const, marginBottom: 2 },
  td: { fontSize: 13, fontWeight: "500" as const },
  tl: { fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  et: { fontSize: 18, fontWeight: "600" as const, marginBottom: 6 },
  eb: { fontSize: 14, textAlign: "center" },
  bb: { paddingHorizontal: 20, paddingTop: 12 },
  ab: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 50, borderRadius: 14, gap: 8 },
  at: { color: "#FFF", fontSize: 16, fontWeight: "600" as const },
  nf: { fontSize: 16, textAlign: "center", marginTop: 100 },
});
