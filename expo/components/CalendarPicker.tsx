import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from "react-native";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface Props {
  visible: boolean;
  initialDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPicker({ visible, initialDate, minDate, maxDate, title, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  const [viewDate, setViewDate] = useState<Date>(initialDate ?? new Date());
  const [selected, setSelected] = useState<Date | null>(initialDate ?? null);

  React.useEffect(() => {
    if (visible) {
      setViewDate(initialDate ?? new Date());
      setSelected(initialDate ?? null);
    }
  }, [visible, initialDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prevMonth = useCallback(() => setViewDate(new Date(year, month - 1, 1)), [year, month]);
  const nextMonth = useCallback(() => setViewDate(new Date(year, month + 1, 1)), [year, month]);

  const isDisabled = useCallback((d: Date): boolean => {
    if (minDate && d.getTime() < startOfDay(minDate).getTime()) return true;
    if (maxDate && d.getTime() > startOfDay(maxDate).getTime()) return true;
    return false;
  }, [minDate, maxDate]);

  const confirm = useCallback(() => {
    if (selected) onSelect(selected);
  }, [selected, onSelect]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: colors.card }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text }]}>{title ?? "Pick a date"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={s.navRow}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn} activeOpacity={0.6}>
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[s.monthLabel, { color: colors.text }]}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn} activeOpacity={0.6}>
              <ChevronRight size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={s.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={[s.weekDay, { color: colors.textSecondary }]}>{w}</Text>
            ))}
          </View>
          <View style={s.grid}>
            {days.map((d, i) => {
              if (!d) return <View key={i} style={s.cell} />;
              const disabled = isDisabled(d);
              const isSelected = selected && d.toDateString() === selected.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.cell,
                    isSelected && { backgroundColor: colors.accent, borderRadius: 10 },
                    isToday && !isSelected && { borderWidth: 1, borderColor: colors.accent, borderRadius: 10 },
                  ]}
                  onPress={() => !disabled && setSelected(d)}
                  disabled={disabled}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    s.cellText,
                    { color: disabled ? colors.border : isSelected ? "#FFF" : colors.text }
                  ]}>{d.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]} onPress={onClose} activeOpacity={0.7}>
              <Text style={[s.btnT, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: selected ? colors.accent : colors.border }]}
              onPress={confirm}
              disabled={!selected}
              activeOpacity={0.8}
            >
              <Text style={[s.btnT, { color: "#FFF" }]}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 },
  sheet: { borderRadius: 20, padding: 20, ...Platform.select({ web: { maxWidth: 420, alignSelf: "center", width: "100%" as const }, default: {} }) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "700" as const },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 16, fontWeight: "600" as const },
  weekRow: { flexDirection: "row" },
  weekDay: { flex: 1, textAlign: "center" as const, fontSize: 12, fontWeight: "600" as const, paddingVertical: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellText: { fontSize: 15, fontWeight: "500" as const },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnT: { fontSize: 15, fontWeight: "600" as const },
});
