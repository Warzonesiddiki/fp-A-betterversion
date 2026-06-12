/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollaborationStore } from '@/store/collaborationStore';
import { useAuthStore } from '@/store/authStore';
import type { TaskStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { MessageSquare, Users, Clock, Activity, Plus, Send } from 'lucide-react';

type Tab = 'comments' | 'tasks' | 'activity';

interface CommentRow extends Record<string, any> {
  id: string;
  author: string;
  content: string;
  resourceType: string;
  resourceName: string;
  createdAt: string;
  replyCount: number;
}

interface TaskRow extends Record<string, any> {
  id: string;
  title: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  dueDate: string;
}

interface ActivityRow extends Record<string, any> {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
}

export default function CollaborationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    comments: rawComments,
    tasks: rawTasks,
    activityLog: rawActivityLog,
    addComment,
    addTask,
    updateTaskStatus,
    addActivity,
  } = useCollaborationStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comments = rawComments ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasks = rawTasks ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activityLog = rawActivityLog ?? [];

  const [activeTab, setActiveTab] = useState<Tab>('comments');
  const [newComment, setNewComment] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Collaboration';
  }, []);

  const commentRows: CommentRow[] = useMemo(
    () =>
      comments.map((c) => ({
        id: c.id,
        author: c.authorName,
        content: c.content,
        resourceType: c.resourceType,
        resourceName: c.resourceName ?? '',
        createdAt: c.createdAt,
        replyCount: c.replies?.length ?? 0,
      })),
    [comments]
  );

  const taskRows: TaskRow[] = useMemo(
    () =>
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        assignee: t.assigneeName,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
      })),
    [tasks]
  );

  const activityRows: ActivityRow[] = useMemo(
    () =>
      activityLog.map((a) => ({
        id: a.id,
        user: a.userName,
        action: a.action,
        resource: a.resourceName,
        timestamp: a.timestamp,
      })),
    [activityLog]
  );

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    const displayName = user.name ?? `${user.firstName} ${user.lastName}`;
    addComment({
      resourceType: 'general',
      resourceId: 'collaboration',
      cellId: null,
      parentId: null,
      authorId: user.id,
      authorName: displayName,
      authorInitials: displayName
        .split(' ')
        .map((n) => n[0]!)
        .join('')
        .toUpperCase(),
      content: newComment,
      mentions: [],
      isResolved: false,
      resolvedAt: null,
    });
    addActivity({
      userId: user.id,
      userName: displayName,
      userEmail: user.email ?? '',
      action: 'commented',
      resourceType: 'general',
      resourceId: 'collaboration',
      resourceName: 'Collaboration',
      details: null,
    });
    setNewComment('');
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !user) return;
    const displayName = user.name ?? `${user.firstName} ${user.lastName}`;
    addTask({
      title: newTaskTitle,
      description: '',
      assigneeId: user.id,
      assigneeName: displayName,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'Medium',
      status: 'Pending',
      relatedResourceType: null,
      relatedResourceId: null,
      createdBy: user.id,
    });
    addActivity({
      userId: user.id,
      userName: displayName,
      userEmail: user.email ?? '',
      action: 'created task',
      resourceType: 'task',
      resourceId: 'new',
      resourceName: newTaskTitle,
      details: null,
    });
    setNewTaskTitle('');
    setShowNewTask(false);
  };

  const handleStatusChange = (taskId: string, status: TaskRow['status']) => {
    updateTaskStatus(taskId, status as TaskStatus);
    if (user) {
      const displayName = user.name ?? `${user.firstName} ${user.lastName}`;
      addActivity({
        userId: user.id,
        userName: displayName,
        userEmail: user.email ?? '',
        action: `changed task status to ${status}`,
        resourceType: 'task',
        resourceId: taskId,
        resourceName: taskId,
        details: null,
      });
    }
  };

  const commentColumns: Column<CommentRow>[] = [
    { key: 'author', header: 'Author', width: '120px' },
    { key: 'content', header: 'Comment' },
    { key: 'resourceType', header: 'Type', width: '100px' },
    { key: 'resourceName', header: 'Resource', width: '150px' },
    {
      key: 'createdAt',
      header: 'Date',
      width: '140px',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    { key: 'replyCount', header: 'Replies', width: '80px', align: 'center' },
  ];

  const taskColumns: Column<TaskRow>[] = [
    { key: 'title', header: 'Task' },
    { key: 'assignee', header: 'Assignee', width: '120px' },
    {
      key: 'priority',
      header: 'Priority',
      width: '100px',
      render: (v) => (
        <span
          className={
            v === 'Critical' ? 'text-red-600 font-semibold' : v === 'High' ? 'text-orange-500' : ''
          }
        >
          {v}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (v, row) => (
        <select
          value={v}
          onChange={(e) => handleStatusChange(row.id, e.target.value as TaskRow['status'])}
          className="bg-transparent border rounded px-2 py-1 text-sm"
        >
          <option value="Pending">Pending</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      width: '120px',
      render: (v) => new Date(v).toLocaleDateString(),
    },
  ];

  const activityColumns: Column<ActivityRow>[] = [
    { key: 'user', header: 'User', width: '120px' },
    { key: 'action', header: 'Action', width: '180px' },
    { key: 'resource', header: 'Resource' },
    {
      key: 'timestamp',
      header: 'Time',
      width: '160px',
      render: (v) => new Date(v).toLocaleString(),
    },
  ];

  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'InProgress').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collaboration Hub</h1>
          <p className="text-muted-foreground">Comments, tasks, and activity across your team</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/collaboration/approvals')}>
            Approval Queue
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Comments"
              value={comments.length}
              icon={<MessageSquare className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Pending Tasks"
              value={pendingTasks}
              icon={<Clock className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="In Progress"
              value={inProgressTasks}
              icon={<Users className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Activity"
              value={activityLog.length}
              icon={<Activity className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        {(['comments', 'tasks', 'activity'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'comments' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Post
                </Button>
              </div>
            </CardContent>
          </Card>
          {commentRows.length > 0 ? (
            <DataTable data={commentRows} columns={commentColumns} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Start the conversation above.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewTask(!showNewTask)}>
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          </div>
          {showNewTask && (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {taskRows.length > 0 ? (
            <DataTable data={taskRows} columns={taskColumns} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks yet. Create one above.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          {activityRows.length > 0 ? (
            <DataTable data={activityRows} columns={activityColumns} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No activity recorded yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
