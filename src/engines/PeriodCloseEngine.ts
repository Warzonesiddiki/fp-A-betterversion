export interface CloseTask {
  id: string;
  name: string;
  assignee: string;
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
    const now = new Date(currentDate).getTime();
    return tasks
      .filter((t) => t.status !== 'completed' && new Date(t.dueDate).getTime() < now)
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
