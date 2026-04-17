import React, { useMemo, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, Platform, ActionSheetIOS } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Pencil, Trash2, Plus, GripVertical, ArrowUp, ArrowDown, Check, Sparkles, X, Camera, ImageIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getDueText, formatDate } from "@/utils/dates";
import { TaskStatus, Task, Thing, PhotoRef } from "@/constants/types";
import { matchDecomposeTemplate } from "@/constants/templates";
import { pickFromLibrary, takePhoto } from "@/utils/photos";
import PhotoThumb from "@/components/PhotoThumb";

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

  const refPhotos = useMemo<PhotoRef[]>(() => thing?.referencePhotos ?? [], [thing]);
  const [photoViewer, setPhotoViewer] = useState<PhotoRef | null>(null);

  const addRefPhoto = useCallback(async () => {
    if (!thing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const doCamera = async () => {
      const p = await takePhoto();
      if (p) updateThing(thing.id, { referencePhotos: [...(thing.referencePhotos ?? []), p] });
    };
    const doLibrary = async () => {
      const arr = await pickFromLibrary();
      if (arr && arr.length > 0) updateThing(thing.id, { referencePhotos: [...(thing.referencePhotos ?? []), ...arr] });
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Library"], cancelButtonIndex: 0 },
        (i) => { if (i === 1) doCamera(); if (i === 2) doLibrary(); }
      );
    } else if (Platform.OS === "web") {
      doLibrary();
    } else {
      Alert.alert("Add Reference Photo", undefined, [
        { text: "Take Photo", onPress: doCamera },
        { text: "Choose from Library", onPress: doLibrary },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [thing, updateThing]);

  const removeRefPhoto = useCallback((uri: string) => {
    if (!thing) return;
    updateThing(thing.id, { referencePhotos: (thing.referencePhotos ?? []).filter(p => p.uri !== uri) });
  }, [thing, updateThing]);

  const replaceRefPhoto = useCallback(async (uri: string) => {
    if (!thing) return;
    const picked = await pickFromLibrary();
    if (!picked || picked.length === 0) return;
    const next = (thing.referencePhotos ?? []).map(p => p.uri === uri ? picked[0] : p);
    updateThing(thing.id, { referencePhotos: next });
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
          <View style={[st.refSection, { borderColor: colors.border }]}>
            <View style={st.refHeader}>
              <Text style={[st.refTitle, { color: colors.text }]}>Reference Photos</Text>
              <TouchableOpacity style={[st.refAddBtn, { backgroundColor: colors.accent }]} onPress={addRefPhoto} activeOpacity={0.8} testID="add-ref-photo">
                <Plus size={14} color="#FFF" strokeWidth={2.5} />
                <Text style={st.refAddBtnT}>Add</Text>
              </TouchableOpacity>
            </View>
            {refPhotos.length === 0 ? (
              <TouchableOpacity
                style={[st.refEmpty, { borderColor: colors.border }]}
                onPress={addRefPhoto}
                activeOpacity={0.7}
              >
                <View style={st.refEmptyIcons}>
                  <Camera size={16} color={colors.textSecondary} />
                  <ImageIcon size={16} color={colors.textSecondary} />
                </View>
                <Text style={[st.refEmptyT, { color: colors.textSecondary }]}>
                  Attach manuals, serial numbers, or warranty cards for quick reference.
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={st.refGrid}>
                {refPhotos.map(p => (
                  <PhotoThumb
                    key={p.uri}
                    photo={p}
                    size={84}
                    onPress={() => setPhotoViewer(p)}
                    onRemove={() => removeRefPhoto(p.uri)}
                    onReplace={() => replaceRefPhoto(p.uri)}
                  />
                ))}
              </View>
            )}
          </View>
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

      <Modal visible={!!photoViewer} transparent animationType="fade" onRequestClose={() => setPhotoViewer(null)}>
        <View style={st.viewerOverlay}>
          <TouchableOpacity style={st.viewerClose} onPress={() => setPhotoViewer(null)} hitSlop={8}>
            <X size={28} color="#FFF" />
          </TouchableOpacity>
          {photoViewer && (
            <Image source={{ uri: photoViewer.uri }} style={st.viewerImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

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
  refSection: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12, gap: 10 },
  refHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refTitle: { fontSize: 15, fontWeight: "700" as const, letterSpacing: -0.2 },
  refAddBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  refAddBtnT: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
  refEmpty: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderStyle: "dashed" as const },
  refEmptyIcons: { flexDirection: "row", gap: 4 },
  refEmptyT: { flex: 1, fontSize: 12, lineHeight: 17 },
  refGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute" as const, top: 60, right: 24, zIndex: 2, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  viewerImg: { width: "100%" as const, height: "100%" as const },
});
