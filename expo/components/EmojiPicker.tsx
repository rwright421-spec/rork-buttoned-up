import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";

interface EmojiCategory {
  label: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: "Home & Property",
    emojis: [
      "🏠", "🏡", "🏘️", "🏗️", "🏢", "🏬", "🏨", "🏰", "🏖️", "🏕️",
      "🛖", "🏚️", "🧱", "🪵", "🚪", "🪟", "🛏️", "🛋️", "🪑", "🚿",
      "🛁", "🚰", "🪠", "🧹", "🧺", "🪣", "🧴", "🪥", "🧽", "🪤",
    ],
  },
  {
    label: "Vehicles & Transport",
    emojis: [
      "🚗", "🚙", "🏎️", "🚕", "🚌", "🚐", "🛻", "🚚", "🏍️", "🛵",
      "🚲", "🛺", "🚁", "✈️", "🛩️", "🚀", "🛸", "🚤", "⛵", "🛥️",
      "🚢", "🛶", "🚂", "🚎", "🛞", "⛽", "🔑", "🅿️",
    ],
  },
  {
    label: "Tools & Equipment",
    emojis: [
      "🔧", "🪛", "🔩", "⚙️", "🛠️", "⛏️", "🪚", "🔨", "🪓", "🗜️",
      "🧲", "🪝", "🧰", "🪜", "🔗", "⚡", "🔌", "💡", "🔦", "🕯️",
      "🧯", "🪫", "🔋", "📡", "⏱️", "🧪", "🌡️",
    ],
  },
  {
    label: "Garden & Outdoor",
    emojis: [
      "🌿", "🌱", "🌳", "🌲", "🪴", "🌻", "🌺", "🌷", "🌹", "🍀",
      "🍃", "🪻", "🪷", "🌾", "🌵", "🪨", "⛲", "🏞️", "🌤️", "🌧️",
      "☀️", "❄️", "🍂", "🐝", "🐛", "🦟",
    ],
  },
  {
    label: "Appliances & Tech",
    emojis: [
      "📱", "💻", "🖥️", "🖨️", "📺", "📷", "📻", "🎮", "🕹️", "🔊",
      "🎵", "🎧", "📀", "💿", "🖱️", "⌨️", "🏧", "📠", "☎️", "🔬",
      "🔭", "📡", "🛰️", "🤖",
    ],
  },
  {
    label: "Sports & Recreation",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸", "🥊", "🎿",
      "🛷", "⛸️", "🏊", "🚴", "🏋️", "🧘", "🏌️", "🎣", "🏄", "🤿",
      "🛶", "🎯", "🪁", "🎱", "🏆",
    ],
  },
  {
    label: "Animals & Pets",
    emojis: [
      "🐶", "🐱", "🐴", "🐮", "🐷", "🐑", "🐔", "🦆", "🐟", "🐠",
      "🦈", "🐢", "🐍", "🦎", "🐝", "🦋", "🐞", "🐾", "🦜", "🦩",
    ],
  },
  {
    label: "Food & Kitchen",
    emojis: [
      "🍳", "🍕", "🍔", "☕", "🍷", "🍺", "🧊", "🔥", "🫕", "🥘",
      "🍽️", "🥢", "🍴", "🧂", "🫙", "🥤", "🧃", "🍶",
    ],
  },
  {
    label: "Misc & Fun",
    emojis: [
      "⭐", "🌟", "💎", "🎪", "🎭", "🎨", "🎬", "🎤", "🎹", "🥁",
      "🪘", "🎺", "🎸", "📦", "🧳", "👜", "🎁", "🏷️", "📌", "📎",
      "🗂️", "📋", "✅", "❤️", "🔐", "🛡️", "⚓", "🪬", "🧿", "💰",
    ],
  },
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
}

export default function EmojiPicker({ visible, onClose, onSelect, currentEmoji }: EmojiPickerProps) {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState(0);

  const handleSelect = useCallback(
    (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Pick an Emoji</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {EMOJI_CATEGORIES.map((cat, i) => {
              const isActive = activeCategory === i;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive ? colors.accent + "18" : "transparent",
                      borderColor: isActive ? colors.accent : "transparent",
                    },
                  ]}
                  onPress={() => setActiveCategory(i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tabEmoji}>{cat.emojis[0]}</Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isActive ? colors.accent : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            style={styles.emojiScroll}
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
              {EMOJI_CATEGORIES[activeCategory].label}
            </Text>
            <View style={styles.gridWrap}>
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => {
                const isSelected = emoji === currentEmoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiBtn,
                      isSelected && {
                        backgroundColor: colors.accent + "20",
                        borderColor: colors.accent,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => handleSelect(emoji)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "700" as const },
  tabBar: { maxHeight: 52 },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 11, fontWeight: "600" as const, maxWidth: 70 },
  emojiScroll: { flex: 1 },
  emojiGrid: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    marginBottom: 10,
    marginLeft: 4,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 28 },
});
