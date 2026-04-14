import { ThemeColors, ThemeKey } from './types';

export const STATUS_COLORS = {
  overdue: '#EF4444',
  dueSoon: '#F59E0B',
  current: '#22C55E',
  notStarted: '#9CA3AF',
};

export const themes: Record<ThemeKey, ThemeColors> = {
  clean: {
    background: '#FFFFFF',
    card: '#F8F9FA',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    accent: '#2563EB',
    ...STATUS_COLORS,
  },
  dark: {
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    accent: '#3B82F6',
    ...STATUS_COLORS,
  },
  warm: {
    background: '#FDF6EC',
    card: '#FEF3C7',
    text: '#78350F',
    textSecondary: '#92400E',
    border: '#F3D9A4',
    accent: '#D97706',
    ...STATUS_COLORS,
  },
  ocean: {
    background: '#EFF6FF',
    card: '#DBEAFE',
    text: '#1E3A5F',
    textSecondary: '#3B6BA5',
    border: '#BAD4F5',
    accent: '#0EA5E9',
    ...STATUS_COLORS,
  },
};

export const themeLabels: Record<ThemeKey, string> = {
  clean: 'Clean & Minimal',
  dark: 'Dark Mode',
  warm: 'Warm',
  ocean: 'Ocean',
};

export const themePreviewColors: Record<ThemeKey, { bg: string; card: string; accent: string }> = {
  clean: { bg: '#FFFFFF', card: '#F8F9FA', accent: '#2563EB' },
  dark: { bg: '#111827', card: '#1F2937', accent: '#3B82F6' },
  warm: { bg: '#FDF6EC', card: '#FEF3C7', accent: '#D97706' },
  ocean: { bg: '#EFF6FF', card: '#DBEAFE', accent: '#0EA5E9' },
};
