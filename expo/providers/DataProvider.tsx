import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Equipment, Task, CompletionLog, AppSettings } from '@/constants/types';

const KEYS = {
  equipment: 'buttonedup_equipment',
  tasks: 'buttonedup_tasks',
  logs: 'buttonedup_logs',
  settings: 'buttonedup_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'clean',
  notifications: { enabled: false, daysBefore: 3, reminderTime: '09:00' },
  onboardingComplete: false,
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export const [DataProvider, useData] = createContextHook(() => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<CompletionLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEYS.equipment),
      AsyncStorage.getItem(KEYS.tasks),
      AsyncStorage.getItem(KEYS.logs),
      AsyncStorage.getItem(KEYS.settings),
    ]).then(([eqStr, taskStr, logStr, settStr]) => {
      if (eqStr) setEquipment(JSON.parse(eqStr));
      if (taskStr) setTasks(JSON.parse(taskStr));
      if (logStr) setLogs(JSON.parse(logStr));
      if (settStr) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settStr) });
      setLoaded(true);
      console.log('[DataProvider] Loaded data from storage');
    });
  }, []);

  const persist = useCallback((key: string, data: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  const addEquipment = useCallback((eq: Omit<Equipment, 'id' | 'createdAt'>): Equipment => {
    const newEq: Equipment = { ...eq, id: generateId(), createdAt: new Date().toISOString() };
    setEquipment((prev) => {
      const updated = [...prev, newEq];
      persist(KEYS.equipment, updated);
      return updated;
    });
    console.log('[DataProvider] Added equipment:', newEq.name);
    return newEq;
  }, [persist]);

  const updateEquipment = useCallback((id: string, updates: Partial<Equipment>) => {
    setEquipment((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      persist(KEYS.equipment, updated);
      return updated;
    });
  }, [persist]);

  const deleteEquipment = useCallback((id: string) => {
    setEquipment((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      persist(KEYS.equipment, updated);
      return updated;
    });
    setTasks((prev) => {
      const taskIds = prev.filter((t) => t.equipmentId === id).map((t) => t.id);
      const updated = prev.filter((t) => t.equipmentId !== id);
      persist(KEYS.tasks, updated);
      setLogs((prevLogs) => {
        const updatedLogs = prevLogs.filter((l) => !taskIds.includes(l.taskId));
        persist(KEYS.logs, updatedLogs);
        return updatedLogs;
      });
      return updated;
    });
    console.log('[DataProvider] Deleted equipment:', id);
  }, [persist]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString() };
    setTasks((prev) => {
      const updated = [...prev, newTask];
      persist(KEYS.tasks, updated);
      return updated;
    });
    console.log('[DataProvider] Added task:', newTask.name);
    return newTask;
  }, [persist]);

  const addTasks = useCallback((newTasks: Omit<Task, 'id' | 'createdAt'>[]): Task[] => {
    const created = newTasks.map((t) => ({
      ...t,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }));
    setTasks((prev) => {
      const updated = [...prev, ...created];
      persist(KEYS.tasks, updated);
      return updated;
    });
    console.log('[DataProvider] Added', created.length, 'tasks');
    return created;
  }, [persist]);

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
    console.log('[DataProvider] Deleted task:', id);
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
          console.log('[DataProvider] Created history log for old lastCompletedDate:', task.lastCompletedDate);
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
    console.log('[DataProvider] Added completion for task:', taskId);
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

  const getTasksForEquipment = useCallback((equipmentId: string) => {
    return tasks.filter((t) => t.equipmentId === equipmentId);
  }, [tasks]);

  const getLogsForTask = useCallback((taskId: string) => {
    return logs
      .filter((l) => l.taskId === taskId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [logs]);

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
    ]);
    setEquipment([]);
    setTasks([]);
    setLogs([]);
    console.log('[DataProvider] All data reset');
  }, []);

  return {
    equipment,
    tasks,
    logs,
    settings,
    loaded,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    addCompletionLog,
    deleteCompletionLog,
    getTasksForEquipment,
    getLogsForTask,
    updateSettings,
    resetAllData,
  };
});
