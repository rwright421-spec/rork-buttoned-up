import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useData } from "@/providers/DataProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { EquipmentType, IntervalUnit } from "@/constants/types";
import { equipmentEmojis, equipmentTypeLabels, templateTasks } from "@/constants/templates";
const EQ_TYPES: EquipmentType[] = ["home","auto","rental","vacation","hottub","generator","lawn","boat","custom"];
interface Tpl { name: string; intervalValue: number; intervalUnit: IntervalUnit; selected: boolean; }
export default function WelcomeOnboarding() {
  const { colors } = useTheme(); const { addEquipment, addTasks, updateSettings } = useData();
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [step, setStep] = useState<number>(0); const [eqName, setEqName] = useState("");
  const [eqType, setEqType] = useState<EquipmentType>("home"); const [eqEmoji, setEqEmoji] = useState(equipmentEmojis.home);
  const [tpls, setTpls] = useState<Tpl[]>([]); const [eqId, setEqId] = useState<string | null>(null);
  const pickType = useCallback((t: EquipmentType) => { setEqType(t); setEqEmoji(equipmentEmojis[t]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);
  const next = useCallback(() => {
    if (step === 0) setStep(1);
    else if (step === 1 && eqName.trim()) {
      const eq = addEquipment({ name: eqName.trim(), type: eqType, emoji: eqEmoji });
      setEqId(eq.id); setTpls(templateTasks[eqType].map(t => ({ ...t, selected: true }))); setStep(2);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [step, eqName, eqType, eqEmoji, addEquipment]);
  const finish = useCallback(() => {
    if (eqId) addTasks(tpls.filter(t => t.selected).map(t => ({ equipmentId: eqId, name: t.name, intervalValue: t.intervalValue, intervalUnit: t.intervalUnit, lastCompletedDate: null, notes: "" })));
    updateSettings({ onboardingComplete: true }); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace("/");
  }, [eqId, tpls, addTasks, updateSettings, router]);
  const toggle = useCallback((i: number) => { setTpls(p => p.map((t, j) => j === i ? { ...t, selected: !t.selected } : t)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);
  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {step > 0 && <View style={s.bar}>{[0,1,2].map(i => <View key={i} style={[s.barDot, { backgroundColor: i <= step ? colors.accent : colors.border, flex: i <= step ? 2 : 1 }]} />)}</View>}
      {step === 0 && <View style={s.center}><Text style={s.bigEmoji}>🔧</Text><Text style={[s.bigTitle, { color: colors.text }]}>Buttoned Up</Text><Text style={[s.bigSub, { color: colors.textSecondary }]}>Track the maintenance that keeps everything running.</Text>
        <TouchableOpacity testID="start" style={[s.btn, { backgroundColor: colors.accent }]} onPress={next} activeOpacity={0.8}><Text style={s.btnT}>Let's Get Started</Text><ChevronRight size={20} color="#FFF" /></TouchableOpacity></View>}
      {step === 1 && <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={s.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[s.stepT, { color: colors.text }]}>What do you want to maintain?</Text>
          <Text style={[s.stepS, { color: colors.textSecondary }]}>Start with one thing. You can always add more.</Text>
          <Text style={[s.lbl, { color: colors.textSecondary }]}>Name</Text>
          <TextInput testID="eq-name" style={[s.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder="e.g. My Truck" placeholderTextColor={colors.textSecondary} value={eqName} onChangeText={setEqName} autoFocus />
          <Text style={[s.lbl, { color: colors.textSecondary, marginTop: 20 }]}>Type</Text>
          <View style={s.grid}>{EQ_TYPES.map(t => { const a = eqType === t; return (
            <TouchableOpacity key={t} style={[s.typeC, { backgroundColor: a ? colors.accent+"14" : colors.card, borderColor: a ? colors.accent : colors.border }]} onPress={() => pickType(t)} activeOpacity={0.7}>
              <Text style={s.typeE}>{equipmentEmojis[t]}</Text><Text style={[s.typeL, { color: a ? colors.accent : colors.text }]}>{equipmentTypeLabels[t]}</Text>
            </TouchableOpacity>); })}</View>
          <TouchableOpacity testID="next" style={[s.btn, { backgroundColor: eqName.trim() ? colors.accent : colors.border, marginTop: 28 }]} onPress={next} disabled={!eqName.trim()} activeOpacity={0.8}><Text style={s.btnT}>Next</Text><ChevronRight size={20} color="#FFF" /></TouchableOpacity>
        </ScrollView></KeyboardAvoidingView>}
      {step === 2 && <ScrollView style={s.flex} contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        <Text style={[s.stepT, { color: colors.text }]}>What needs maintaining?</Text>
        <Text style={[s.stepS, { color: colors.textSecondary }]}>{tpls.length > 0 ? "Uncheck any you don't need." : "Add tasks manually."}</Text>
        {tpls.map((t, i) => <TouchableOpacity key={i} style={[s.tplRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => toggle(i)} activeOpacity={0.7}>
          <View style={[s.cb, { backgroundColor: t.selected ? colors.accent : "transparent", borderColor: t.selected ? colors.accent : colors.border }]}>{t.selected && <Check size={14} color="#FFF" strokeWidth={3} />}</View>
          <View style={s.tplInfo}><Text style={[s.tplName, { color: colors.text }]}>{t.name}</Text><Text style={[s.tplInt, { color: colors.textSecondary }]}>Every {t.intervalValue} {t.intervalUnit}</Text></View>
        </TouchableOpacity>)}
        <TouchableOpacity testID="finish" style={[s.btn, { backgroundColor: colors.accent, marginTop: 24 }]} onPress={finish} activeOpacity={0.8}><Text style={s.btnT}>Done — Take Me In</Text></TouchableOpacity>
      </ScrollView>}
      <View style={{ height: insets.bottom + 20 }} />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1 }, flex: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  bigEmoji: { fontSize: 72, marginBottom: 16 }, bigTitle: { fontSize: 36, fontWeight: "800" as const, letterSpacing: -0.8, marginBottom: 8 },
  bigSub: { fontSize: 17, textAlign: "center", lineHeight: 24, marginBottom: 40 },
  bar: { flexDirection: "row", gap: 6, paddingHorizontal: 20, paddingVertical: 12 }, barDot: { height: 4, borderRadius: 2 },
  form: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  stepT: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.4, marginBottom: 6 }, stepS: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  lbl: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  inp: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeC: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  typeE: { fontSize: 18 }, typeL: { fontSize: 14, fontWeight: "500" as const },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 52, borderRadius: 14, gap: 6, alignSelf: "stretch" },
  btnT: { color: "#FFF", fontSize: 17, fontWeight: "600" as const },
  tplRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  cb: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tplInfo: { flex: 1 }, tplName: { fontSize: 16, fontWeight: "500" as const }, tplInt: { fontSize: 13, marginTop: 2 },
});
