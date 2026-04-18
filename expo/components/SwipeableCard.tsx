import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, Alert, Animated, Platform, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  confirmTitle: string;
  confirmMessage?: string;
  testID?: string;
}

const DELETE_COLOR = "#E53935";

export default function SwipeableCard({ children, onDelete, confirmTitle, confirmMessage, testID }: Props) {
  const swipeRef = useRef<Swipeable | null>(null);

  const confirm = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: "Cancel", style: "cancel", onPress: () => swipeRef.current?.close() },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            swipeRef.current?.close();
            onDelete();
          },
        },
      ],
      { cancelable: true, onDismiss: () => swipeRef.current?.close() }
    );
  }, [confirmTitle, confirmMessage, onDelete]);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({
        inputRange: [-120, -40, 0],
        outputRange: [1, 0.85, 0.6],
        extrapolate: "clamp",
      });
      const opacity = dragX.interpolate({
        inputRange: [-80, -20, 0],
        outputRange: [1, 0.5, 0],
        extrapolate: "clamp",
      });
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={confirm}
          style={s.actionWrap}
          testID={testID ? `${testID}-delete` : undefined}
        >
          <Animated.View style={[s.action, { opacity, transform: [{ scale }] }]}>
            <Trash2 size={22} color="#FFF" strokeWidth={2.2} />
            <Text style={s.actionText}>Delete</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [confirm, testID]
  );

  if (Platform.OS === "web") {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={(r) => { swipeRef.current = r; }}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}

const s = StyleSheet.create({
  actionWrap: {
    width: 96,
    justifyContent: "center",
    alignItems: "stretch",
    marginVertical: 0,
  },
  action: {
    flex: 1,
    backgroundColor: DELETE_COLOR,
    borderRadius: 14,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});
