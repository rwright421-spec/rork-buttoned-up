import { IntervalUnit, Task, TaskStatus, Schedule, CompletionLog } from '@/constants/types';

export function addInterval(date: Date, value: number, unit: IntervalUnit): Date {
  const result = new Date(date);
  switch (unit) {
    case 'days':
      result.setDate(result.getDate() + value);
      break;
    case 'weeks':
      result.setDate(result.getDate() + value * 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + value);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + value);
      break;
  }
  return result;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function safeDate(year: number, month: number, day: number): Date {
  const d = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function nthWeekdayOfMonth(year: number, month: number, nth: 1 | 2 | 3 | 4 | -1, weekday: number): Date {
  if (nth === -1) {
    const last = new Date(year, month + 1, 0);
    const diff = (last.getDay() - weekday + 7) % 7;
    last.setDate(last.getDate() - diff);
    return last;
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(year, month, day);
}

export function computeNextDue(schedule: Schedule, mostRecentCompletion: string | null): Date | null {
  const today = startOfDay(new Date());
  switch (schedule.kind) {
    case 'interval_from_completion': {
      if (!schedule.intervalValue || !schedule.intervalUnit) return null;
      if (!mostRecentCompletion) return null;
      return addInterval(new Date(mostRecentCompletion), schedule.intervalValue, schedule.intervalUnit);
    }
    case 'interval_from_anchor': {
      if (!schedule.intervalValue || !schedule.intervalUnit || !schedule.anchorDate) return null;
      let d = new Date(schedule.anchorDate);
      while (startOfDay(d).getTime() < today.getTime()) {
        d = addInterval(d, schedule.intervalValue, schedule.intervalUnit);
      }
      return d;
    }
    case 'specific_date_recurring': {
      if (!schedule.month || !schedule.day) return null;
      const year = today.getFullYear();
      let d = safeDate(year, schedule.month - 1, schedule.day);
      if (startOfDay(d).getTime() < today.getTime()) {
        d = safeDate(year + 1, schedule.month - 1, schedule.day);
      }
      return d;
    }
    case 'specific_date_once': {
      if (!schedule.month || !schedule.day || !schedule.year) return null;
      return safeDate(schedule.year, schedule.month - 1, schedule.day);
    }
    case 'day_of_month_pattern': {
      if (!schedule.nth || schedule.weekday === undefined || !schedule.monthInterval) return null;
      const base = mostRecentCompletion ? new Date(mostRecentCompletion) : today;
      let y = base.getFullYear();
      let m = base.getMonth();
      for (let i = 0; i < 120; i++) {
        const d = nthWeekdayOfMonth(y, m, schedule.nth, schedule.weekday);
        if (startOfDay(d).getTime() >= today.getTime()) return d;
        m += schedule.monthInterval;
        while (m > 11) { m -= 12; y += 1; }
      }
      return null;
    }
    case 'weekly_pattern': {
      if (!schedule.weeksInterval || !schedule.weekdays || schedule.weekdays.length === 0) return null;
      const sorted = [...schedule.weekdays].sort((a, b) => a - b);
      for (let i = 0; i < 7 * schedule.weeksInterval + 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        if (sorted.includes(d.getDay())) return d;
      }
      return null;
    }
  }
  return null;
}

export function computeAllUpcomingDue(schedule: Schedule, mostRecentCompletion: string | null, count: number): Date[] {
  const results: Date[] = [];
  const first = computeNextDue(schedule, mostRecentCompletion);
  if (!first) return results;
  results.push(first);
  let cursor = first;
  for (let i = 1; i < count; i++) {
    let next: Date | null = null;
    switch (schedule.kind) {
      case 'interval_from_completion':
      case 'interval_from_anchor':
        if (schedule.intervalValue && schedule.intervalUnit) {
          next = addInterval(cursor, schedule.intervalValue, schedule.intervalUnit);
        }
        break;
      case 'specific_date_recurring':
        next = safeDate(cursor.getFullYear() + 1, cursor.getMonth(), cursor.getDate());
        break;
      case 'specific_date_once':
        next = null;
        break;
      case 'day_of_month_pattern': {
        if (!schedule.monthInterval || !schedule.nth || schedule.weekday === undefined) break;
        let y = cursor.getFullYear();
        let m = cursor.getMonth() + schedule.monthInterval;
        while (m > 11) { m -= 12; y += 1; }
        next = nthWeekdayOfMonth(y, m, schedule.nth, schedule.weekday);
        break;
      }
      case 'weekly_pattern': {
        if (!schedule.weeksInterval || !schedule.weekdays || schedule.weekdays.length === 0) break;
        const sorted = [...schedule.weekdays].sort((a, b) => a - b);
        const idx = sorted.indexOf(cursor.getDay());
        if (idx >= 0 && idx < sorted.length - 1) {
          const diff = sorted[idx + 1] - cursor.getDay();
          next = new Date(cursor);
          next.setDate(next.getDate() + diff);
        } else {
          const d = new Date(cursor);
          d.setDate(d.getDate() + (7 - cursor.getDay()) + 7 * (schedule.weeksInterval - 1) + sorted[0]);
          next = d;
        }
        break;
      }
    }
    if (!next) break;
    results.push(next);
    cursor = next;
  }
  return results;
}

export function getMostRecentCompletion(taskId: string, logs: CompletionLog[]): string | null {
  const filtered = logs.filter((l) => l.taskId === taskId);
  if (filtered.length === 0) return null;
  const sorted = [...filtered].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  return sorted[0].completedAt;
}

export function getNextDueFromTask(task: Task): Date | null {
  if (task.dueDates && task.dueDates.length > 0) {
    const sorted = [...task.dueDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return new Date(sorted[0]);
  }
  return computeNextDue(task.schedule, task.lastCompletedDate ?? null);
}

export function getTaskStatus(task: Task): TaskStatus {
  const hasCompletion = !!task.lastCompletedDate;
  const nextDue = getNextDueFromTask(task);
  if (!hasCompletion && task.schedule.kind === 'interval_from_completion') return 'not_started';
  if (!nextDue) return 'not_started';

  const today = startOfDay(new Date());
  const dueDate = startOfDay(nextDue);

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 14) return 'due_soon';
  return 'current';
}

export function getDaysUntilDue(task: Task): number | null {
  const nextDue = getNextDueFromTask(task);
  if (!nextDue) return null;

  const today = startOfDay(new Date());
  const dueDate = startOfDay(nextDue);

  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDueText(task: Task): string {
  const status = getTaskStatus(task);
  if (status === 'not_started') return 'Never done';

  const days = getDaysUntilDue(task);
  if (days === null) return 'Never done';

  if (days < 0) {
    const absDays = Math.abs(days);
    return absDays === 1 ? 'Overdue by 1 day' : `Overdue by ${absDays} days`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 7) return `Due in ${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'Due in 1 week' : `Due in ${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? 'Due in 1 month' : `Due in ${months} months`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? 'Due in 1 year' : `Due in ${years} years`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatInterval(value: number, unit: IntervalUnit): string {
  return `Every ${value} ${unit}`;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const NTH_LABELS: Record<string, string> = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth', '-1': 'Last' };

export function describeSchedule(schedule: Schedule): string {
  switch (schedule.kind) {
    case 'interval_from_completion':
      return schedule.intervalValue && schedule.intervalUnit
        ? `Every ${schedule.intervalValue} ${schedule.intervalUnit} after completion`
        : 'Interval';
    case 'interval_from_anchor':
      return schedule.intervalValue && schedule.intervalUnit
        ? `Every ${schedule.intervalValue} ${schedule.intervalUnit} from a fixed date`
        : 'Interval';
    case 'specific_date_recurring':
      return schedule.month && schedule.day
        ? `Every ${MONTH_NAMES[schedule.month - 1]} ${schedule.day}`
        : 'Specific date';
    case 'specific_date_once':
      return schedule.month && schedule.day && schedule.year
        ? `On ${MONTH_NAMES[schedule.month - 1]} ${schedule.day}, ${schedule.year}`
        : 'One-time';
    case 'day_of_month_pattern':
      if (!schedule.nth || schedule.weekday === undefined || !schedule.monthInterval) return 'Pattern';
      return `${NTH_LABELS[String(schedule.nth)]} ${WEEKDAY_NAMES[schedule.weekday]} every ${schedule.monthInterval} month${schedule.monthInterval === 1 ? '' : 's'}`;
    case 'weekly_pattern':
      if (!schedule.weeksInterval || !schedule.weekdays) return 'Weekly';
      return `Every ${schedule.weeksInterval} week${schedule.weeksInterval === 1 ? '' : 's'} on ${schedule.weekdays.map(w => WEEKDAY_NAMES[w]).join(', ')}`;
  }
  return '';
}

const STATUS_PRIORITY: Record<TaskStatus, number> = {
  overdue: 0,
  due_soon: 1,
  current: 2,
  not_started: 3,
};

export function getWorstStatus(statuses: TaskStatus[]): TaskStatus {
  if (statuses.length === 0) return 'not_started';
  return statuses.reduce((worst, s) =>
    STATUS_PRIORITY[s] < STATUS_PRIORITY[worst] ? s : worst
  );
}

export function statusSortKey(status: TaskStatus): number {
  return STATUS_PRIORITY[status];
}
