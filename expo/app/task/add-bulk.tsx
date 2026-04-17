import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";
import { ThingType, IntervalUnit } from "@/constants/types";
import { templateTasks } from "@/constants/templates";

interface BI { name: string; intervalValue: number; intervalUnit: IntervalUnit; selected: boolean; alreadyAdded: boolean; }

export default function BulkTaskAdder() {
  const { thingId, type } = useLocalSearchParams<{ thingId: string; type: string }>();
  const { colors } = useTheme();
  const { addTasks, things, tasks } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const thing = things.find(e => e.id === thingId);
  const et = (type as ThingType) || "custom";
  const [items, setItems] = useState<BI[]>(() => {
    const existingNames = new Set(tasks.filter(t => t.thingId === thingId).map(t => t.name.toLowerCase().trim()));
    return templateTasks[et].map(t => {
      const alreadyAdded = existingNames.has(t.name.toLowerCase().trim());
      return { ...t, selected: alreadyAdded ? false : true, alreadyAdded };
    });
  });
  const tog = useCallback((i: number) => {
    setItems(p => { if (p[i]?.alreadyAdded) return p; return p.map((t, j) => j === i ? { ...t, selected: !t.selected } : t); });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  const cnt = useMemo(() => items.filter(i => i.selected).length, [items]);
  const add = useCallback(() => {
    if (!thingId) return;
    addTasks(items.filter(i => i.selected).map(t => ({ thingId, name: t.name, intervalValue: t.intervalValue, intervalUnit: t.intervalUnit, lastCompletedDate: null, notes: "" })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [thingId, items, addTasks, router]);

  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <View style={[s.h, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[s.ht, { color: colors.text }]}>Suggested Tasks</Text>
        <View style={{ width: 24 }} />
      </View>
      {thing && <Text style={[s.sub, { color: colors.textSecondary }]}>For {thing.name}</Text>}
      <ScrollView style={s.sc} contentContainerStyle={[s.si, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? <Text style={[s.em, { color: colors.textSecondary }]}>No templates. Add manually.</Text> : items.map((it, i) => (
          <TouchableOpacity key={i} style={[s.r, { backgroundColor: colors.card, borderColor: colors.border, opacity: it.alreadyAdded ? 0.45 : 1 }]} onPress={() => tog(i)} activeOpacity={it.alreadyAdded ? 0.45 : 0.7} disabled={it.alreadyAdded}>
            {it.alreadyAdded ? <View style={[s.cb, { backgroundColor: colors.border, borderColor: colors.border }]} /> : <View style={[s.cb, { backgroundColor: it.selected ? colors.accent : "transparent", borderColor: it.selected ? colors.accent : colors.border }]}>
              {it.selected && <Check size={14} color="#FFF" strokeWidth={3} />}
            </View>}
            <View style={s.ri}>
              <Text style={[s.rn, { color: colors.text }]}>{it.name}</Text>
              {it.alreadyAdded && <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>Already added</Text>}
              <Text style={[s.rv, { color: colors.textSecondary }]}>Every {it.intervalValue} {it.intervalUnit}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={[s.bb, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity style={[s.ab, { backgroundColor: cnt > 0 ? colors.accent : colors.border }]} onPress={add} disabled={cnt === 0} activeOpacity={0.8}>
          <Text style={s.at}>Add {cnt} {cnt === 1 ? "Task" : "Tasks"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  ht: { fontSize: 18, fontWeight: "700" as const },
  sub: { fontSize: 14, paddingHorizontal: 20, marginBottom: 16 },
  sc: { flex: 1 },
  si: { paddingHorizontal: 20, gap: 8 },
  em: { fontSize: 15, textAlign: "center", paddingTop: 40 },
  r: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  cb: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ri: { flex: 1 },
  rn: { fontSize: 16, fontWeight: "500" as const },
  rv: { fontSize: 13, marginTop: 2 },
  bb: { paddingHorizontal: 20, paddingTop: 12 },
  ab: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  at: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
});
