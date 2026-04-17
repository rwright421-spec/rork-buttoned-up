import React, { useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { X, AlertTriangle, RefreshCcw } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { PhotoRef } from "@/constants/types";

interface Props {
  photo: PhotoRef;
  size?: number;
  onRemove?: () => void;
  onReplace?: () => void;
  onPress?: () => void;
}

export default function PhotoThumb({ photo, size = 72, onRemove, onReplace, onPress }: Props) {
  const { colors } = useTheme();
  const [broken, setBroken] = useState(false);

  const handleError = useCallback(() => {
    setBroken(true);
  }, []);

  if (broken) {
    return (
      <View style={[s.container, { width: size, height: size, backgroundColor: colors.card, borderColor: colors.border }]}>
        <AlertTriangle size={18} color={colors.textSecondary} />
        <Text style={[s.brokenT, { color: colors.textSecondary }]} numberOfLines={2}>Photo no longer available</Text>
        <View style={s.actionRow}>
          {onReplace && (
            <TouchableOpacity onPress={onReplace} style={[s.smallBtn, { backgroundColor: colors.accent }]} activeOpacity={0.7}>
              <RefreshCcw size={10} color="#FFF" />
              <Text style={s.smallBtnT}>Replace</Text>
            </TouchableOpacity>
          )}
          {onRemove && (
            <TouchableOpacity onPress={onRemove} style={[s.smallBtn, { backgroundColor: "#EF4444" }]} activeOpacity={0.7}>
              <X size={10} color="#FFF" />
              <Text style={s.smallBtnT}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const Wrap = onPress ? TouchableOpacity : View;

  return (
    <Wrap
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.wrap, { width: size, height: size, backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image
        source={{ uri: photo.uri }}
        style={{ width: size, height: size, borderRadius: 10 }}
        onError={handleError}
        {...(Platform.OS === "web" ? { crossOrigin: "anonymous" as const } : {})}
      />
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={s.removeBadge} hitSlop={8} activeOpacity={0.7}>
          <X size={12} color="#FFF" strokeWidth={3} />
        </TouchableOpacity>
      )}
    </Wrap>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 10, borderWidth: 1, overflow: "hidden", position: "relative" as const },
  container: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    gap: 4,
  },
  brokenT: { fontSize: 9, textAlign: "center" as const },
  actionRow: { flexDirection: "row", gap: 4 },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  smallBtnT: { color: "#FFF", fontSize: 9, fontWeight: "600" as const },
  removeBadge: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
