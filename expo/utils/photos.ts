import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoRef } from '@/constants/types';

export async function pickFromLibrary(): Promise<PhotoRef[] | null> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted' && perm.status !== 'limited') {
      showPermAlert('Photo Library');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: Platform.OS !== 'android',
      quality: 0.8,
      selectionLimit: 0,
    });
    if (result.canceled) return null;
    return result.assets.map(mapAsset);
  } catch (e) {
    console.log('[photos] pickFromLibrary error', e);
    return null;
  }
}

export async function takePhoto(): Promise<PhotoRef | null> {
  try {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Camera capture is not available on the web. Choose from your library instead.');
      return null;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      showPermAlert('Camera');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) return null;
    return mapAsset(asset);
  } catch (e) {
    console.log('[photos] takePhoto error', e);
    return null;
  }
}

function mapAsset(a: ImagePicker.ImagePickerAsset): PhotoRef {
  return {
    uri: a.uri,
    platformId: a.assetId ?? undefined,
    width: a.width,
    height: a.height,
    createdAt: new Date().toISOString(),
  };
}

function showPermAlert(kind: string) {
  Alert.alert(
    `${kind} access needed`,
    `Enable ${kind.toLowerCase()} access in Settings to continue.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => { Linking.openSettings().catch(() => {}); } },
    ],
  );
}
