import { describe, it, expect } from 'vitest';
import { PeriodCloseEngine, type CloseTask } from './PeriodCloseEngine';

describe('PeriodCloseEngine', () => {
  describe('buildChecklist', () => {
    const tasks: CloseTask[] = [
      {
        id: 't1',
        name: 'Reconcile Bank',
        assignee: 'Alice',
        dueDate: '2024-02-05',
        dependsOn: [],
        status: 'pending',
      },
      {
        id: 't2',
        name: 'Close AP',
        assignee: 'Bob',
        dueDate: '2024-02-06',
        dependsOn: ['t1'],
        status: 'pending',
      },
      {
        id: 't3',
        name: 'Run Reports',
        assignee: 'Charlie',
        dueDate: '2024-02-07',
        dependsOn: ['t2'],
        status: 'pending',
      },
    ];

    it('should build a checklist with correct period', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', tasks);
      expect(checklist.period).toBe('2024-01');
      expect(checklist.tasks).toHaveLength(3);
    });

    it('should mark dependent tasks as blocked', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', tasks);
      const t2 = checklist.tasks.find((t) => t.id === 't2');
      expect(t2?.status).toBe('blocked');
    });

    it('should calculate progress correctly', () => {
      const completedTasks = tasks.map((t) => ({ ...t, status: 'completed' as const }));
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', completedTasks);
      expect(checklist.progress).toBe(100);
    });

    it('should handle empty task list', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', []);
      expect(checklist.progress).toBe(0);
      expect(checklist.tasks).toEqual([]);
    });
  });

  describe('checkDependencies', () => {
    it('should return incomplete dependencies', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', [
        {
          id: 't1',
          name: 'Task 1',
          assignee: 'A',
          dueDate: '2024-01-05',
          dependsOn: [],
          status: 'pending',
        },
        {
          id: 't2',
          name: 'Task 2',
          assignee: 'B',
          dueDate: '2024-01-06',
          dependsOn: ['t1'],
          status: 'pending',
        },
      ]);
      const deps = PeriodCloseEngine.checkDependencies('t2', checklist);
      expect(deps).toContain('t1');
    });

    it('should return empty for task with no dependencies', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', [
        {
          id: 't1',
          name: 'Task 1',
          assignee: 'A',
          dueDate: '2024-01-05',
          dependsOn: [],
          status: 'pending',
        },
      ]);
      expect(PeriodCloseEngine.checkDependencies('t1', checklist)).toEqual([]);
    });

    it('should return empty for unknown task', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', []);
      expect(PeriodCloseEngine.checkDependencies('unknown', checklist)).toEqual([]);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate 0% for no tasks', () => {
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', []);
      expect(PeriodCloseEngine.calculateProgress(checklist)).toBe(0);
    });

    it('should calculate 50% for half completed', () => {
      const tasks: CloseTask[] = [
        {
          id: 't1',
          name: 'Task 1',
          assignee: 'A',
          dueDate: '2024-01-05',
          dependsOn: [],
          status: 'completed',
        },
        {
          id: 't2',
          name: 'Task 2',
          assignee: 'B',
          dueDate: '2024-01-06',
          dependsOn: [],
          status: 'pending',
        },
      ];
      const checklist = PeriodCloseEngine.buildChecklist('2024-01', tasks);
      expect(checklist.progress).toBe(50);
    });
  });

  describe('getSLABreaches', () => {
    it('should detect overdue tasks', () => {
      const tasks: CloseTask[] = [
        {
          id: 't1',
          name: 'Overdue Task',
          assignee: 'A',
          dueDate: '2023-01-01',
          dependsOn: [],
          status: 'pending',
        },
      ];
      const breaches = PeriodCloseEngine.getSLABreaches(tasks, '2025-01-01');
      expect(breaches).toHaveLength(1);
      expect(breaches![0]!.taskId).toBe('t1');
    });

    it('should not report completed tasks as breaches', () => {
      const tasks: CloseTask[] = [
        {
          id: 't1',
          name: 'Completed Late',
          assignee: 'A',
          dueDate: '2023-01-01',
          dependsOn: [],
          status: 'completed',
        },
      ];
      const breaches = PeriodCloseEngine.getSLABreaches(tasks, '2025-01-01');
      expect(breaches).toHaveLength(0);
    });
  });
});
