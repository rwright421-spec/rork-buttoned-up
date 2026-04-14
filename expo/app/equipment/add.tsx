import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { EquipmentType } from "@/constants/types";
import { equipmentEmojis, equipmentTypeLabels } from "@/constants/templates";
const EQ_TYPES: EquipmentType[] = ["home","auto","rental","vacation","hottub","generator","lawn","boat","custom"];
export default function NewEquipmentForm() {
  const { colors } = useTheme(); const { addEquipment } = useData(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [name, setName] = useState(""); const [type, setType] = useState<EquipmentType>("home"); const [emoji, setEmoji] = useState(equipmentEmojis.home);
  const save = useCallback(() => { if (!name.trim()) return; const eq = addEquipment({ name: name.trim(), type, emoji });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back();
    setTimeout(() => router.push(`/task/add-bulk?equipmentId=${eq.id}&type=${type}`), 200);
  }, [name, type, emoji, addEquipment, router]);
  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}><TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity><Text style={[s.ht, { color: colors.text }]}>Add Equipment</Text><View style={{ width: 24 }} /></View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.f} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[s.l, { color: colors.textSecondary }]}>Name</Text>
          <TextInput testID="eq-name" style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="e.g. My Truck" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} autoFocus />
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 24 }]}>Type</Text>
          <View style={s.g}>{EQ_TYPES.map(t => { const a = type === t; return (
            <TouchableOpacity key={t} style={[s.tc, { backgroundColor: a ? colors.accent+"14" : colors.card, borderColor: a ? colors.accent : colors.border }]} onPress={() => { setType(t); setEmoji(equipmentEmojis[t]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.7}>
              <Text style={s.te}>{equipmentEmojis[t]}</Text><Text style={[s.tl, { color: a ? colors.accent : colors.text }]}>{equipmentTypeLabels[t]}</Text>
            </TouchableOpacity>); })}</View>
          <TouchableOpacity testID="save-eq" style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}><Text style={s.st}>Save & Add Tasks</Text></TouchableOpacity>
        </ScrollView></KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1 }, h: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  ht: { fontSize: 18, fontWeight: "700" as const }, f: { paddingHorizontal: 20, paddingBottom: 40 },
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  i: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  g: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tc: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  te: { fontSize: 18 }, tl: { fontSize: 14, fontWeight: "500" as const },
  sb: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 32 }, st: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
