import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChevronRight, Check, ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { templateAreas, TemplateArea, TemplateThing } from "@/constants/templates";
import { Area } from "@/constants/types";

interface Props {
  onDone: (area: Area) => void;
  onCancel?: () => void;
  showBack?: boolean;
}

interface ThingCheckState {
  key: string;
  selected: boolean;
}

export default function AreaCreationFlow({ onDone, onCancel, showBack }: Props) {
  const { colors } = useTheme();
  const { addArea, addThing, addTasks } = useData();
  const [selectedArea, setSelectedArea] = useState<TemplateArea | null>(null);
  const [thingChecks, setThingChecks] = useState<ThingCheckState[]>([]);
  const [namedInput, setNamedInput] = useState("");
  const [customAreaName, setCustomAreaName] = useState("");

  const pickArea = useCallback((t: TemplateArea) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedArea(t);
    if (t.pattern === "checkbox" && t.things) {
      setThingChecks(t.things.map((th) => ({ key: th.key, selected: true })));
    }
    setNamedInput("");
    setCustomAreaName("");
  }, []);

  const toggleThing = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThingChecks((prev) => prev.map((t) => (t.key === key ? { ...t, selected: !t.selected } : t)));
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedArea(null);
  }, []);

  const createCheckbox = useCallback(() => {
    if (!selectedArea || !selectedArea.things) return;
    const area = addArea(selectedArea.name, selectedArea.emoji, selectedArea.key);
    const selectedThings = selectedArea.things.filter(
      (th) => thingChecks.find((c) => c.key === th.key)?.selected
    );
    selectedThings.forEach((th: TemplateThing) => {
      const thing = addThing({
        name: th.name,
        type: th.type,
        emoji: th.emoji,
        areaId: area.id,
      });
      if (th.tasks.length > 0) {
        addTasks(
          th.tasks.map((t) => ({
            thingId: thing.id,
            name: t.name,
            intervalValue: t.intervalValue,
            intervalUnit: t.intervalUnit,
            lastCompletedDate: null,
            notes: "",
          }))
        );
      }
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone(area);
  }, [selectedArea, thingChecks, addArea, addThing, addTasks, onDone]);

  const createNamed = useCallback(() => {
    if (!selectedArea || !selectedArea.defaultThing || !namedInput.trim()) return;
    const area = addArea(selectedArea.name, selectedArea.emoji, selectedArea.key);
    const dt = selectedArea.defaultThing;
    const thing = addThing({
      name: namedInput.trim(),
      type: dt.type,
      emoji: dt.emoji,
      areaId: area.id,
    });
    if (dt.tasks.length > 0) {
      addTasks(
        dt.tasks.map((t) => ({
          thingId: thing.id,
          name: t.name,
          intervalValue: t.intervalValue,
          intervalUnit: t.intervalUnit,
          lastCompletedDate: null,
          notes: "",
        }))
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone(area);
  }, [selectedArea, namedInput, addArea, addThing, addTasks, onDone]);

  const createCustom = useCallback(() => {
    if (!customAreaName.trim()) return;
    const area = addArea(customAreaName.trim(), "✨");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone(area);
  }, [customAreaName, addArea, onDone]);

  const checkedCount = useMemo(() => thingChecks.filter((c) => c.selected).length, [thingChecks]);

  if (!selectedArea) {
    return (
      <View style={s.flex}>
        <View style={s.topRow}>
          {showBack && onCancel && (
            <TouchableOpacity onPress={onCancel} style={s.backBtn} activeOpacity={0.6}>
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[s.stepT, { color: colors.text }]}>Pick an Area</Text>
          <Text style={[s.stepS, { color: colors.textSecondary }]}>
            Choose a category to start with. You can add more later.
          </Text>
          <View style={s.grid}>
            {templateAreas.map((t) => (
              <TouchableOpacity
                key={t.key}
                testID={`area-tpl-${t.key}`}
                style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => pickArea(t)}
                activeOpacity={0.7}
              >
                <Text style={s.cardE}>{t.emoji}</Text>
                <Text style={[s.cardN, { color: colors.text }]} numberOfLines={2}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (selectedArea.pattern === "checkbox" && selectedArea.things) {
    return (
      <View style={s.flex}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.6}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[s.headerEmoji]}>{selectedArea.emoji}</Text>
          <Text style={[s.stepT, { color: colors.text }]}>{selectedArea.name}</Text>
          <Text style={[s.stepS, { color: colors.textSecondary }]}>
            Pick what you want to track. Uncheck anything that doesn&apos;t apply.
          </Text>
          {selectedArea.things.map((th) => {
            const checked = thingChecks.find((c) => c.key === th.key)?.selected ?? false;
            return (
              <TouchableOpacity
                key={th.key}
                testID={`thing-tpl-${th.key}`}
                style={[s.thingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => toggleThing(th.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.cb,
                    {
                      backgroundColor: checked ? colors.accent : "transparent",
                      borderColor: checked ? colors.accent : colors.border,
                    },
                  ]}
                >
                  {checked && <Check size={14} color="#FFF" strokeWidth={3} />}
                </View>
                <Text style={s.thingEmoji}>{th.emoji}</Text>
                <View style={s.thingInfo}>
                  <Text style={[s.thingName, { color: colors.text }]}>{th.name}</Text>
                  <Text style={[s.thingMeta, { color: colors.textSecondary }]}>
                    {th.tasks.length} {th.tasks.length === 1 ? "task" : "tasks"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            testID="create-area-checkbox"
            style={[s.btn, { backgroundColor: checkedCount > 0 ? colors.accent : colors.border, marginTop: 20 }]}
            onPress={createCheckbox}
            disabled={checkedCount === 0}
            activeOpacity={0.8}
          >
            <Text style={s.btnT}>
              Create {selectedArea.name} ({checkedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (selectedArea.pattern === "named") {
    return (
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.6}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[s.headerEmoji]}>{selectedArea.emoji}</Text>
          <Text style={[s.stepT, { color: colors.text }]}>{selectedArea.name}</Text>
          <Text style={[s.stepS, { color: colors.textSecondary }]}>{selectedArea.thingPrompt}</Text>
          <TextInput
            testID="named-thing-input"
            style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Type a name..."
            placeholderTextColor={colors.textSecondary}
            value={namedInput}
            onChangeText={setNamedInput}
            autoFocus
          />
          {selectedArea.defaultThing && (
            <View style={[s.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.previewT, { color: colors.textSecondary }]}>We&apos;ll set up these tasks</Text>
              {selectedArea.defaultThing.tasks.map((t, i) => (
                <Text key={i} style={[s.previewItem, { color: colors.text }]}>
                  · {t.name} <Text style={{ color: colors.textSecondary }}>— every {t.intervalValue} {t.intervalUnit}</Text>
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity
            testID="create-area-named"
            style={[s.btn, { backgroundColor: namedInput.trim() ? colors.accent : colors.border, marginTop: 20 }]}
            onPress={createNamed}
            disabled={!namedInput.trim()}
            activeOpacity={0.8}
          >
            <Text style={s.btnT}>Create</Text>
            <ChevronRight size={20} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.topRow}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.6}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.headerEmoji}>✨</Text>
        <Text style={[s.stepT, { color: colors.text }]}>Custom Area</Text>
        <Text style={[s.stepS, { color: colors.textSecondary }]}>
          Name your Area. You&apos;ll add Things and tasks from scratch.
        </Text>
        <TextInput
          testID="custom-area-input"
          style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Garden, Workshop..."
          placeholderTextColor={colors.textSecondary}
          value={customAreaName}
          onChangeText={setCustomAreaName}
          autoFocus
        />
        <TouchableOpacity
          testID="create-area-custom"
          style={[s.btn, { backgroundColor: customAreaName.trim() ? colors.accent : colors.border, marginTop: 20 }]}
          onPress={createCustom}
          disabled={!customAreaName.trim()}
          activeOpacity={0.8}
        >
          <Text style={s.btnT}>Create</Text>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, minHeight: 36 },
  backBtn: { padding: 6 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  stepT: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.4, marginBottom: 6 },
  stepS: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  card: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
  },
  cardE: { fontSize: 40 },
  cardN: { fontSize: 15, fontWeight: "600" as const, textAlign: "center" as const },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  thingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  cb: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  thingEmoji: { fontSize: 24 },
  thingInfo: { flex: 1 },
  thingName: { fontSize: 16, fontWeight: "500" as const },
  thingMeta: { fontSize: 13, marginTop: 2 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  preview: { marginTop: 18, padding: 14, borderRadius: 12, borderWidth: 1 },
  previewT: { fontSize: 12, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 },
  previewItem: { fontSize: 14, lineHeight: 22 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 6,
  },
  btnT: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
