import { describe, it, expect, beforeEach } from 'vitest';
import { useCollaborationStore } from './collaborationStore';

describe('collaborationStore', () => {
  beforeEach(() => {
    useCollaborationStore.setState({
      comments: [],
      tasks: [],
      approvals: [],
      activityLog: [],
      isLoading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useCollaborationStore.getState();
    expect(state.comments).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.approvals).toEqual([]);
    expect(state.activityLog).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should add a comment', () => {
    useCollaborationStore.getState().addComment({
      content: 'Test comment',
      authorName: 'user-1',
      cellId: 'A1',
    } as any);
    expect(useCollaborationStore.getState().comments).toHaveLength(1);
    expect(useCollaborationStore.getState().comments[0].content).toBe('Test comment');
  });

  it('should set comments', () => {
    const comments = [{ id: 'cmt-1', content: 'Comment 1' }] as any;
    useCollaborationStore.getState().setComments(comments);
    expect(useCollaborationStore.getState().comments).toEqual(comments);
  });

  it('should add a task', () => {
    useCollaborationStore.getState().addTask({
      title: 'Test task',
      assignee: 'user-1',
      status: 'pending',
    } as any);
    expect(useCollaborationStore.getState().tasks).toHaveLength(1);
    expect(useCollaborationStore.getState().tasks[0].title).toBe('Test task');
  });

  it('should update task status', () => {
    useCollaborationStore.getState().addTask({
      title: 'Task 1',
      assignee: 'user-1',
      status: 'Todo',
    } as any);
    const taskId = useCollaborationStore.getState().tasks[0].id;
    useCollaborationStore.getState().updateTaskStatus(taskId, 'Done');
    expect(useCollaborationStore.getState().tasks[0].status).toBe('Done');
  });

  it('should set tasks', () => {
    const tasks = [{ id: 'tsk-1', title: 'Task 1' }] as any;
    useCollaborationStore.getState().setTasks(tasks);
    expect(useCollaborationStore.getState().tasks).toEqual(tasks);
  });

  it('should update approval status', () => {
    useCollaborationStore.getState().setApprovals([{ id: 'apr-1', status: 'pending' } as any]);
    useCollaborationStore.getState().updateApprovalStatus('apr-1', 'Approved', 'Looks good');
    const approval = useCollaborationStore.getState().approvals[0];
    expect(approval.status).toBe('Approved');
    expect(approval.comments).toBe('Looks good');
    expect(approval.reviewedAt).toBeDefined();
  });

  it('should add activity', () => {
    useCollaborationStore.getState().addActivity({
      action: 'created',
      userId: 'user-1',
      entityType: 'budget',
    } as any);
    expect(useCollaborationStore.getState().activityLog).toHaveLength(1);
  });
});
