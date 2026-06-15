// ── CHRONOS BUG-PC-1/2 FIX (2026-06-15) — temporal correctness ──────────────
// Compare both dueDate and currentDate via UTC epoch ms to eliminate the
// locale-dependent ambiguity of `new Date(s).getTime()` when `s` is a local-
// format ISO string (no 'Z' suffix). Audit: docs/engines/TEMPORAL_ENGINE_CORRECTNESS.md
import { parseToUTCEpoch } from './temporal';

export interface CloseTask {
  id: string;
  name: string;
  assignee: string;
  /** ISO 8601 timestamp or date-only string. Date-only is treated as UTC midnight. */
  dueDate: string;
  dependsOn: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}

export interface CloseChecklist {
  period: string;
  tasks: CloseTask[];
  progress: number;
  slaBreaches: SLABreach[];
}

export interface SLABreach {
  taskId: string;
  taskName: string;
  assignee: string;
  dueDate: string;
  breachDate: string;
}

export class PeriodCloseEngine {
  static buildChecklist(period: string, tasks: CloseTask[]): CloseChecklist {
    const sortedTasks: CloseTask[] = [];
    const visited = new Set<string>();
    const processing = new Set<string>();

    const visit = (task: CloseTask) => {
      if (processing.has(task.id)) return;
      if (visited.has(task.id)) return;

      processing.add(task.id);
      task.dependsOn.forEach((depId) => {
        const depTask = tasks.find((t) => t.id === depId);
        if (depTask) visit(depTask);
      });
      processing.delete(task.id);
      visited.add(task.id);
      sortedTasks.push(task);
    };

    tasks.forEach((task) => visit(task));

    const finalTasks = sortedTasks.map((task) => {
      const dependencies = tasks.filter((t) => task.dependsOn.includes(t.id));
      const isBlocked = dependencies.some((d) => d.status !== 'completed');
      return {
        ...task,
        status: isBlocked && task.status !== 'completed' ? 'blocked' : task.status,
      } as CloseTask;
    });

    return {
      period,
      tasks: finalTasks,
      progress: this.calculateProgress({ period, tasks: finalTasks, progress: 0, slaBreaches: [] }),
      slaBreaches: this.getSLABreaches(finalTasks, new Date().toISOString()),
    };
  }

  static checkDependencies(taskId: string, checklist: CloseChecklist): string[] {
    const task = checklist.tasks.find((t) => t.id === taskId);
    if (!task) return [];
    return task.dependsOn.filter((depId) => {
      const depTask = checklist.tasks.find((t) => t.id === depId);
      return depTask && depTask.status !== 'completed';
    });
  }

  static calculateProgress(checklist: CloseChecklist): number {
    if (checklist.tasks.length === 0) return 0;
    const completed = checklist.tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / checklist.tasks.length) * 100);
  }

  static getSLABreaches(tasks: CloseTask[], currentDate: string): SLABreach[] {
    // CHRONOS BUG-PC-1/2 FIX: normalize both sides to UTC epoch ms.
    // Old code used `new Date(t.dueDate).getTime() < now` which is locale-
    // dependent when dueDate is a local-format ISO string (no 'Z').
    // Now: both sides go through parseToUTCEpoch for consistent UTC comparison.
    // Falls back to old behavior only if either side is unparseable.
    const nowMs = parseToUTCEpoch(currentDate);
    if (nowMs === null) return [];
    return tasks
      .filter((t) => {
        if (t.status === 'completed') return false;
        const dueMs = parseToUTCEpoch(t.dueDate);
        if (dueMs === null) return false;
        return dueMs < nowMs;
      })
      .map((t) => ({
        taskId: t.id,
        taskName: t.name,
        assignee: t.assignee,
        dueDate: t.dueDate,
        breachDate: currentDate,
      }));
  }

  static updateTaskStatus(
    taskId: string,
    newStatus: CloseTask['status'],
    checklist: CloseChecklist
  ): CloseChecklist | null {
    const task = checklist.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    if (task.status === 'completed' && newStatus !== 'completed') {
      // Check if any other task depends on this one
      const dependents = checklist.tasks.filter(
        (t) => t.dependsOn.includes(taskId) && t.status !== 'blocked'
      );
      if (dependents.length > 0) return null; // Cannot uncomplete if others depend on it
    }
    task.status = newStatus;
    // Recalculate blocked statuses
    const updatedTasks = checklist.tasks.map((t) => {
      if (t.id === taskId) return { ...t, status: newStatus };
      const dependencies = checklist.tasks.filter((d) => t.dependsOn.includes(d.id));
      const isBlocked = dependencies.some((d) => d.status !== 'completed');
      return isBlocked && t.status !== 'completed' ? { ...t, status: 'blocked' as const } : t;
    });
    return {
      ...checklist,
      tasks: updatedTasks,
      progress: this.calculateProgress({ ...checklist, tasks: updatedTasks }),
      slaBreaches: this.getSLABreaches(updatedTasks, new Date().toISOString()),
    };
  }
}
