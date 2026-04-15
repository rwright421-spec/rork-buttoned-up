import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  X,
  Check,
  FolderOpen,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { getTaskStatus, getWorstStatus, statusSortKey } from "@/utils/dates";
import { TaskStatus, Equipment, EquipmentGroup } from "@/constants/types";
import EmojiPicker from "@/components/EmojiPicker";

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
    case "overdue":
      return c.overdue;
    case "due_soon":
      return c.dueSoon;
    case "current":
      return c.current;
    case "not_started":
      return c.notStarted;
  }
}

interface EnrichedEquipment extends Equipment {
  worstStatus: TaskStatus;
  counts: Record<TaskStatus, number>;
  taskCount: number;
}

export default function MainHomeScreen() {
  const { colors } = useTheme();
  const {
    equipment,
    tasks,
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderEquipment,
    moveEquipmentToGroup,
  } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isReordering, setIsReordering] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EquipmentGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningEquipment, setAssigningEquipment] = useState<string | null>(null);
  const [groupEmoji, setGroupEmoji] = useState("📁");
  const [showGroupEmojiPicker, setShowGroupEmojiPicker] = useState(false);

  const enriched = useMemo(() => {
    return equipment.map((eq) => {
      const et = tasks.filter((t) => t.equipmentId === eq.id);
      const st = et.map(getTaskStatus);
      const ws = getWorstStatus(st);
      const cn: Record<TaskStatus, number> = {
        overdue: 0,
        due_soon: 0,
        current: 0,
        not_started: 0,
      };
      st.forEach((s) => cn[s]++);
      return { ...eq, worstStatus: ws, counts: cn, taskCount: et.length } as EnrichedEquipment;
    });
  }, [equipment, tasks]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.sortOrder - b.sortOrder),
    [groups]
  );

  const sortedEquipment = useMemo(
    () => [...enriched].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [enriched]
  );

  const ungroupedEquipment = useMemo(
    () => sortedEquipment.filter((e) => !e.groupId),
    [sortedEquipment]
  );

  const equipmentByGroup = useMemo(() => {
    const map = new Map<string, EnrichedEquipment[]>();
    sortedGroups.forEach((g) => {
      map.set(
        g.id,
        sortedEquipment.filter((e) => e.groupId === g.id)
      );
    });
    return map;
  }, [sortedGroups, sortedEquipment]);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const onAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/equipment/add");
  }, [router]);

  const toggleReorder = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReordering((prev) => !prev);
  }, []);

  const moveEquipment = useCallback(
    (index: number, direction: "up" | "down", list: EnrichedEquipment[], groupId: string | null) => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= list.length) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const swapped = [...list];
      [swapped[index], swapped[newIndex]] = [swapped[newIndex], swapped[index]];

      const newSortOrders = new Map<string, number>();
      swapped.forEach((item, i) => newSortOrders.set(item.id, i));

      const updated = equipment.map((eq) => {
        const newOrder = newSortOrders.get(eq.id);
        if (newOrder !== undefined) {
          return { ...eq, sortOrder: newOrder };
        }
        return eq;
      });

      reorderEquipment(updated);
    },
    [equipment, reorderEquipment]
  );

  const openCreateGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupName("");
    setGroupEmoji("📁");
    setShowGroupModal(true);
  }, []);

  const openEditGroup = useCallback((group: EquipmentGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupEmoji(group.emoji ?? "📁");
    setShowGroupModal(true);
  }, []);

  const saveGroup = useCallback(() => {
    if (!groupName.trim()) return;
    if (editingGroup) {
      updateGroup(editingGroup.id, { name: groupName.trim(), emoji: groupEmoji });
    } else {
      addGroup(groupName.trim(), groupEmoji);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowGroupModal(false);
    setGroupName("");
    setGroupEmoji("📁");
    setEditingGroup(null);
  }, [groupName, groupEmoji, editingGroup, addGroup, updateGroup]);

  const confirmDeleteGroup = useCallback(
    (group: EquipmentGroup) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        `Delete "${group.name}"?`,
        "Equipment in this group will become ungrouped.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteGroup(group.id),
          },
        ]
      );
    },
    [deleteGroup]
  );

  const openAssignModal = useCallback((equipmentId: string) => {
    setAssigningEquipment(equipmentId);
    setShowAssignModal(true);
  }, []);

  const assignToGroup = useCallback(
    (groupId: string | null) => {
      if (assigningEquipment) {
        moveEquipmentToGroup(assigningEquipment, groupId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setShowAssignModal(false);
      setAssigningEquipment(null);
    },
    [assigningEquipment, moveEquipmentToGroup]
  );

  const renderEquipmentCard = (eq: EnrichedEquipment, index: number, list: EnrichedEquipment[], groupId: string | null) => {
    const bc = resolveStatusColor(eq.worstStatus, colors);
    return (
      <View key={eq.id} style={styles.cardWrapper}>
        {isReordering && (
          <View style={styles.reorderControls}>
            <TouchableOpacity
              onPress={() => moveEquipment(index, "up", list, groupId)}
              style={[styles.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              disabled={index === 0}
              activeOpacity={0.6}
            >
              <ArrowUp size={16} color={index === 0 ? colors.border : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveEquipment(index, "down", list, groupId)}
              style={[styles.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              disabled={index === list.length - 1}
              activeOpacity={0.6}
            >
              <ArrowDown size={16} color={index === list.length - 1 ? colors.border : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openAssignModal(eq.id)}
              style={[styles.reorderBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.6}
            >
              <FolderOpen size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          testID={`eq-${eq.id}`}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            isReordering && styles.cardReordering,
          ]}
          onPress={() => {
            if (isReordering) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/equipment/${eq.id}`);
          }}
          activeOpacity={isReordering ? 1 : 0.7}
        >
          <View style={styles.row}>
            {isReordering && (
              <View style={styles.gripArea}>
                <GripVertical size={18} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.iconBox}>
              <Text style={styles.emoji}>{eq.emoji}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {eq.name}
              </Text>
              <Text style={[styles.taskNum, { color: colors.textSecondary }]}>
                {eq.taskCount} {eq.taskCount === 1 ? "task" : "tasks"}
              </Text>
              {eq.taskCount > 0 && (
                <View style={styles.statusRow}>
                  {eq.counts.overdue > 0 && (
                    <Text style={[styles.st, { color: colors.overdue }]}>
                      {eq.counts.overdue} overdue
                    </Text>
                  )}
                  {eq.counts.due_soon > 0 && (
                    <Text style={[styles.st, { color: colors.dueSoon }]}>
                      {eq.counts.overdue > 0 ? " · " : ""}
                      {eq.counts.due_soon} due soon
                    </Text>
                  )}
                  {eq.counts.current > 0 && (
                    <Text style={[styles.st, { color: colors.current }]}>
                      {eq.counts.overdue > 0 || eq.counts.due_soon > 0 ? " · " : ""}
                      {eq.counts.current} current
                    </Text>
                  )}
                </View>
              )}
            </View>
            {!isReordering && (
              <View style={[styles.pill, { backgroundColor: bc + "14" }]}>
                <View style={[styles.dot, { backgroundColor: bc }]} />
                <Text style={[styles.pillT, { color: bc }]}>
                  {STATUS_LABELS[eq.worstStatus]}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGroupSection = (group: EquipmentGroup) => {
    const groupEquipment = equipmentByGroup.get(group.id) ?? [];
    const isCollapsed = collapsedGroups.has(group.id);
    const groupOverallStatus = getWorstStatus(groupEquipment.map((e) => e.worstStatus));
    const groupStatusColor = resolveStatusColor(groupOverallStatus, colors);

    return (
      <View key={group.id} style={styles.groupSection}>
        <TouchableOpacity
          style={[styles.groupHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => toggleGroupCollapse(group.id)}
          activeOpacity={0.7}
        >
          <View style={styles.groupHeaderLeft}>
            {isCollapsed ? (
              <ChevronRight size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
            <Text style={styles.groupEmoji}>{group.emoji ?? "📁"}</Text>
            <View style={[styles.groupDot, { backgroundColor: groupStatusColor }]} />
            <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
            <View style={[styles.groupCount, { backgroundColor: colors.border + "80" }]}>
              <Text style={[styles.groupCountText, { color: colors.textSecondary }]}>
                {groupEquipment.length}
              </Text>
            </View>
          </View>
          {isReordering && (
            <View style={styles.groupActions}>
              <TouchableOpacity
                onPress={() => openEditGroup(group)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Pencil size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDeleteGroup(group)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
        {!isCollapsed && (
          <View style={styles.groupContent}>
            {groupEquipment.length === 0 ? (
              <Text style={[styles.groupEmpty, { color: colors.textSecondary }]}>
                No equipment in this group
              </Text>
            ) : (
              groupEquipment.map((eq, i) => renderEquipmentCard(eq, i, groupEquipment, group.id))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Buttoned Up</Text>
          {equipment.length > 0 && (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {equipment.length} {equipment.length === 1 ? "item" : "items"} tracked
            </Text>
          )}
        </View>
        <View style={styles.topActions}>
          {equipment.length > 0 && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isReordering ? colors.accent : colors.card,
                  borderColor: isReordering ? colors.accent : colors.border,
                },
              ]}
              onPress={toggleReorder}
              activeOpacity={0.7}
            >
              {isReordering ? (
                <Check size={18} color="#FFF" strokeWidth={2.5} />
              ) : (
                <GripVertical size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="add-equipment-btn"
            style={[styles.fab, { backgroundColor: colors.accent }]}
            onPress={onAdd}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {equipment.length === 0 && groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔧</Text>
          <Text style={[styles.emptyH, { color: colors.text }]}>Nothing to maintain yet.</Text>
          <Text style={[styles.emptyB, { color: colors.textSecondary }]}>
            Tap + to add your first piece of equipment.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {isReordering && (
            <TouchableOpacity
              style={[styles.createGroupBtn, { backgroundColor: colors.card, borderColor: colors.accent + "40" }]}
              onPress={openCreateGroup}
              activeOpacity={0.7}
            >
              <FolderPlus size={18} color={colors.accent} />
              <Text style={[styles.createGroupText, { color: colors.accent }]}>Create Group</Text>
            </TouchableOpacity>
          )}

          {sortedGroups.map(renderGroupSection)}

          {ungroupedEquipment.length > 0 && sortedGroups.length > 0 && (
            <View style={styles.ungroupedLabel}>
              <Text style={[styles.ungroupedText, { color: colors.textSecondary }]}>Ungrouped</Text>
            </View>
          )}
          {ungroupedEquipment.map((eq, i) =>
            renderEquipmentCard(eq, i, ungroupedEquipment, null)
          )}
        </ScrollView>
      )}

      <Modal
        visible={showGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGroupModal(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingGroup ? "Edit Group" : "New Group"}
              </Text>
              <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.groupEmojiRow}>
              <TouchableOpacity
                style={[styles.groupEmojiBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowGroupEmojiPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.groupEmojiBtnText}>{groupEmoji}</Text>
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, flex: 1 },
                ]}
                placeholder="Group name..."
                placeholderTextColor={colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[
                styles.modalSave,
                { backgroundColor: groupName.trim() ? colors.accent : colors.border },
              ]}
              onPress={saveGroup}
              disabled={!groupName.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSaveText}>
                {editingGroup ? "Save" : "Create"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <EmojiPicker
        visible={showGroupEmojiPicker}
        onClose={() => setShowGroupEmojiPicker(false)}
        onSelect={(e) => { setGroupEmoji(e); setShowGroupEmojiPicker(false); }}
        currentEmoji={groupEmoji}
      />

      <Modal
        visible={showAssignModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAssignModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Move to Group</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.assignList}>
              <TouchableOpacity
                style={[styles.assignOption, { borderColor: colors.border }]}
                onPress={() => assignToGroup(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.assignOptionText, { color: colors.text }]}>No Group</Text>
                {assigningEquipment &&
                  equipment.find((e) => e.id === assigningEquipment)?.groupId === null && (
                    <Check size={18} color={colors.accent} />
                  )}
              </TouchableOpacity>
              {sortedGroups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.assignOption, { borderColor: colors.border }]}
                  onPress={() => assignToGroup(g.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.assignOptionText, { color: colors.text }]}>{g.name}</Text>
                  {assigningEquipment &&
                    equipment.find((e) => e.id === assigningEquipment)?.groupId === g.id && (
                      <Check size={18} color={colors.accent} />
                    )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, gap: 10 },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    gap: 8,
    marginBottom: 6,
  },
  createGroupText: { fontSize: 15, fontWeight: "600" as const },
  groupSection: { marginBottom: 4 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  groupEmoji: { fontSize: 20 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupName: { fontSize: 16, fontWeight: "700" as const, flex: 1 },
  groupCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  groupCountText: { fontSize: 12, fontWeight: "600" as const },
  groupActions: { flexDirection: "row", gap: 14, marginLeft: 8 },
  groupContent: { paddingLeft: 8, paddingTop: 8, gap: 8 },
  groupEmpty: { fontSize: 13, paddingVertical: 12, paddingLeft: 8 },
  ungroupedLabel: { marginTop: 8, marginBottom: 4 },
  ungroupedText: { fontSize: 13, fontWeight: "600" as const, marginLeft: 4 },
  cardWrapper: { flexDirection: "row", alignItems: "center" },
  reorderControls: { flexDirection: "column", gap: 4, marginRight: 8 },
  reorderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, flex: 1 },
  cardReordering: { opacity: 0.95 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  gripArea: { justifyContent: "center", marginRight: 8, paddingTop: 14 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  emoji: { fontSize: 34 },
  info: { flex: 1, marginRight: 8, paddingTop: 2 },
  name: { fontSize: 17, fontWeight: "600" as const, marginBottom: 2 },
  taskNum: { fontSize: 13, marginBottom: 4 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  st: { fontSize: 12, fontWeight: "500" as const },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillT: { fontSize: 11, fontWeight: "600" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyH: { fontSize: 20, fontWeight: "600" as const, marginBottom: 8, textAlign: "center" },
  emptyB: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  modalContent: { borderRadius: 16, padding: 24 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" as const },
  groupEmojiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  groupEmojiBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  groupEmojiBtnText: { fontSize: 28 },
  modalInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalSave: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { color: "#FFF", fontSize: 16, fontWeight: "600" as const },
  assignList: { maxHeight: 300 },
  assignOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  assignOptionText: { fontSize: 16, fontWeight: "500" as const },
});
