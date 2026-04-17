import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Calendar, ChevronDown, Check } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Schedule, ScheduleKind, IntervalUnit } from "@/constants/types";
import CalendarPicker from "@/components/CalendarPicker";

interface Props {
  schedule: Schedule;
  onChange: (s: Schedule) => void;
}

const KIND_OPTIONS: { kind: ScheduleKind; label: string }[] = [
  { kind: "interval_from_completion", label: "Every N time after I do it" },
  { kind: "interval_from_anchor", label: "Every N time from a fixed date" },
  { kind: "specific_date_recurring", label: "Every year on a specific date" },
  { kind: "specific_date_once", label: "On a specific date (one-time)" },
  { kind: "day_of_month_pattern", label: "First/second/... weekday of every N months" },
  { kind: "weekly_pattern", label: "Every N weeks on specific weekdays" },
];

const UNITS: IntervalUnit[] = ["days", "weeks", "months", "years"];
const NTHS: { v: 1 | 2 | 3 | 4 | -1; label: string }[] = [
  { v: 1, label: "First" }, { v: 2, label: "Second" }, { v: 3, label: "Third" }, { v: 4, label: "Fourth" }, { v: -1, label: "Last" },
];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ScheduleEditor({ schedule, onChange }: Props) {
  const { colors } = useTheme();
  const [showKindMenu, setShowKindMenu] = useState(false);
  const [showAnchorPicker, setShowAnchorPicker] = useState(false);
  const [showOncePicker, setShowOncePicker] = useState(false);

  const kindLabel = KIND_OPTIONS.find(k => k.kind === schedule.kind)?.label ?? "";

  const pickKind = useCallback((kind: ScheduleKind) => {
    setShowKindMenu(false);
    let next: Schedule;
    switch (kind) {
      case "interval_from_completion":
        next = { kind, intervalValue: 3, intervalUnit: "months" }; break;
      case "interval_from_anchor":
        next = { kind, intervalValue: 3, intervalUnit: "months", anchorDate: new Date().toISOString() }; break;
      case "specific_date_recurring": {
        const today = new Date();
        next = { kind, month: today.getMonth() + 1, day: today.getDate() }; break;
      }
      case "specific_date_once": {
        const today = new Date();
        next = { kind, month: today.getMonth() + 1, day: today.getDate(), year: today.getFullYear() + 1 }; break;
      }
      case "day_of_month_pattern":
        next = { kind, nth: 1, weekday: 1, monthInterval: 1 }; break;
      case "weekly_pattern":
        next = { kind, weeksInterval: 1, weekdays: [1] }; break;
    }
    onChange(next);
  }, [onChange]);

  const updateField = useCallback(<K extends keyof Schedule>(key: K, value: Schedule[K]) => {
    onChange({ ...schedule, [key]: value });
  }, [schedule, onChange]);

  const toggleWeekday = useCallback((wd: number) => {
    const cur = schedule.weekdays ?? [];
    const next = cur.includes(wd) ? cur.filter(x => x !== wd) : [...cur, wd].sort((a, b) => a - b);
    onChange({ ...schedule, weekdays: next });
  }, [schedule, onChange]);

  return (
    <View>
      <Text style={[s.l, { color: colors.textSecondary }]}>Schedule</Text>
      <TouchableOpacity
        style={[s.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setShowKindMenu(true)}
        activeOpacity={0.7}
      >
        <Text style={[s.dropdownText, { color: colors.text }]} numberOfLines={2}>{kindLabel}</Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {(schedule.kind === "interval_from_completion" || schedule.kind === "interval_from_anchor") && (
        <View style={{ marginTop: 14 }}>
          <View style={s.row}>
            <TextInput
              style={[s.intInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={String(schedule.intervalValue ?? 1)}
              onChangeText={(v) => updateField("intervalValue", Math.max(1, parseInt(v, 10) || 1))}
            />
            <View style={s.unitRow}>
              {UNITS.map(u => {
                const a = schedule.intervalUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[s.unitChip, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]}
                    onPress={() => updateField("intervalUnit", u)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.unitText, { color: a ? "#FFF" : colors.text }]}>{u}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {schedule.kind === "interval_from_anchor" && (
            <>
              <Text style={[s.l, { color: colors.textSecondary, marginTop: 14 }]}>Anchor date</Text>
              <TouchableOpacity
                style={[s.dateBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowAnchorPicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={18} color={colors.textSecondary} />
                <Text style={[s.dateText, { color: colors.text }]}>
                  {schedule.anchorDate ? new Date(schedule.anchorDate).toLocaleDateString() : "Pick a date"}
                </Text>
              </TouchableOpacity>
              <CalendarPicker
                visible={showAnchorPicker}
                initialDate={schedule.anchorDate ? new Date(schedule.anchorDate) : null}
                title="Anchor date"
                onClose={() => setShowAnchorPicker(false)}
                onSelect={(d) => { updateField("anchorDate", d.toISOString()); setShowAnchorPicker(false); }}
              />
            </>
          )}
        </View>
      )}

      {schedule.kind === "specific_date_recurring" && (
        <View style={{ marginTop: 14 }}>
          <Text style={[s.l, { color: colors.textSecondary }]}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {MONTH_NAMES.map((m, i) => {
              const a = schedule.month === i + 1;
              return (
                <TouchableOpacity
                  key={m}
                  style={[s.chip, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]}
                  onPress={() => updateField("month", i + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, { color: a ? "#FFF" : colors.text }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 14 }]}>Day</Text>
          <TextInput
            style={[s.intInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, width: 80 }]}
            keyboardType="number-pad"
            value={String(schedule.day ?? 1)}
            onChangeText={(v) => {
              const n = parseInt(v, 10) || 1;
              updateField("day", Math.min(31, Math.max(1, n)));
            }}
          />
        </View>
      )}

      {schedule.kind === "specific_date_once" && (
        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            style={[s.dateBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowOncePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={colors.textSecondary} />
            <Text style={[s.dateText, { color: colors.text }]}>
              {schedule.year && schedule.month && schedule.day
                ? new Date(schedule.year, schedule.month - 1, schedule.day).toLocaleDateString()
                : "Pick a date"}
            </Text>
          </TouchableOpacity>
          <CalendarPicker
            visible={showOncePicker}
            initialDate={schedule.year && schedule.month && schedule.day ? new Date(schedule.year, schedule.month - 1, schedule.day) : null}
            title="Pick the date"
            onClose={() => setShowOncePicker(false)}
            onSelect={(d) => {
              onChange({ ...schedule, year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
              setShowOncePicker(false);
            }}
          />
        </View>
      )}

      {schedule.kind === "day_of_month_pattern" && (
        <View style={{ marginTop: 14 }}>
          <Text style={[s.l, { color: colors.textSecondary }]}>Which one</Text>
          <View style={s.chipRow}>
            {NTHS.map(n => {
              const a = schedule.nth === n.v;
              return (
                <TouchableOpacity
                  key={n.v}
                  style={[s.chip, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]}
                  onPress={() => updateField("nth", n.v)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, { color: a ? "#FFF" : colors.text }]}>{n.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 14 }]}>Weekday</Text>
          <View style={s.chipRow}>
            {WEEKDAY_NAMES.map((w, i) => {
              const a = schedule.weekday === i;
              return (
                <TouchableOpacity
                  key={w}
                  style={[s.chip, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]}
                  onPress={() => updateField("weekday", i as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, { color: a ? "#FFF" : colors.text }]}>{w}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 14 }]}>Every</Text>
          <View style={s.row}>
            <TextInput
              style={[s.intInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={String(schedule.monthInterval ?? 1)}
              onChangeText={(v) => updateField("monthInterval", Math.max(1, parseInt(v, 10) || 1))}
            />
            <Text style={[s.inlineLabel, { color: colors.text }]}>month(s)</Text>
          </View>
        </View>
      )}

      {schedule.kind === "weekly_pattern" && (
        <View style={{ marginTop: 14 }}>
          <Text style={[s.l, { color: colors.textSecondary }]}>Every</Text>
          <View style={s.row}>
            <TextInput
              style={[s.intInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={String(schedule.weeksInterval ?? 1)}
              onChangeText={(v) => updateField("weeksInterval", Math.max(1, parseInt(v, 10) || 1))}
            />
            <Text style={[s.inlineLabel, { color: colors.text }]}>week(s)</Text>
          </View>
          <Text style={[s.l, { color: colors.textSecondary, marginTop: 14 }]}>On</Text>
          <View style={s.chipRow}>
            {WEEKDAY_NAMES.map((w, i) => {
              const a = (schedule.weekdays ?? []).includes(i);
              return (
                <TouchableOpacity
                  key={w}
                  style={[s.chip, { backgroundColor: a ? colors.accent : colors.card, borderColor: a ? colors.accent : colors.border }]}
                  onPress={() => toggleWeekday(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, { color: a ? "#FFF" : colors.text }]}>{w}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Modal visible={showKindMenu} transparent animationType="fade" onRequestClose={() => setShowKindMenu(false)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setShowKindMenu(false)}>
          <View style={[s.menu, { backgroundColor: colors.card }]}>
            <Text style={[s.menuTitle, { color: colors.text }]}>Schedule type</Text>
            {KIND_OPTIONS.map(k => {
              const a = k.kind === schedule.kind;
              return (
                <TouchableOpacity
                  key={k.kind}
                  style={[s.menuItem, { borderColor: colors.border }]}
                  onPress={() => pickKind(k.kind)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.menuItemText, { color: colors.text }]}>{k.label}</Text>
                  {a && <Check size={18} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  l: { fontSize: 13, fontWeight: "600" as const, marginBottom: 8, marginLeft: 2 },
  dropdown: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, minHeight: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  dropdownText: { flex: 1, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  intInput: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, width: 80 },
  inlineLabel: { fontSize: 15 },
  unitRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const },
  unitChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  unitText: { fontSize: 14, fontWeight: "500" as const },
  dateBtn: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  dateText: { flex: 1, fontSize: 15 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" as const },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 },
  menu: { borderRadius: 16, padding: 16 },
  menuTitle: { fontSize: 16, fontWeight: "700" as const, marginBottom: 10, paddingHorizontal: 4 },
  menuItem: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingVertical: 14, paddingHorizontal: 8, borderTopWidth: 1, gap: 10 },
  menuItemText: { flex: 1, fontSize: 14 },
});
