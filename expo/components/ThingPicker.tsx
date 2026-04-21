import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useData } from "@/providers/DataProvider";

interface Props {
  visible: boolean;
  title: string;
  currentThingId?: string;
  excludeThingId?: string;
  onClose: () => void;
  onSelect: (thingId: string) => void;
}

export default function ThingPicker({ visible, title, currentThingId, excludeThingId, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { areas, things } = useData();

  const thingsByArea = useMemo(() => {
    return [...areas].sort((a, b) => a.sortOrder - b.sortOrder).map(a => ({
      area: a,
      things: things
        .filter(t => t.areaId === a.id && t.id !== excludeThingId)
        .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)),
    }));
  }, [areas, things, excludeThingId]);

  const totalAvailable = useMemo(
    () => thingsByArea.reduce((sum, g) => sum + g.things.length, 0),
    [thingsByArea]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.overlay}>
        <View style={[st.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={st.header}>
            <Text style={[st.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} testID="thing-picker-close">
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            {totalAvailable === 0 && (
              <Text style={[st.empty, { color: colors.textSecondary, textAlign: "center", paddingVertical: 20 }]}>No other Things available</Text>
            )}
            {thingsByArea.filter(g => g.things.length > 0).map(({ area, things: areaThings }) => (
              <View key={area.id} style={{ marginBottom: 10 }}>
                <Text style={[st.areaLabel, { color: colors.textSecondary }]}>{area.emoji} {area.name}</Text>
                {areaThings.length === 0 ? (
                  <Text style={[st.empty, { color: colors.textSecondary }]}>No Things yet</Text>
                ) : areaThings.map(th => {
                  const isCurrent = th.id === currentThingId;
                  return (
                    <TouchableOpacity
                      key={th.id}
                      style={[st.row, { borderColor: colors.border, opacity: isCurrent ? 0.5 : 1 }]}
                      onPress={() => onSelect(th.id)}
                      disabled={isCurrent}
                      activeOpacity={0.7}
                      testID={`thing-picker-row-${th.id}`}
                    >
                      <Text style={st.emoji}>{th.emoji}</Text>
                      <Text style={[st.name, { color: colors.text }]}>{th.name}</Text>
                      {isCurrent && <Text style={[st.current, { color: colors.textSecondary }]}>Current</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700" as const },
  areaLabel: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" as const },
  empty: { fontSize: 13, paddingLeft: 8, paddingVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, gap: 10, marginBottom: 6 },
  emoji: { fontSize: 20 },
  name: { flex: 1, fontSize: 15, fontWeight: "500" as const },
  current: { fontSize: 12 },
});
