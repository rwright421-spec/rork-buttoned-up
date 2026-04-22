import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { ThingType } from "@/constants/types";
import { thingEmojis, templateAreas, TemplateThing, thingTemplatesByEmoji } from "@/constants/templates";
import EmojiPicker from "@/components/EmojiPicker";

function inferTypeFromArea(areaName: string): ThingType {
  const n = areaName.toLowerCase();
  if (n.includes("home") || n.includes("house")) return "home";
  if (n.includes("auto") || n.includes("car") || n.includes("vehicle") || n.includes("garage")) return "auto";
  if (n.includes("rental")) return "rental";
  if (n.includes("vacation") || n.includes("cabin")) return "vacation";
  if (n.includes("hot tub") || n.includes("pool") || n.includes("spa")) return "hottub";
  if (n.includes("generator")) return "generator";
  if (n.includes("lawn") || n.includes("yard") || n.includes("garden")) return "lawn";
  if (n.includes("boat") || n.includes("marine")) return "boat";
  return "custom";
}

interface ThingCheckState {
  key: string;
  selected: boolean;
}

export default function NewThingForm() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { colors } = useTheme();
  const { addThing, addTasks, areas, things } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const area = areas.find((a) => a.id === areaId);
  const templateArea = useMemo(
    () => (area?.templateKey ? templateAreas.find((t) => t.key === area.templateKey) : undefined),
    [area]
  );

  const existingThingNames = useMemo(() => {
    if (!areaId) return new Set<string>();
    return new Set(
      things.filter((t) => t.areaId === areaId).map((t) => t.name.toLowerCase().trim())
    );
  }, [things, areaId]);

  const remainingTemplateThings = useMemo<TemplateThing[]>(() => {
    if (!templateArea?.things) return [];
    return templateArea.things.filter((th) => !existingThingNames.has(th.name.toLowerCase().trim()));
  }, [templateArea, existingThingNames]);

  const [checks, setChecks] = useState<ThingCheckState[]>(() =>
    remainingTemplateThings.map((th) => ({ key: th.key, selected: true }))
  );
  const [customMode, setCustomMode] = useState<boolean>(
    templateArea?.pattern === "custom" || !templateArea
  );
  const [namedMode] = useState<boolean>(templateArea?.pattern === "named");
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState<string>("📦");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [applyTemplate, setApplyTemplate] = useState<boolean>(false);

  const matchedTemplate = useMemo<TemplateThing | undefined>(
    () => thingTemplatesByEmoji[customEmoji],
    [customEmoji]
  );

  const toggle = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecks((prev) => prev.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)));
  }, []);

  const checkedCount = useMemo(() => checks.filter((c) => c.selected).length, [checks]);

  const saveCheckbox = useCallback(() => {
    if (!areaId || !templateArea) return;
    const selectedThings = remainingTemplateThings.filter(
      (th) => checks.find((c) => c.key === th.key)?.selected
    );
    selectedThings.forEach((th) => {
      const t = addThing({
        name: th.name,
        type: th.type,
        emoji: th.emoji,
        areaId,
      });
      if (th.tasks.length > 0) {
        addTasks(
          th.tasks.map((k) => ({
            thingId: t.id,
            name: k.name,
            schedule: {
              kind: 'interval_from_completion' as const,
              intervalValue: k.intervalValue,
              intervalUnit: k.intervalUnit,
            },
            lastCompletedDate: null,
            notes: "",
          }))
        );
      }
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [areaId, templateArea, remainingTemplateThings, checks, addThing, addTasks, router]);

  const saveNamed = useCallback(() => {
    if (!areaId || !templateArea?.defaultThing || !customName.trim()) return;
    const dt = templateArea.defaultThing;
    const t = addThing({
      name: customName.trim(),
      type: dt.type,
      emoji: dt.emoji,
      areaId,
    });
    if (dt.tasks.length > 0) {
      addTasks(
        dt.tasks.map((k) => ({
          thingId: t.id,
          name: k.name,
          schedule: {
            kind: 'interval_from_completion' as const,
            intervalValue: k.intervalValue,
            intervalUnit: k.intervalUnit,
          },
          lastCompletedDate: null,
          notes: "",
        }))
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [areaId, templateArea, customName, addThing, addTasks, router]);

  const saveCustom = useCallback(() => {
    if (!customName.trim() || !areaId || !area) return;
    const created = addThing({ name: customName.trim(), type: "custom", emoji: customEmoji, areaId });
    if (applyTemplate && matchedTemplate && matchedTemplate.tasks.length > 0) {
      addTasks(
        matchedTemplate.tasks.map((k) => ({
          thingId: created.id,
          name: k.name,
          schedule: {
            kind: 'interval_from_completion' as const,
            intervalValue: k.intervalValue,
            intervalUnit: k.intervalUnit,
          },
          lastCompletedDate: null,
          notes: "",
        }))
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [customName, customEmoji, areaId, area, addThing, addTasks, applyTemplate, matchedTemplate, router]);

  const showCheckboxList =
    templateArea?.pattern === "checkbox" && !customMode && remainingTemplateThings.length > 0;

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Add Thing</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[s.f, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {area && (
            <Text style={[s.ctx, { color: colors.textSecondary }]}>
              Adding to {area.emoji} {area.name}
            </Text>
          )}

          {showCheckboxList && (
            <>
              <Text style={[s.stepT, { color: colors.text }]}>What are you tracking?</Text>
              <Text style={[s.stepS, { color: colors.textSecondary }]}>
                Pick from our suggestions, or add your own.
              </Text>
              {remainingTemplateThings.map((th) => {
                const checked = checks.find((c) => c.key === th.key)?.selected ?? false;
                return (
                  <TouchableOpacity
                    key={th.key}
                    testID={`tpl-${th.key}`}
                    style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => toggle(th.key)}
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
                    <Text style={s.rowE}>{th.emoji}</Text>
                    <View style={s.rowInfo}>
                      <Text style={[s.rowN, { color: colors.text }]}>{th.name}</Text>
                      <Text style={[s.rowM, { color: colors.textSecondary }]}>
                        {th.tasks.length} {th.tasks.length === 1 ? "task" : "tasks"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[s.altBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCustomMode(true);
                }}
                activeOpacity={0.7}
              >
                <Plus size={18} color={colors.textSecondary} />
                <Text style={[s.altBtnT, { color: colors.text }]}>Custom Thing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="save-checkbox"
                style={[s.sb, { backgroundColor: checkedCount > 0 ? colors.accent : colors.border }]}
                onPress={saveCheckbox}
                disabled={checkedCount === 0}
                activeOpacity={0.8}
              >
                <Text style={s.st}>
                  Add {checkedCount} {checkedCount === 1 ? "Thing" : "Things"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {namedMode && !customMode && templateArea?.defaultThing && (
            <>
              <Text style={[s.stepT, { color: colors.text }]}>{templateArea.thingPrompt}</Text>
              <TextInput
                testID="named-name"
                style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Type a name..."
                placeholderTextColor={colors.textSecondary}
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
              <View style={[s.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.previewT, { color: colors.textSecondary }]}>We&apos;ll set up these tasks</Text>
                {templateArea.defaultThing.tasks.map((t, i) => (
                  <Text key={i} style={[s.previewItem, { color: colors.text }]}>
                    · {t.name}{" "}
                    <Text style={{ color: colors.textSecondary }}>
                      — every {t.intervalValue} {t.intervalUnit}
                    </Text>
                  </Text>
                ))}
              </View>
              <TouchableOpacity
                style={[s.altBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCustomMode(true);
                  setCustomName("");
                }}
                activeOpacity={0.7}
              >
                <Plus size={18} color={colors.textSecondary} />
                <Text style={[s.altBtnT, { color: colors.text }]}>Custom Thing instead</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="save-named"
                style={[s.sb, { backgroundColor: customName.trim() ? colors.accent : colors.border }]}
                onPress={saveNamed}
                disabled={!customName.trim()}
                activeOpacity={0.8}
              >
                <Text style={s.st}>Add</Text>
              </TouchableOpacity>
            </>
          )}

          {customMode && (
            <>
              <Text style={[s.stepT, { color: colors.text }]}>What are you tracking?</Text>
              <Text style={[s.stepS, { color: colors.textSecondary }]}>Name it and pick an emoji.</Text>
              <Text style={[s.l, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                testID="custom-name"
                style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. HVAC System"
                placeholderTextColor={colors.textSecondary}
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
              <Text style={[s.l, { color: colors.textSecondary, marginTop: 20 }]}>Emoji</Text>
              <TouchableOpacity
                style={[s.emojiSelect, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowEmojiPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={s.emojiPreview}>{customEmoji}</Text>
                <Text style={[s.emojiHint, { color: colors.textSecondary }]}>Tap to change</Text>
              </TouchableOpacity>
              <EmojiPicker
                visible={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelect={(e) => {
                  setCustomEmoji(e);
                  setApplyTemplate(false);
                }}
                currentEmoji={customEmoji}
              />
              {matchedTemplate && (
                <View style={[s.suggest, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.suggestT, { color: colors.text }]}>
                    Use the {matchedTemplate.name} template?
                  </Text>
                  <Text style={[s.suggestS, { color: colors.textSecondary }]}>
                    Includes: {matchedTemplate.tasks.map((t) => t.name).join(", ")}
                  </Text>
                  <View style={s.suggestRow}>
                    <TouchableOpacity
                      testID="template-skip"
                      style={[s.suggestBtn, { borderColor: colors.border, backgroundColor: !applyTemplate ? colors.border : "transparent" }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setApplyTemplate(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.suggestBtnT, { color: colors.text }]}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="template-apply"
                      style={[s.suggestBtn, { borderColor: colors.accent, backgroundColor: applyTemplate ? colors.accent : "transparent" }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setApplyTemplate(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.suggestBtnT, { color: applyTemplate ? "#FFF" : colors.accent }]}>
                        Add template tasks
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <TouchableOpacity
                testID="save-custom"
                style={[s.sb, { backgroundColor: customName.trim() ? colors.accent : colors.border }]}
                onPress={saveCustom}
                disabled={!customName.trim()}
                activeOpacity={0.8}
              >
                <Text style={s.st}>Save Thing</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ht: { fontSize: 18, fontWeight: "700" as const },
  f: { paddingHorizontal: 20 },
  ctx: { fontSize: 13, marginBottom: 12, marginLeft: 2 },
  stepT: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.4, marginBottom: 6 },
  stepS: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  cb: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rowE: { fontSize: 22 },
  rowInfo: { flex: 1 },
  rowN: { fontSize: 16, fontWeight: "500" as const },
  rowM: { fontSize: 13, marginTop: 2 },
  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  altBtnT: { fontSize: 15, fontWeight: "500" as const },
  emojiSelect: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  emojiPreview: { fontSize: 32 },
  emojiHint: { fontSize: 14 },
  preview: { marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  previewT: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  previewItem: { fontSize: 14, lineHeight: 22 },
  suggest: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  suggestT: { fontSize: 15, fontWeight: "600" as const, marginBottom: 6 },
  suggestS: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  suggestRow: { flexDirection: "row" as const, gap: 8 },
  suggestBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" as const },
  suggestBtnT: { fontSize: 14, fontWeight: "600" as const },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24 },
  st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
