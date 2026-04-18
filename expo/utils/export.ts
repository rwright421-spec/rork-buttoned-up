import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { Area, Thing, Task, CompletionLog, AppSettings } from '@/constants/types';
import { getTaskStatus, getMostRecentCompletion, formatDate, describeSchedule } from '@/utils/dates';

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  app: 'buttonedup';
  areas: Area[];
  things: Thing[];
  tasks: Task[];
  logs: CompletionLog[];
  settings: AppSettings;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function timestampSlug(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildBackupPayload(
  areas: Area[],
  things: Thing[],
  tasks: Task[],
  logs: CompletionLog[],
  settings: AppSettings,
): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'buttonedup',
    areas,
    things,
    tasks,
    logs,
    settings,
  };
}

export function buildTasksCsv(
  areas: Area[],
  things: Thing[],
  tasks: Task[],
  logs: CompletionLog[],
): string {
  const header = ['Area', 'Thing', 'Task', 'Schedule', 'NextDue', 'Status', 'LastCompleted', 'Notes'];
  const rows: string[][] = [header];

  const areaById = new Map(areas.map((a) => [a.id, a] as const));
  const thingById = new Map(things.map((t) => [t.id, t] as const));

  const sortedTasks = [...tasks].sort((a, b) => {
    const ta = thingById.get(a.thingId);
    const tb = thingById.get(b.thingId);
    const aa = ta ? areaById.get(ta.areaId)?.name ?? '' : '';
    const ab = tb ? areaById.get(tb.areaId)?.name ?? '' : '';
    if (aa !== ab) return aa.localeCompare(ab);
    const tan = ta?.name ?? '';
    const tbn = tb?.name ?? '';
    if (tan !== tbn) return tan.localeCompare(tbn);
    return a.name.localeCompare(b.name);
  });

  for (const task of sortedTasks) {
    const thing = thingById.get(task.thingId);
    const area = thing ? areaById.get(thing.areaId) : undefined;
    const lastCompleted = getMostRecentCompletion(task.id, logs);
    const nextDueIso = task.dueDates?.[0];
    rows.push([
      area?.name ?? '',
      thing?.name ?? '',
      task.name,
      describeSchedule(task.schedule),
      nextDueIso ? formatDate(nextDueIso) : '',
      getTaskStatus({ ...task, lastCompletedDate: lastCompleted }),
      lastCompleted ? formatDate(lastCompleted) : '',
      task.notes ?? '',
    ]);
  }

  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

async function writeAndShare(filename: string, contents: string, mimeType: string, dialogTitle: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([contents], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    } catch (e) {
      console.error('[export] web download failed', e);
      throw e;
    }
  }

  const file = new File(Paths.cache, filename);
  try {
    if (file.exists) file.delete();
  } catch (e) {
    console.log('[export] pre-delete ignored', e);
  }
  file.create();
  file.write(contents);

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle, UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text' });
  } else {
    await Share.share({ message: contents, title: dialogTitle });
  }
}

export async function exportBackupJson(payload: BackupPayload): Promise<void> {
  const filename = `buttonedup-backup-${timestampSlug()}.json`;
  const contents = JSON.stringify(payload, null, 2);
  await writeAndShare(filename, contents, 'application/json', 'Export Buttoned Up backup');
  console.log('[export] JSON backup exported', filename, contents.length, 'bytes');
}

export async function exportTasksCsv(
  areas: Area[],
  things: Thing[],
  tasks: Task[],
  logs: CompletionLog[],
): Promise<void> {
  const filename = `buttonedup-tasks-${timestampSlug()}.csv`;
  const contents = buildTasksCsv(areas, things, tasks, logs);
  await writeAndShare(filename, contents, 'text/csv', 'Export task roster');
  console.log('[export] CSV exported', filename, contents.length, 'bytes');
}

export function summarizeBackup(payload: BackupPayload): string {
  return `${payload.areas.length} area(s), ${payload.things.length} thing(s), ${payload.tasks.length} task(s), ${payload.logs.length} log(s)`;
}
