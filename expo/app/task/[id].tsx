import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Animated as RNAnimated, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Pencil, Trash2, CheckCircle, Undo2, ClipboardList, MoveRight, X, Calendar, Camera } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getDueText, formatDate, describeSchedule } from "@/utils/dates";
import { TaskStatus, PhotoRef, CompletionLog } from "@/constants/types";
import CalendarPicker from "@/components/CalendarPicker";
import CompletionModal from "@/components/CompletionModal";
import CompletionDetailSheet from "@/components/CompletionDetailSheet";

const SI: Record<TaskStatus, { label: string; color: string }> = {
  overdue: { label: "Overdue", color: "#EF4444" }, due_soon: { label: "Due Soon", color: "#F59E0B" },
  current: { label: "Current", color: "#22C55E" }, not_started: { label: "Not Started", color: "#9CA3AF" },
};
const UNDO_TIMEOUT = 6000;

export default function TaskView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { tasks, things, areas, deleteTask, addCompletionLog, getLogsForTask, deleteCompletionLog, updateCompletionLog, moveTaskToThing, updateTask } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const task = tasks.find(t => t.id === id);
  const allLogs = useMemo(() => id ? getLogsForTask(id) : [], [id, getLogsForTask]);
  const historyLogs = useMemo(() => allLogs.length > 1 ? allLogs.slice(1) : [], [allLogs]);
  const status = task ? getTaskStatus(task) : "not_started";
  const si = SI[status];
  const [modal, setModal] = useState(false);
  const [undoLogId, setUndoLogId] = useState<string | null>(null);
  const [showMove, setShowMove] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CompletionLog | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoAnim = useRef(new RNAnimated.Value(0)).current;
  const undoProgress = useRef(new RNAnimated.Value(1)).current;
  const [bannerWidth, setBannerWidth] = useState<number>(0);

  const clearUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    undoProgress.stopAnimation();
    undoProgress.setValue(1);
    RNAnimated.timing(undoAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setUndoLogId(null));
  }, [undoAnim, undoProgress]);

  const showUndo = useCallback((logId: string) => {
    setUndoLogId(logId);
    RNAnimated.timing(undoAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    undoProgress.setValue(1);
    RNAnimated.timing(undoProgress, { toValue: 0, duration: UNDO_TIMEOUT, useNativeDriver: false }).start();
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => { clearUndo(); }, UNDO_TIMEOUT);
  }, [undoAnim, undoProgress, clearUndo]);

  const handleUndo = useCallback(() => {
    if (!undoLogId) return;
    deleteCompletionLog(undoLogId);
    clearUndo();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [undoLogId, deleteCompletionLog, clearUndo]);

  useEffect(() => { return () => { if (undoTimer.current) clearTimeout(undoTimer.current); }; }, []);

  const complete = useCallback((data: { date: string; notes: string; photos: PhotoRef[] }) => {
    if (!id) return;
    addCompletionLog(id, data.date, data.notes, data.photos);
    setModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const latestAfter = getLogsForTask(id);
    if (latestAfter.length > 0) showUndo(latestAfter[0].id);
  }, [id, addCompletionLog, getLogsForTask, showUndo]);

  const del = useCallback(() => {
    if (!task) return;
    Alert.alert("Delete this task?", "All history will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteTask(task.id); router.back(); } }
    ]);
  }, [task, deleteTask, router]);

  const pickDestination = useCallback((destThingId: string) => {
    if (!task) return;
    if (destThingId === task.thingId) { setShowMove(false); return; }
    moveTaskToThing(task.id, destThingId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMove(false);
  }, [task, moveTaskToThing]);

  const thingsByArea = useMemo(() => {
    return [...areas].sort((a, b) => a.sortOrder - b.sortOrder).map(a => ({
      area: a,
      things: things.filter(t => t.areaId === a.id).sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)),
    }));
  }, [areas, things]);

  const updatedSelectedLog = useMemo(() => {
    if (!selectedLog) return null;
    return allLogs.find(l => l.id === selectedLog.id) ?? null;
  }, [selectedLog, allLogs]);

  const handleEditLog = useCallback((data: { date: string; notes: string; photos: PhotoRef[] }) => {
    if (!selectedLog) return;
    updateCompletionLog(selectedLog.id, { completedAt: data.date, notes: data.notes, photoRefs: data.photos });
  }, [selectedLog, updateCompletionLog]);

  const handleDeleteLog = useCallback(() => {
    if (!selectedLog) return;
    deleteCompletionLog(selectedLog.id);
    setSelectedLog(null);
  }, [selectedLog, deleteCompletionLog]);

  if (!task) return <View style={[st.c, { backgroundColor: colors.background, paddingTop: insets.top }]}><Text style={[st.nf, { color: colors.textSecondary }]}>Task not found</Text></View>;

  const dt = getDueText(task);

  return (
    <View style={[st.c, { backgroundColor: colors.background }]}>
      <View style={[st.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.back} activeOpacity={0.6}><ArrowLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[st.ht, { color: colors.text }]} numberOfLines={1}>{task.name}</Text>
        <View style={st.ha}>
          <TouchableOpacity onPress={() => setShowMove(true)} activeOpacity={0.6}><MoveRight size={20} color={colors.textSecondary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/task/edit/${task.id}`)} activeOpacity={0.6}><Pencil size={20} color={colors.textSecondary} /></TouchableOpacity>
          <TouchableOpacity onPress={del} activeOpacity={0.6}><Trash2 size={20} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>
      <ScrollView style={st.sc} contentContainerStyle={[st.si, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <View style={[st.card, { backgroundColor: si.color + "10", borderColor: si.color + "30" }]}>
          <View style={[st.badge, { backgroundColor: si.color }]}><Text style={st.badgeT}>{si.label}</Text></View>
          <Text style={[st.due, { color: si.color }]}>{dt}</Text>
          {task.lastCompletedDate && <Text style={[st.last, { color: colors.textSecondary }]}>Last completed: {formatDate(task.lastCompletedDate)}</Text>}
          <Text style={[st.intv, { color: colors.textSecondary }]}>{describeSchedule(task.schedule)}</Text>
          {task.dueDates && task.dueDates.length > 1 && (
            <Text style={[st.intv, { color: colors.textSecondary }]}>Next {task.dueDates.length} dates: {task.dueDates.slice(0, 3).map(d => formatDate(d)).join(' · ')}</Text>
          )}
          <TouchableOpacity style={[st.overrideBtn, { borderColor: colors.border }]} onPress={() => setShowOverride(true)} activeOpacity={0.7}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={[st.overrideText, { color: colors.textSecondary }]}>Override next due date</Text>
          </TouchableOpacity>
          {task.notes ? <Text style={[st.nt, { color: colors.textSecondary }]}>{task.notes}</Text> : null}
        </View>
        <Text style={[st.sect, { color: colors.textSecondary }]}>HISTORY</Text>
        {allLogs.length === 0 ? (
          <View style={st.emptyState}>
            <ClipboardList size={32} color={colors.border} />
            <Text style={[st.emptyTitle, { color: colors.text }]}>No completions yet</Text>
            <Text style={[st.emptySub, { color: colors.textSecondary }]}>Tap Mark Complete to start your history.</Text>
          </View>
        ) : allLogs.length === 1 ? (
          <Text style={[st.ehOnce, { color: colors.textSecondary }]}>Your history will appear here after your next completion.</Text>
        ) : historyLogs.map((l) => {
          const photoCount = (l.photoRefs ?? []).length;
          const firstPhoto = photoCount > 0 ? l.photoRefs[0] : null;
          return (
            <TouchableOpacity
              key={l.id}
              style={[st.lr, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setSelectedLog(l)}
              activeOpacity={0.8}
            >
              <View style={st.lrLeft}>
                <Text style={[st.ldt, { color: colors.text }]}>{formatDate(l.completedAt)}</Text>
                <View style={st.lrMetaRow}>
                  <Text
                    style={[st.ln, { color: l.notes ? colors.textSecondary : colors.textSecondary, fontStyle: l.notes ? "normal" : "italic" }]}
                    numberOfLines={1}
                  >
                    {l.notes ? l.notes.split("\n")[0] : "No notes"}
                  </Text>
                  {photoCount > 0 && (
                    <View style={[st.photoBadge, { backgroundColor: colors.accent + "20" }]}>
                      <Camera size={10} color={colors.accent} />
                      <Text style={[st.photoBadgeT, { color: colors.accent }]}>{photoCount}</Text>
                    </View>
                  )}
                </View>
              </View>
              {firstPhoto && (
                <Image source={{ uri: firstPhoto.uri }} style={st.lrThumb} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[st.bb, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
        {undoLogId && (
          <RNAnimated.View onLayout={(e) => setBannerWidth(e.nativeEvent.layout.width)} style={[st.undoBanner, { backgroundColor: colors.text, opacity: undoAnim, transform: [{ translateY: undoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={st.undoRow}>
              <Text style={[st.undoText, { color: colors.background }]}>Marked complete</Text>
              <TouchableOpacity style={st.undoBtn} onPress={handleUndo} activeOpacity={0.7}>
                <Undo2 size={16} color={colors.accent} /><Text style={[st.undoBtnText, { color: colors.accent }]}>Undo</Text>
              </TouchableOpacity>
            </View>
            <View style={st.progressTrack}>
              <RNAnimated.View style={[st.progressBar, { backgroundColor: colors.accent, width: bannerWidth > 0 ? undoProgress.interpolate({ inputRange: [0, 1], outputRange: [0, bannerWidth] }) : 0 }]} />
            </View>
          </RNAnimated.View>
        )}
        <TouchableOpacity testID="complete" style={[st.cb, { backgroundColor: status === "overdue" ? "#EF4444" : colors.accent }]} onPress={() => setModal(true)} activeOpacity={0.8}>
          <CheckCircle size={22} color="#FFF" /><Text style={st.ct}>{status === "overdue" ? "Mark Complete \u2014 Overdue" : "Mark Complete"}</Text>
        </TouchableOpacity>
      </View>

      <CompletionModal
        visible={modal}
        onClose={() => setModal(false)}
        onSave={complete}
      />

      <CompletionDetailSheet
        visible={!!selectedLog}
        log={updatedSelectedLog}
        onClose={() => setSelectedLog(null)}
        onEdit={handleEditLog}
        onDelete={handleDeleteLog}
      />

      <CalendarPicker
        visible={showOverride}
        initialDate={task.dueDates && task.dueDates[0] ? new Date(task.dueDates[0]) : null}
        title="Override next due"
        onClose={() => setShowOverride(false)}
        onSelect={(d) => {
          const rest = (task.dueDates ?? []).slice(1);
          updateTask(task.id, { dueDates: [d.toISOString(), ...rest] });
          setShowOverride(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
      <Modal visible={showMove} transparent animationType="slide" onRequestClose={() => setShowMove(false)}>
        <View style={st.moveOverlay}>
          <View style={[st.moveSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={st.moveHeader}>
              <Text style={[st.moveTitle, { color: colors.text }]}>Move to another Thing</Text>
              <TouchableOpacity onPress={() => setShowMove(false)} hitSlop={8}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 480 }}>
              {thingsByArea.map(({ area, things: areaThings }) => (
                <View key={area.id} style={{ marginBottom: 10 }}>
                  <Text style={[st.moveAreaLabel, { color: colors.textSecondary }]}>{area.emoji} {area.name}</Text>
                  {areaThings.length === 0 ? (
                    <Text style={[st.moveEmpty, { color: colors.textSecondary }]}>No Things yet</Text>
                  ) : areaThings.map(th => {
                    const isCurrent = th.id === task.thingId;
                    return (
                      <TouchableOpacity
                        key={th.id}
                        style={[st.moveRow, { borderColor: colors.border, opacity: isCurrent ? 0.5 : 1 }]}
                        onPress={() => pickDestination(th.id)}
                        disabled={isCurrent}
                        activeOpacity={0.7}
                      >
                        <Text style={st.moveEmoji}>{th.emoji}</Text>
                        <Text style={[st.moveName, { color: colors.text }]}>{th.name}</Text>
                        {isCurrent && <Text style={[st.moveCurrent, { color: colors.textSecondary }]}>Current</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  back: { padding: 4 },
  ht: { fontSize: 20, fontWeight: "700" as const, flex: 1 },
  ha: { flexDirection: "row", gap: 16 },
  sc: { flex: 1 },
  si: { paddingHorizontal: 20 },
  card: { borderRadius: 14, borderWidth: 1, padding: 20, marginBottom: 24, gap: 8 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeT: { color: "#FFF", fontSize: 13, fontWeight: "700" as const },
  due: { fontSize: 18, fontWeight: "600" as const },
  last: { fontSize: 14 },
  intv: { fontSize: 14 },
  overrideBtn: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, alignSelf: "flex-start" as const, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderStyle: "dashed" as const, marginTop: 4 },
  overrideText: { fontSize: 12, fontWeight: "500" as const },
  nt: { fontSize: 14, fontStyle: "italic" as const },
  sect: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.8, marginBottom: 10, marginLeft: 2 },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "600" as const },
  emptySub: { fontSize: 13, textAlign: "center" as const },
  ehOnce: { fontSize: 14, textAlign: "center" as const, paddingVertical: 20 },
  lr: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 6, gap: 10 },
  lrLeft: { flex: 1 },
  ldt: { fontSize: 15, fontWeight: "600" as const },
  lrMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  ln: { flex: 1, fontSize: 13 },
  photoBadge: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  photoBadgeT: { fontSize: 11, fontWeight: "700" as const },
  lrThumb: { width: 44, height: 44, borderRadius: 8 },
  bb: { paddingHorizontal: 20, paddingTop: 12 },
  cb: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, borderRadius: 14, gap: 8 },
  ct: { color: "#FFF", fontSize: 17, fontWeight: "700" as const },
  nf: { fontSize: 16, textAlign: "center", marginTop: 100 },
  undoBanner: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 10 },
  undoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTrack: { height: 3, borderRadius: 2, marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)" },
  progressBar: { height: 3, borderRadius: 2 },
  undoText: { fontSize: 14, fontWeight: "600" as const },
  undoBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  undoBtnText: { fontSize: 14, fontWeight: "700" as const },
  moveOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  moveSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 },
  moveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  moveTitle: { fontSize: 18, fontWeight: "700" as const },
  moveAreaLabel: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" as const },
  moveEmpty: { fontSize: 13, paddingLeft: 8, paddingVertical: 6 },
  moveRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, gap: 10, marginBottom: 6 },
  moveEmoji: { fontSize: 20 },
  moveName: { flex: 1, fontSize: 15, fontWeight: "500" as const },
  moveCurrent: { fontSize: 12 },
});
