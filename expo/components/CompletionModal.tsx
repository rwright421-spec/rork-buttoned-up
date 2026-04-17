import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, ActionSheetIOS, Platform, Alert } from "react-native";
import { X, Camera, ImageIcon, Calendar as CalendarIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { PhotoRef } from "@/constants/types";
import { pickFromLibrary, takePhoto } from "@/utils/photos";
import PhotoThumb from "./PhotoThumb";
import CalendarPicker from "./CalendarPicker";

interface Props {
  visible: boolean;
  title?: string;
  initialDate?: Date;
  initialNotes?: string;
  initialPhotos?: PhotoRef[];
  onClose: () => void;
  onSave: (data: { date: string; notes: string; photos: PhotoRef[] }) => void;
}

export default function CompletionModal({ visible, title, initialDate, initialNotes, initialPhotos, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const [date, setDate] = useState<Date>(initialDate ?? new Date());
  const [notes, setNotes] = useState<string>(initialNotes ?? "");
  const [photos, setPhotos] = useState<PhotoRef[]>(initialPhotos ?? []);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(initialDate ?? new Date());
      setNotes(initialNotes ?? "");
      setPhotos(initialPhotos ?? []);
    }
  }, [visible, initialDate, initialNotes, initialPhotos]);

  const handleAttach = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const doCamera = async () => {
      const p = await takePhoto();
      if (p) setPhotos(prev => [...prev, p]);
    };
    const doLibrary = async () => {
      const p = await pickFromLibrary();
      if (p && p.length > 0) setPhotos(prev => [...prev, ...p]);
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Library"], cancelButtonIndex: 0 },
        (i) => {
          if (i === 1) doCamera();
          if (i === 2) doLibrary();
        }
      );
    } else if (Platform.OS === "web") {
      doLibrary();
    } else {
      Alert.alert("Add Photo", undefined, [
        { text: "Take Photo", onPress: doCamera },
        { text: "Choose from Library", onPress: doLibrary },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, []);

  const removePhoto = useCallback((uri: string) => {
    setPhotos(prev => prev.filter(p => p.uri !== uri));
  }, []);

  const handleSave = useCallback(() => {
    onSave({ date: date.toISOString(), notes: notes.trim(), photos });
  }, [date, notes, photos, onSave]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: colors.card }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text }]}>{title ?? "Log Completion"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[s.dateChip, { borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              testID="completion-date-chip"
            >
              <CalendarIcon size={14} color={colors.textSecondary} />
              <Text style={[s.dateChipT, { color: colors.text }]}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <Text style={[s.label, { color: colors.textSecondary }]}>Notes (optional)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="What did you notice? Any issues to remember?"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              testID="completion-notes"
            />

            <Text style={[s.label, { color: colors.textSecondary, marginTop: 16 }]}>Photos (optional)</Text>
            {photos.length > 0 && (
              <View style={s.photoRow}>
                {photos.map(p => (
                  <PhotoThumb key={p.uri} photo={p} size={72} onRemove={() => removePhoto(p.uri)} />
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[s.addPhotoBtn, { borderColor: colors.border }]}
              onPress={handleAttach}
              activeOpacity={0.7}
              testID="add-photo-btn"
            >
              <Camera size={16} color={colors.text} />
              <ImageIcon size={16} color={colors.text} />
              <Text style={[s.addPhotoT, { color: colors.text }]}>Add Photo</Text>
            </TouchableOpacity>

            <View style={s.actions}>
              <TouchableOpacity style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]} onPress={onClose} activeOpacity={0.7}>
                <Text style={[s.btnT, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]} onPress={handleSave} activeOpacity={0.8} testID="save-completion">
                <Text style={[s.btnT, { color: "#FFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      <CalendarPicker
        visible={showDatePicker}
        initialDate={date}
        maxDate={new Date()}
        title="Completion date"
        onClose={() => setShowDatePicker(false)}
        onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", paddingHorizontal: 20 },
  sheet: { borderRadius: 18, padding: 20, maxHeight: "85%" as const },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700" as const },
  dateChip: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, alignSelf: "flex-start" as const, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderStyle: "dashed" as const, marginBottom: 12 },
  dateChipT: { fontSize: 12, fontWeight: "600" as const },
  label: { fontSize: 12, fontWeight: "600" as const, marginBottom: 6, letterSpacing: 0.3 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, minHeight: 70, fontSize: 15, textAlignVertical: "top" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: "dashed" as const, marginTop: 4 },
  addPhotoT: { fontSize: 14, fontWeight: "600" as const },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnT: { fontSize: 15, fontWeight: "600" as const },
});
