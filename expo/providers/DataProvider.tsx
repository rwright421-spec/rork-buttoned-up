import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Thing, Task, CompletionLog, AppSettings, Area } from '@/constants/types';

const KEYS = {
  equipment: 'buttonedup_equipment',
  tasks: 'buttonedup_tasks',
  logs: 'buttonedup_logs',
  settings: 'buttonedup_settings',
  groups: 'buttonedup_groups',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'clean',
  notifications: { enabled: false, daysBefore: 3, reminderTime: '09:00' },
  onboardingComplete: false,
};

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`;
}

interface LegacyEquipment {
  id: string;
  name: string;
  type: Thing['type'];
  emoji: string;
  groupId?: string | null;
  areaId?: string;
  sortOrder?: number;
  createdAt: string;
  decomposeDismissed?: boolean;
}

interface LegacyTask {
  id: string;
  equipmentId?: string;
  thingId?: string;
  name: string;
  intervalValue: number;
  intervalUnit: Task['intervalUnit'];
  lastCompletedDate: string | null;
  notes: string;
  sortOrder?: number;
  createdAt: string;
}

export const [DataProvider, useData] = createContextHook(() => {
  const [things, setThings] = useState<Thing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<CompletionLog[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEYS.equipment),
      AsyncStorage.getItem(KEYS.tasks),
      AsyncStorage.getItem(KEYS.logs),
      AsyncStorage.getItem(KEYS.settings),
      AsyncStorage.getItem(KEYS.groups),
    ]).then(([eqStr, taskStr, logStr, settStr, groupStr]) => {
      let loadedAreas: Area[] = [];
      if (groupStr) {
        const parsed = JSON.parse(groupStr) as Area[];
        loadedAreas = parsed.map((g) => ({ ...g, emoji: g.emoji ?? '📁' }));
      }

      if (eqStr) {
        const parsed = JSON.parse(eqStr) as LegacyEquipment[];
        const hasUngrouped = parsed.some((e) => !e.areaId && (e.groupId === null || e.groupId === undefined));
        let generalAreaId: string | null = null;
        if (hasUngrouped) {
          const existingGeneral = loadedAreas.find((a) => a.name === 'General');
          if (existingGeneral) {
            generalAreaId = existingGeneral.id;
          } else {
            const general: Area = {
              id: generateId(),
              name: 'General',
              emoji: '📁',
              sortOrder: 0,
              createdAt: new Date().toISOString(),
            };
            loadedAreas = [general, ...loadedAreas];
            generalAreaId = general.id;
          }
        }
        const mapped: Thing[] = parsed.map((e, i) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          emoji: e.emoji,
          areaId: e.areaId ?? (e.groupId ?? generalAreaId ?? loadedAreas[0]?.id ?? ''),
          sortOrder: e.sortOrder ?? i,
          createdAt: e.createdAt,
          decomposeDismissed: e.decomposeDismissed,
        }));
        setThings(mapped);
      }

      setAreas(loadedAreas);

      if (taskStr) {
        const parsed = JSON.parse(taskStr) as LegacyTask[];
        setTasks(parsed.map((t, i) => ({
          id: t.id,
          thingId: t.thingId ?? t.equipmentId ?? '',
          name: t.name,
          intervalValue: t.intervalValue,
          intervalUnit: t.intervalUnit,
          lastCompletedDate: t.lastCompletedDate,
          notes: t.notes,
          sortOrder: t.sortOrder ?? i,
          createdAt: t.createdAt,
        })));
      }
      if (logStr) setLogs(JSON.parse(logStr));
      if (settStr) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settStr) });
      setLoaded(true);
      console.log('[DataProvider] Loaded data from storage');
    });
  }, []);

  const persist = useCallback((key: string, data: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  const addThing = useCallback((eq: Omit<Thing, 'id' | 'createdAt' | 'sortOrder'>): Thing => {
    const newThing: Thing = {
      ...eq,
      id: generateId(),
      sortOrder: things.length,
      createdAt: new Date().toISOString(),
    };
    setThings((prev) => {
      const updated = [...prev, newThing];
      persist(KEYS.equipment, updated);
      return updated;
    });
    console.log('[DataProvider] Added thing:', newThing.name);
    return newThing;
  }, [persist, things.length]);

  const updateThing = useCallback((id: string, updates: Partial<Thing>) => {
    setThings((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      persist(KEYS.equipment, updated);
      return updated;
    });
  }, [persist]);

  const deleteThing = useCallback((id: string) => {
    setThings((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      persist(KEYS.equipment, updated);
      return updated;
    });
    setTasks((prev) => {
      const taskIds = prev.filter((t) => t.thingId === id).map((t) => t.id);
      const updated = prev.filter((t) => t.thingId !== id);
      persist(KEYS.tasks, updated);
      setLogs((prevLogs) => {
        const updatedLogs = prevLogs.filter((l) => !taskIds.includes(l.taskId));
        persist(KEYS.logs, updatedLogs);
        return updatedLogs;
      });
      return updated;
    });
    console.log('[DataProvider] Deleted thing:', id);
  }, [persist]);

  const reorderThings = useCallback((reordered: Thing[]) => {
    setThings(reordered);
    persist(KEYS.equipment, reordered);
  }, [persist]);

  const moveThingToArea = useCallback((thingId: string, areaId: string) => {
    setThings((prev) => {
      const updated = prev.map((e) => (e.id === thingId ? { ...e, areaId } : e));
      persist(KEYS.equipment, updated);
      return updated;
    });
  }, [persist]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'sortOrder'>): Task => {
    const existingCount = tasks.filter((t) => t.thingId === task.thingId).length;
    const newTask: Task = { ...task, id: generateId(), sortOrder: existingCount, createdAt: new Date().toISOString() };
    setTasks((prev) => {
      const updated = [...prev, newTask];
      persist(KEYS.tasks, updated);
      return updated;
    });
    return newTask;
  }, [persist, tasks]);

  const addTasks = useCallback((newTasks: Omit<Task, 'id' | 'createdAt' | 'sortOrder'>[]): Task[] => {
    const existingCount = tasks.filter((t) => t.thingId === newTasks[0]?.thingId).length;
    const created = newTasks.map((t, i) => ({
      ...t,
      id: generateId(),
      sortOrder: existingCount + i,
      createdAt: new Date().toISOString(),
    }));
    setTasks((prev) => {
      const updated = [...prev, ...created];
      persist(KEYS.tasks, updated);
      return updated;
    });
    return created;
  }, [persist, tasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      persist(KEYS.tasks, updated);
      return updated;
    });
  }, [persist]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      persist(KEYS.tasks, updated);
      return updated;
    });
    setLogs((prev) => {
      const updated = prev.filter((l) => l.taskId !== id);
      persist(KEYS.logs, updated);
      return updated;
    });
  }, [persist]);

  const reorderTasks = useCallback((thingId: string, reordered: Task[]) => {
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.thingId !== thingId);
      const updated = [...otherTasks, ...reordered.map((t, i) => ({ ...t, sortOrder: i }))];
      persist(KEYS.tasks, updated);
      return updated;
    });
  }, [persist]);

  const moveTaskToThing = useCallback((taskId: string, destinationThingId: string) => {
    setTasks((prev) => {
      const destCount = prev.filter((t) => t.thingId === destinationThingId).length;
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, thingId: destinationThingId, sortOrder: destCount } : t
      );
      persist(KEYS.tasks, updated);
      return updated;
    });
    console.log('[DataProvider] Moved task', taskId, 'to thing', destinationThingId);
  }, [persist]);

  const addCompletionLog = useCallback((taskId: string, completedAt: string, notes: string) => {
    const newLog: CompletionLog = { id: generateId(), taskId, completedAt, notes };

    setLogs((prev) => {
      const task = tasks.find((t) => t.id === taskId);
      const existingTaskLogs = prev.filter((l) => l.taskId === taskId);
      const logsToAdd: CompletionLog[] = [];

      if (task?.lastCompletedDate) {
        const hasLogForLastCompleted = existingTaskLogs.some(
          (l) => l.completedAt === task.lastCompletedDate
        );
        if (!hasLogForLastCompleted) {
          logsToAdd.push({
            id: generateId(),
            taskId,
            completedAt: task.lastCompletedDate,
            notes: '',
          });
        }
      }

      logsToAdd.push(newLog);
      const updated = [...prev, ...logsToAdd];
      persist(KEYS.logs, updated);
      return updated;
    });

    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, lastCompletedDate: completedAt } : t
      );
      persist(KEYS.tasks, updated);
      return updated;
    });
  }, [persist, tasks]);

  const deleteCompletionLog = useCallback((logId: string) => {
    setLogs((prev) => {
      const deletedLog = prev.find((l) => l.id === logId);
      const updated = prev.filter((l) => l.id !== logId);
      persist(KEYS.logs, updated);

      if (deletedLog) {
        setTasks((prevTasks) => {
          const taskLogs = updated
            .filter((l) => l.taskId === deletedLog.taskId)
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
          const newLastCompleted = taskLogs.length > 0 ? taskLogs[0].completedAt : null;
          const updatedTasks = prevTasks.map((t) =>
            t.id === deletedLog.taskId ? { ...t, lastCompletedDate: newLastCompleted } : t
          );
          persist(KEYS.tasks, updatedTasks);
          return updatedTasks;
        });
      }
      return updated;
    });
  }, [persist]);

  const getTasksForThing = useCallback((thingId: string) => {
    return tasks.filter((t) => t.thingId === thingId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [tasks]);

  const getLogsForTask = useCallback((taskId: string) => {
    return logs
      .filter((l) => l.taskId === taskId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [logs]);

  const addArea = useCallback((name: string, emoji?: string): Area => {
    const newArea: Area = {
      id: generateId(),
      name,
      emoji: emoji ?? '📁',
      sortOrder: areas.length,
      createdAt: new Date().toISOString(),
    };
    setAreas((prev) => {
      const updated = [...prev, newArea];
      persist(KEYS.groups, updated);
      return updated;
    });
    return newArea;
  }, [persist, areas.length]);

  const updateArea = useCallback((id: string, updates: Partial<Area>) => {
    setAreas((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      persist(KEYS.groups, updated);
      return updated;
    });
  }, [persist]);

  const deleteArea = useCallback((id: string) => {
    setAreas((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      persist(KEYS.groups, updated);
      return updated;
    });
    setThings((prevThings) => {
      const thingsToDelete = prevThings.filter((t) => t.areaId === id);
      const thingIdsToDelete = new Set(thingsToDelete.map((t) => t.id));
      const updatedThings = prevThings.filter((t) => !thingIdsToDelete.has(t.id));
      persist(KEYS.equipment, updatedThings);
      setTasks((prevTasks) => {
        const taskIdsToDelete = new Set(
          prevTasks.filter((t) => thingIdsToDelete.has(t.thingId)).map((t) => t.id)
        );
        const updatedTasks = prevTasks.filter((t) => !thingIdsToDelete.has(t.thingId));
        persist(KEYS.tasks, updatedTasks);
        setLogs((prevLogs) => {
          const updatedLogs = prevLogs.filter((l) => !taskIdsToDelete.has(l.taskId));
          persist(KEYS.logs, updatedLogs);
          return updatedLogs;
        });
        return updatedTasks;
      });
      return updatedThings;
    });
  }, [persist]);

  const reorderAreas = useCallback((reordered: Area[]) => {
    const updated = reordered.map((g, i) => ({ ...g, sortOrder: i }));
    setAreas(updated);
    persist(KEYS.groups, updated);
  }, [persist]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      persist(KEYS.settings, updated);
      return updated;
    });
  }, [persist]);

  const resetAllData = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.equipment),
      AsyncStorage.removeItem(KEYS.tasks),
      AsyncStorage.removeItem(KEYS.logs),
      AsyncStorage.removeItem(KEYS.groups),
    ]);
    setThings([]);
    setTasks([]);
    setLogs([]);
    setAreas([]);
    console.log('[DataProvider] All data reset');
  }, []);

  return {
    things,
    tasks,
    logs,
    areas,
    settings,
    loaded,
    addThing,
    updateThing,
    deleteThing,
    reorderThings,
    moveThingToArea,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    reorderTasks,
    moveTaskToThing,
    addCompletionLog,
    deleteCompletionLog,
    getTasksForThing,
    getLogsForTask,
    addArea,
    updateArea,
    deleteArea,
    reorderAreas,
    updateSettings,
    resetAllData,
  };
});
