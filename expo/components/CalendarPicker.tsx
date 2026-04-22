import React, { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView, Pressable } from "react-native";
import { ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react-native";
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
  const [monthPickerOpen, setMonthPickerOpen] = useState<boolean>(false);
  const [yearPickerOpen, setYearPickerOpen] = useState<boolean>(false);
  const yearScrollRef = useRef<ScrollView | null>(null);

  React.useEffect(() => {
    if (visible) {
      setViewDate(initialDate ?? new Date());
      setSelected(initialDate ?? null);
    }
  }, [visible, initialDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d, 12, 0, 0, 0));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [year, month]);

  const todayKey = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
  }, []);

  const selectedKey = useMemo(() => {
    if (!selected) return null;
    return `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`;
  }, [selected]);

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
            <TouchableOpacity onPress={prevMonth} style={s.navBtn} activeOpacity={0.6} testID="cal-prev-month">
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={s.monthYearRow} pointerEvents="box-none">
              <TouchableOpacity
                onPress={() => setMonthPickerOpen(true)}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.monthYearBtn}
                accessibilityRole="button"
                accessibilityLabel={`Month: ${MONTHS[month]}. Tap to change.`}
                testID="cal-month-btn"
              >
                <Text style={[s.monthLabel, { color: colors.text }]}>{MONTHS[month]}</Text>
                <ChevronDown size={14} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setYearPickerOpen(true)}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.monthYearBtn}
                accessibilityRole="button"
                accessibilityLabel={`Year: ${year}. Tap to change.`}
                testID="cal-year-btn"
              >
                <Text style={[s.monthLabel, { color: colors.text }]}>{year}</Text>
                <ChevronDown size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn} activeOpacity={0.6} testID="cal-next-month">
              <ChevronRight size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={s.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={[s.weekDay, { color: colors.textSecondary }]}>{w}</Text>
            ))}
          </View>
          <View style={s.grid}>
            {weeks.map((row, ri) => (
              <View key={ri} style={s.weekRow}>
                {row.map((d, i) => {
                  if (!d) return <View key={i} style={s.cell} />;
                  const disabled = isDisabled(d);
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                  const isSelected = selectedKey === key;
                  const isToday = todayKey === key;
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
            ))}
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
      <Modal visible={monthPickerOpen} transparent animationType="fade" onRequestClose={() => setMonthPickerOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setMonthPickerOpen(false)}>
          <Pressable style={[s.pickerSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={[s.title, { color: colors.text, marginBottom: 12 }]}>Select month</Text>
            <View style={s.monthGrid}>
              {MONTHS.map((m, i) => {
                const isCurrent = i === month;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      s.monthCell,
                      isCurrent && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => {
                      setViewDate(new Date(year, i, 1));
                      setMonthPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.monthCellText, { color: isCurrent ? "#FFF" : colors.text }]}>{m.slice(0, 3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={yearPickerOpen} transparent animationType="fade" onRequestClose={() => setYearPickerOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setYearPickerOpen(false)}>
          <Pressable style={[s.pickerSheet, { backgroundColor: colors.card, maxHeight: 380 }]} onPress={() => {}}>
            <Text style={[s.title, { color: colors.text, marginBottom: 12 }]}>Select year</Text>
            <ScrollView
              ref={yearScrollRef}
              onLayout={() => {
                const idx = YEARS.findIndex((y) => y === year);
                if (idx >= 0) {
                  yearScrollRef.current?.scrollTo({ y: Math.max(0, idx * 44 - 120), animated: false });
                }
              }}
              showsVerticalScrollIndicator={false}
            >
              {YEARS.map((y) => {
                const isCurrent = y === year;
                return (
                  <TouchableOpacity
                    key={y}
                    style={[s.yearRow, isCurrent && { backgroundColor: colors.accent, borderRadius: 10 }]}
                    onPress={() => {
                      setViewDate(new Date(y, month, 1));
                      setYearPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.yearRowText, { color: isCurrent ? "#FFF" : colors.text }]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const YEARS: number[] = (() => {
  const current = new Date().getFullYear();
  const arr: number[] = [];
  for (let y = current - 50; y <= current + 20; y++) arr.push(y);
  return arr;
})();

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
  navBtn: { padding: 6, minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" },
  monthYearRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  monthYearBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 4, minHeight: 32 },
  monthLabel: { fontSize: 16, fontWeight: "600" as const },
  pickerSheet: { borderRadius: 20, padding: 20, marginHorizontal: 20, ...Platform.select({ web: { maxWidth: 420, alignSelf: "center", width: "100%" as const }, default: {} }) },
  monthGrid: { flexDirection: "row", flexWrap: "wrap" },
  monthCell: { width: "25%", paddingVertical: 12, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  monthCellText: { fontSize: 14, fontWeight: "600" as const },
  yearRow: { paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  yearRowText: { fontSize: 16, fontWeight: "600" as const },
  weekRow: { flexDirection: "row" },
  weekDay: { flex: 1, textAlign: "center" as const, fontSize: 12, fontWeight: "600" as const, paddingVertical: 6 },
  grid: {},
  cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellText: { fontSize: 15, fontWeight: "500" as const },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnT: { fontSize: 15, fontWeight: "600" as const },
});
