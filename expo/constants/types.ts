export type ThingType = 'home' | 'auto' | 'rental' | 'vacation' | 'hottub' | 'generator' | 'lawn' | 'boat' | 'custom';

export type IntervalUnit = 'days' | 'weeks' | 'months' | 'years';

export type TaskStatus = 'not_started' | 'overdue' | 'due_soon' | 'current';

export type ThemeKey = 'clean' | 'dark' | 'warm' | 'ocean';

export interface Area {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  createdAt: string;
  templateKey?: string;
}

export interface Thing {
  id: string;
  name: string;
  type: ThingType;
  emoji: string;
  areaId: string;
  sortOrder: number;
  createdAt: string;
  decomposeDismissed?: boolean;
}

export type ScheduleKind =
  | 'interval_from_completion'
  | 'interval_from_anchor'
  | 'specific_date_recurring'
  | 'specific_date_once'
  | 'day_of_month_pattern'
  | 'weekly_pattern';

export interface Schedule {
  kind: ScheduleKind;
  intervalValue?: number;
  intervalUnit?: IntervalUnit;
  anchorDate?: string;
  month?: number;
  day?: number;
  year?: number;
  nth?: 1 | 2 | 3 | 4 | -1;
  weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  monthInterval?: number;
  weeksInterval?: number;
  weekdays?: number[];
}

export interface Task {
  id: string;
  thingId: string;
  name: string;
  schedule: Schedule;
  dueDates: string[];
  notes: string;
  sortOrder: number;
  createdAt: string;
  lastCompletedDate?: string | null;
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
