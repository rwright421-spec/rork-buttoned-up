import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Search, Share2, ListChecks, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getDueText, getNextDueFromTask, formatDate } from "@/utils/dates";
import { Task, TaskStatus } from "@/constants/types";

type BucketKey = "overdue" | "today" | "week" | "month" | "later";

interface EnrichedTask {
  task: Task;
  thingName: string;
  areaId: string;
  areaName: string;
  nextDue: Date | null;
  status: TaskStatus;
  bucket: BucketKey;
}

const BUCKET_LABELS: Record<BucketKey, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "This Week",
  month: "This Month",
  later: "Later",
};

const BUCKET_ORDER: BucketKey[] = ["overdue", "today", "week", "month", "later"];

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function bucketForDate(nextDue: Date | null, status: TaskStatus): BucketKey {
  if (status === "overdue") return "overdue";
  if (!nextDue) return "later";
  const today = startOfDay(new Date());
  const due = startOfDay(nextDue);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays <= 7) return "week";
  if (diffDays <= 30) return "month";
  return "later";
}

export default function TasksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, things, areas, addCompletionLog, logs } = useData();

  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  const thingMap = useMemo(() => {
    const m = new Map<string, { name: string; areaId: string }>();
    things.forEach((t) => m.set(t.id, { name: t.name, areaId: t.areaId }));
    return m;
  }, [things]);

  const areaMap = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [areas]);

  const enrichedAll = useMemo<EnrichedTask[]>(() => {
    return tasks.map((task) => {
      const thing = thingMap.get(task.thingId);
      const areaId = thing?.areaId ?? "";
      const areaName = areaMap.get(areaId) ?? "";
      const nextDue = getNextDueFromTask(task);
      const status = getTaskStatus(task);
      const bucket = bucketForDate(nextDue, status);
      return {
        task,
        thingName: thing?.name ?? "",
        areaId,
        areaName,
        nextDue,
        status,
        bucket,
      };
    });
  }, [tasks, thingMap, areaMap]);

  const filtered = useMemo<EnrichedTask[]>(() => {
    const q = search.trim().toLowerCase();
    return enrichedAll.filter((e) => {
      if (selectedAreaIds.length > 0 && !selectedAreaIds.includes(e.areaId)) return false;
      if (overdueOnly && e.bucket !== "overdue") return false;
      if (q) {
        const hay = `${e.task.name} ${e.thingName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedAll, selectedAreaIds, overdueOnly, search]);

  const buckets = useMemo(() => {
    const b: Record<BucketKey, EnrichedTask[]> = {
      overdue: [],
      today: [],
      week: [],
      month: [],
      later: [],
    };
    filtered.forEach((e) => b[e.bucket].push(e));
    BUCKET_ORDER.forEach((k) => {
      b[k].sort((a, z) => {
        const aT = a.nextDue ? a.nextDue.getTime() : Number.MAX_SAFE_INTEGER;
        const zT = z.nextDue ? z.nextDue.getTime() : Number.MAX_SAFE_INTEGER;
        return aT - zT;
      });
    });
    return b;
  }, [filtered]);

  const toggleArea = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearAreas = useCallback(() => {
    Haptics.selectionAsync();
    setSelectedAreaIds([]);
  }, []);

  const quickComplete = useCallback(
    (taskId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addCompletionLog(taskId, new Date().toISOString(), "", []);
    },
    [addCompletionLog]
  );

  const buildTextExport = useCallback((): string => {
    const today = new Date();
    const header = `Buttoned Up — ${today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}\n`;
    const sections: string[] = [header];
    BUCKET_ORDER.forEach((key) => {
      const items = buckets[key];
      if (items.length === 0) return;
      sections.push(`\n${BUCKET_LABELS[key].toUpperCase()}`);
      items.forEach((e) => {
        const dueStr = e.nextDue ? formatDate(e.nextDue.toISOString()) : "No date";
        const statusTail =
          e.status === "overdue" ? ` (${getDueText(e.task).toLowerCase()})` : "";
        const areaBit = e.areaName ? ` (${e.areaName})` : "";
        sections.push(
          `[ ] ${e.task.name} — ${e.thingName}${areaBit} — Due ${dueStr}${statusTail}`
        );
      });
    });
    return sections.join("\n");
  }, [buckets]);

  const buildCsvExport = useCallback((): string => {
    const esc = (v: string): string => {
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const lines: string[] = ["Area,Thing,Task,DueDate,Status,LastCompleted"];
    filtered.forEach((e) => {
      const dueStr = e.nextDue ? e.nextDue.toISOString().slice(0, 10) : "";
      const last = e.task.lastCompletedDate
        ? new Date(e.task.lastCompletedDate).toISOString().slice(0, 10)
        : "";
      lines.push(
        [e.areaName, e.thingName, e.task.name, dueStr, e.status, last]
          .map(esc)
          .join(",")
      );
    });
    return lines.join("\n");
  }, [filtered]);

  const onShareText = useCallback(async () => {
    try {
      const message = buildTextExport();
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({ text: message, title: "Buttoned Up" });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          Alert.alert("Copied", "Task list copied to clipboard.");
        } else {
          Alert.alert("Export", message);
        }
      } else {
        await Share.share({ message });
      }
    } catch (err) {
      console.log("[TasksScreen] share text error", err);
    }
  }, [buildTextExport]);

  const onShareCsv = useCallback(async () => {
    try {
      const csv = buildCsvExport();
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(csv);
          Alert.alert("CSV Copied", "CSV content copied to clipboard.");
        } else {
          Alert.alert("CSV", csv);
        }
      } else {
        await Share.share({ message: csv, title: "Buttoned Up Tasks.csv" });
      }
    } catch (err) {
      console.log("[TasksScreen] share csv error", err);
    }
  }, [buildCsvExport]);

  const openShareMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Export",
      "Share your tasks",
      [
        { text: "Share as text", onPress: onShareText },
        { text: "Share CSV", onPress: onShareCsv },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  }, [onShareText, onShareCsv]);

  const totalVisible = filtered.length;
  const totalLogs = logs.length;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + 16 }]}>
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>Tasks</Text>
            <Text style={[s.meta, { color: colors.textSecondary }]}>
              {totalVisible} {totalVisible === 1 ? "task" : "tasks"}
              {totalLogs > 0 ? ` · ${totalLogs} completions` : ""}
            </Text>
          </View>
          <TouchableOpacity
            testID="share-btn"
            style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={openShareMenu}
            activeOpacity={0.7}
          >
            <Share2 size={18} color={colors.text} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={[s.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={16} color={colors.textSecondary} strokeWidth={1.8} />
          <TextInput
            testID="search-input"
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks or things"
            placeholderTextColor={colors.textSecondary}
            style={[s.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.6}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {areas.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsRow}
            style={s.chipsScroll}
          >
            <TouchableOpacity
              onPress={clearAreas}
              style={[
                s.chip,
                {
                  backgroundColor: selectedAreaIds.length === 0 ? colors.accent : colors.card,
                  borderColor: selectedAreaIds.length === 0 ? colors.accent : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  s.chipText,
                  { color: selectedAreaIds.length === 0 ? "#FFF" : colors.text },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {areas.map((a) => {
              const active = selectedAreaIds.includes(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => toggleArea(a.id)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: active ? colors.accent : colors.card,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipEmoji]}>{a.emoji}</Text>
                  <Text style={[s.chipText, { color: active ? "#FFF" : colors.text }]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setOverdueOnly((p) => !p);
          }}
          style={[
            s.overdueToggle,
            {
              backgroundColor: overdueOnly ? colors.overdue + "18" : "transparent",
              borderColor: overdueOnly ? colors.overdue : colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              s.overdueToggleText,
              { color: overdueOnly ? colors.overdue : colors.textSecondary },
            ]}
          >
            {overdueOnly ? "Showing overdue only" : "Overdue only"}
          </Text>
        </TouchableOpacity>
      </View>

      {totalVisible === 0 ? (
        <View style={s.empty}>
          <ListChecks size={48} color={colors.border} strokeWidth={1.5} />
          <Text style={[s.emptyH, { color: colors.text }]}>No tasks match</Text>
          <Text style={[s.emptyB, { color: colors.textSecondary }]}>
            {tasks.length === 0
              ? "Add an Area and Thing to start tracking tasks."
              : "Try clearing your filters or search."}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollInner, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {BUCKET_ORDER.map((key) => {
            const items = buckets[key];
            if (items.length === 0) return null;
            const accent =
              key === "overdue"
                ? colors.overdue
                : key === "today"
                ? colors.dueSoon
                : colors.textSecondary;
            return (
              <View key={key} style={s.bucket}>
                <View style={s.bucketHeader}>
                  <View style={[s.bucketDot, { backgroundColor: accent }]} />
                  <Text style={[s.bucketTitle, { color: colors.text }]}>
                    {BUCKET_LABELS[key]}
                  </Text>
                  <Text style={[s.bucketCount, { color: colors.textSecondary }]}>
                    {items.length}
                  </Text>
                </View>
                {items.map((e) => {
                  const statusColor =
                    e.status === "overdue"
                      ? colors.overdue
                      : e.status === "due_soon"
                      ? colors.dueSoon
                      : e.status === "current"
                      ? colors.current
                      : colors.notStarted;
                  return (
                    <View
                      key={e.task.id}
                      style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <TouchableOpacity
                        testID={`complete-${e.task.id}`}
                        onPress={() => quickComplete(e.task.id)}
                        style={[s.checkBtn, { borderColor: statusColor }]}
                        activeOpacity={0.6}
                      >
                        <Check size={16} color={statusColor} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync();
                          router.push(`/task/${e.task.id}`);
                        }}
                        style={s.rowBody}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[s.rowName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {e.task.name}
                        </Text>
                        <Text
                          style={[s.rowSub, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {e.thingName}
                          {e.areaName ? ` · ${e.areaName}` : ""}
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={[s.rowDue, { color: statusColor }]}
                        numberOfLines={2}
                      >
                        {getDueText(e.task)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.6 },
  meta: { fontSize: 14, marginTop: 2 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  chipsScroll: { marginTop: 12 },
  chipsRow: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: "600" as const },
  overdueToggle: {
    marginTop: 10,
    alignSelf: "flex-start" as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  overdueToggleText: { fontSize: 12, fontWeight: "600" as const },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  bucket: { gap: 8 },
  bucketHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  bucketDot: { width: 8, height: 8, borderRadius: 4 },
  bucketTitle: { fontSize: 15, fontWeight: "700" as const, letterSpacing: -0.2, flex: 1 },
  bucketCount: { fontSize: 13, fontWeight: "600" as const },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: "600" as const, letterSpacing: -0.2 },
  rowSub: { fontSize: 12 },
  rowDue: {
    fontSize: 12,
    fontWeight: "600" as const,
    maxWidth: 110,
    textAlign: "right" as const,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  emptyH: { fontSize: 18, fontWeight: "700" as const, marginTop: 6 },
  emptyB: { fontSize: 14, textAlign: "center" as const, lineHeight: 20 },
});
