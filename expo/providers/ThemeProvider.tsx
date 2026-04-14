import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { ThemeKey, ThemeColors } from '@/constants/types';
import { themes } from '@/constants/themes';

const THEME_KEY = 'buttonedup_theme';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeKey, setThemeKey] = useState<ThemeKey>('clean');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val && val in themes) {
        setThemeKey(val as ThemeKey);
      }
      setLoaded(true);
    });
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(THEME_KEY, key);
  };

  const colors: ThemeColors = themes[themeKey];

  return { themeKey, setTheme, colors, loaded };
});
