import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import EmojiPicker from "@/components/EmojiPicker";

export default function ModifyThing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { things, updateThing } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const thing = things.find(e => e.id === id);
  const [name, setName] = useState(thing?.name ?? "");
  const [emoji, setEmoji] = useState(thing?.emoji ?? "🔧");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const save = useCallback(() => {
    if (!name.trim() || !id) return;
    updateThing(id, { name: name.trim(), emoji });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, emoji, id, updateThing, router]);

  if (!thing) return null;

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Edit Thing</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={s.f} keyboardShouldPersistTaps="handled">
        <Text style={[s.l, { color: colors.textSecondary }]}>Name</Text>
        <TextInput style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} />
        <Text style={[s.l, { color: colors.textSecondary, marginTop: 24 }]}>Emoji</Text>
        <TouchableOpacity style={[s.emojiSelect, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowEmojiPicker(true)} activeOpacity={0.7}>
          <Text style={s.emojiPreview}>{emoji}</Text>
          <Text style={[s.emojiHint, { color: colors.textSecondary }]}>Tap to change</Text>
        </TouchableOpacity>
        <EmojiPicker visible={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} onSelect={setEmoji} currentEmoji={emoji} />
        <TouchableOpacity style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}><Text style={s.st}>Save Changes</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  ht: { fontSize: 18, fontWeight: "700" as const },
  f: { paddingHorizontal: 20, paddingBottom: 40 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  emojiSelect: { flexDirection: "row" as const, alignItems: "center" as const, height: 56, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, gap: 12 },
  emojiPreview: { fontSize: 32 },
  emojiHint: { fontSize: 14 },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 },
  st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
