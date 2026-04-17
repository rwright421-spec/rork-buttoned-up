import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Platform, Dimensions, Alert, ActionSheetIOS } from "react-native";
import { X, Pencil, Trash2, Camera, ImageIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { CompletionLog, PhotoRef } from "@/constants/types";
import { pickFromLibrary, takePhoto } from "@/utils/photos";
import PhotoThumb from "./PhotoThumb";
import CompletionModal from "./CompletionModal";

interface Props {
  visible: boolean;
  log: CompletionLog | null;
  onClose: () => void;
  onEdit: (data: { date: string; notes: string; photos: PhotoRef[] }) => void;
  onDelete: () => void;
}

export default function CompletionDetailSheet({ visible, log, onClose, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [viewer, setViewer] = useState<PhotoRef | null>(null);
  const [editing, setEditing] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<PhotoRef[] | null>(null);

  React.useEffect(() => {
    if (visible) setLocalPhotos(null);
  }, [visible, log?.id]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete this entry?", "Notes and photos will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { onDelete(); } },
    ]);
  }, [onDelete]);

  if (!log) return null;

  const photos = localPhotos ?? log.photoRefs ?? [];

  const replacePhoto = async (uri: string) => {
    const picked = await pickFromLibrary();
    if (!picked || picked.length === 0) return;
    const next = photos.map(p => p.uri === uri ? picked[0] : p);
    setLocalPhotos(next);
    onEdit({ date: log.completedAt, notes: log.notes, photos: next });
  };

  const removePhoto = (uri: string) => {
    const next = photos.filter(p => p.uri !== uri);
    setLocalPhotos(next);
    onEdit({ date: log.completedAt, notes: log.notes, photos: next });
  };

  const addPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const doCamera = async () => {
      const p = await takePhoto();
      if (p) {
        const next = [...photos, p];
        setLocalPhotos(next);
        onEdit({ date: log.completedAt, notes: log.notes, photos: next });
      }
    };
    const doLibrary = async () => {
      const arr = await pickFromLibrary();
      if (arr && arr.length > 0) {
        const next = [...photos, ...arr];
        setLocalPhotos(next);
        onEdit({ date: log.completedAt, notes: log.notes, photos: next });
      }
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Library"], cancelButtonIndex: 0 },
        (i) => { if (i === 1) doCamera(); if (i === 2) doLibrary(); }
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
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text }]}>Completion</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: Dimensions.get("window").height * 0.65 }} showsVerticalScrollIndicator={false}>
            <Text style={[s.date, { color: colors.text }]}>
              {new Date(log.completedAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
            </Text>
            {log.editedAt && (
              <Text style={[s.edited, { color: colors.textSecondary }]}>Edited {new Date(log.editedAt).toLocaleDateString()}</Text>
            )}
            <Text style={[s.sectLabel, { color: colors.textSecondary }]}>NOTES</Text>
            <Text style={[s.notes, { color: log.notes ? colors.text : colors.textSecondary, fontStyle: log.notes ? "normal" : "italic" }]}>
              {log.notes || "No notes"}
            </Text>
            <Text style={[s.sectLabel, { color: colors.textSecondary, marginTop: 16 }]}>PHOTOS</Text>
            {photos.length === 0 ? (
              <Text style={[s.emptyPhoto, { color: colors.textSecondary }]}>No photos attached.</Text>
            ) : (
              <View style={s.photoGrid}>
                {photos.map(p => (
                  <PhotoThumb
                    key={p.uri}
                    photo={p}
                    size={90}
                    onPress={() => setViewer(p)}
                    onReplace={() => replacePhoto(p.uri)}
                    onRemove={() => removePhoto(p.uri)}
                  />
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[s.addBtn, { borderColor: colors.border }]}
              onPress={addPhoto}
              activeOpacity={0.7}
            >
              <Camera size={14} color={colors.text} />
              <ImageIcon size={14} color={colors.text} />
              <Text style={[s.addBtnT, { color: colors.text }]}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actBtn, { borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setEditing(true)}
              activeOpacity={0.7}
              testID="edit-completion"
            >
              <Pencil size={16} color={colors.text} />
              <Text style={[s.actBtnT, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actBtn, { backgroundColor: "#EF4444" }]}
              onPress={handleDelete}
              activeOpacity={0.7}
              testID="delete-completion"
            >
              <Trash2 size={16} color="#FFF" />
              <Text style={[s.actBtnT, { color: "#FFF" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={s.viewerOverlay}>
          <TouchableOpacity style={s.viewerClose} onPress={() => setViewer(null)} hitSlop={8}>
            <X size={28} color="#FFF" />
          </TouchableOpacity>
          {viewer && (
            <Image
              source={{ uri: viewer.uri }}
              style={s.viewerImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <CompletionModal
        visible={editing}
        title="Edit Completion"
        initialDate={new Date(log.completedAt)}
        initialNotes={log.notes}
        initialPhotos={photos}
        onClose={() => setEditing(false)}
        onSave={(data) => {
          setLocalPhotos(data.photos);
          onEdit(data);
          setEditing(false);
        }}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 10 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(127,127,127,0.35)", alignSelf: "center" as const, marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700" as const },
  date: { fontSize: 16, fontWeight: "600" as const },
  edited: { fontSize: 12, marginTop: 2 },
  sectLabel: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.8, marginTop: 18, marginBottom: 6 },
  notes: { fontSize: 15, lineHeight: 22 },
  emptyPhoto: { fontSize: 13, fontStyle: "italic" as const, paddingVertical: 4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: "dashed" as const, marginTop: 10 },
  addBtnT: { fontSize: 13, fontWeight: "600" as const },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 46, borderRadius: 12 },
  actBtnT: { fontSize: 15, fontWeight: "600" as const },
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute" as const, top: 60, right: 24, zIndex: 2, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  viewerImg: { width: "100%" as const, height: "100%" as const },
});
