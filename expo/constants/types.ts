export type EquipmentType = 'home' | 'auto' | 'rental' | 'vacation' | 'hottub' | 'generator' | 'lawn' | 'boat' | 'custom';

export type IntervalUnit = 'days' | 'weeks' | 'months' | 'years';

export type TaskStatus = 'not_started' | 'overdue' | 'due_soon' | 'current';

export type ThemeKey = 'clean' | 'dark' | 'warm' | 'ocean';

export interface EquipmentGroup {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  emoji: string;
  groupId: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Task {
  id: string;
  equipmentId: string;
  name: string;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  lastCompletedDate: string | null;
  notes: string;
  sortOrder: number;
  createdAt: string;
}

export interface CompletionLog {
  id: string;
  taskId: string;
  completedAt: string;
  notes: string;
}

export interface TemplateTask {
  name: string;
  intervalValue: number;
  intervalUnit: IntervalUnit;
}

export interface NotificationSettings {
  enabled: boolean;
  daysBefore: number;
  reminderTime: string;
}

export interface AppSettings {
  theme: ThemeKey;
  notifications: NotificationSettings;
  onboardingComplete: boolean;
}

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  overdue: string;
  dueSoon: string;
  current: string;
  notStarted: string;
}
