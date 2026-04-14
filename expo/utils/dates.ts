import { IntervalUnit, Task, TaskStatus } from '@/constants/types';

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

export function getNextDueDate(task: Task): Date | null {
  if (!task.lastCompletedDate) return null;
  return addInterval(new Date(task.lastCompletedDate), task.intervalValue, task.intervalUnit);
}

export function getTaskStatus(task: Task): TaskStatus {
  if (!task.lastCompletedDate) return 'not_started';
  const nextDue = getNextDueDate(task);
  if (!nextDue) return 'not_started';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextDue);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 14) return 'due_soon';
  return 'current';
}

export function getDaysUntilDue(task: Task): number | null {
  const nextDue = getNextDueDate(task);
  if (!nextDue) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextDue);
  dueDate.setHours(0, 0, 0, 0);

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
