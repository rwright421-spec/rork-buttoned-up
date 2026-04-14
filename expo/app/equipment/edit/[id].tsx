import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { EquipmentType } from "@/constants/types";
import { equipmentEmojis, equipmentTypeLabels } from "@/constants/templates";
const EQ_TYPES: EquipmentType[] = ["home","auto","rental","vacation","hottub","generator","lawn","boat","custom"];
export default function ModifyEquipment() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { colors } = useTheme();
  const { equipment, updateEquipment } = useData(); const router = useRouter(); const insets = useSafeAreaInsets();
  const eq = equipment.find(e => e.id === id);
  const [name, setName] = useState(eq?.name ?? ""); const [type, setType] = useState<EquipmentType>(eq?.type ?? "home"); const [emoji, setEmoji] = useState(eq?.emoji ?? "🔧");
  const save = useCallback(() => { if (!name.trim() || !id) return; updateEquipment(id, { name: name.trim(), type, emoji });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back();
  }, [name, type, emoji, id, updateEquipment, router]);
  if (!eq) return null;
  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}><TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity><Text style={[s.ht, { color: colors.text }]}>Edit Equipment</Text><View style={{ width: 24 }} /></View>
      <ScrollView contentContainerStyle={s.f} keyboardShouldPersistTaps="handled">
        <Text style={[s.l, { color: colors.textSecondary }]}>Name</Text>
        <TextInput style={[s.i, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} />
        <Text style={[s.l, { color: colors.textSecondary, marginTop: 24 }]}>Type</Text>
        <View style={s.g}>{EQ_TYPES.map(t => { const a = type === t; return (
          <TouchableOpacity key={t} style={[s.tc, { backgroundColor: a ? colors.accent+"14" : colors.card, borderColor: a ? colors.accent : colors.border }]} onPress={() => { setType(t); setEmoji(equipmentEmojis[t]); }} activeOpacity={0.7}>
            <Text style={s.te}>{equipmentEmojis[t]}</Text><Text style={[s.tl, { color: a ? colors.accent : colors.text }]}>{equipmentTypeLabels[t]}</Text>
          </TouchableOpacity>); })}</View>
        <TouchableOpacity style={[s.sb, { backgroundColor: name.trim() ? colors.accent : colors.border }]} onPress={save} disabled={!name.trim()} activeOpacity={0.8}><Text style={s.st}>Save Changes</Text></TouchableOpacity>
      </ScrollView>
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
