import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { ThingType } from "@/constants/types";
import { thingEmojis } from "@/constants/templates";
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

export default function NewThingForm() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { colors } = useTheme();
  const { addThing, areas } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const area = areas.find(a => a.id === areaId);
  const inferredType = area ? inferTypeFromArea(area.name) : "custom";
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(thingEmojis[inferredType]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const save = useCallback(() => {
    if (!name.trim() || !areaId) return;
    const thing = addThing({ name: name.trim(), type: inferredType, emoji, areaId });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    setTimeout(() => router.push(`/task/add-bulk?thingId=${thing.id}&type=${inferredType}`), 200);
  }, [name, inferredType, emoji, areaId, addThing, router]);

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Add Thing</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.f} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {area && <Text style={[s.ctx, { color: colors.textSecondary }]}>In {area.emoji} {area.name}</Text>}
          <Text style={[s.l, { color: colors.textSecondary }]}>Name</Text>
          <TextInput testID="thing-name" style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="e.g. HVAC System" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} autoFocus />
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 24 }]}>Emoji</Text>
          <TouchableOpacity style={[s.emojiSelect, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowEmojiPicker(true)} activeOpacity={0.7}>
            <Text style={s.emojiPreview}>{emoji}</Text>
            <Text style={[s.emojiHint, { color: colors.textSecondary }]}>Tap to change</Text>
          </TouchableOpacity>
          <EmojiPicker visible={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} onSelect={setEmoji} currentEmoji={emoji} />
          <TouchableOpacity testID="save-thing" style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}><Text style={s.st}>Save & Add Tasks</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  ht: { fontSize: 18, fontWeight: "700" as const },
  f: { paddingHorizontal: 20, paddingBottom: 40 },
  ctx: { fontSize: 13, marginBottom: 16, marginLeft: 2 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  emojiSelect: { flexDirection: "row" as const, alignItems: "center" as const, height: 56, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, gap: 12 },
  emojiPreview: { fontSize: 32 },
  emojiHint: { fontSize: 14 },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 },
  st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
