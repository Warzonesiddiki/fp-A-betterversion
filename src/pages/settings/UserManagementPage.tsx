import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Users, UserPlus, Shield, Mail, Clock, Trash2, Edit2, X } from 'lucide-react';
import type { UserProfile, Role } from '@/types';

const defaultRoles: { id: string; name: string; permissions: string[] }[] = [
  { id: 'role-admin', name: 'Admin', permissions: ['all'] },
  { id: 'role-manager', name: 'Manager', permissions: ['view', 'edit', 'approve'] },
  { id: 'role-analyst', name: 'Analyst', permissions: ['view', 'edit'] },
  { id: 'role-viewer', name: 'Viewer', permissions: ['view'] },
];

export default function UserManagementPage() {
  const { users, addUser, deleteUser } = useSettingsStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [_editingId, setEditingId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Analyst' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'FinPlan Pro - User Management';
  }, []);

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    addUser({
      name: newUser.name,
      email: newUser.email,
      firstName: newUser.name.split(' ')[0] || newUser.name,
      lastName: newUser.name.split(' ').slice(1).join(' ') || '',
      role: newUser.role as Role,
      department: '',
      status: 'Active' as const,
    });
    setNewUser({ name: '', email: '', role: 'Analyst' });
    setShowAddForm(false);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    Admin: 'bg-red-900/50 text-red-400',
    Manager: 'bg-blue-900/50 text-blue-400',
    Analyst: 'bg-green-900/50 text-green-400',
    Viewer: 'bg-slate-700 text-slate-400',
  };

  const activityLog = [
    { user: 'Admin User', action: 'Updated budget forecast', time: '2 min ago' },
    { user: 'Admin User', action: 'Exported P&L report', time: '15 min ago' },
    { user: 'Admin User', action: 'Approved Q2 budget', time: '1 hour ago' },
    { user: 'Admin User', action: 'Imported GL data', time: '3 hours ago' },
    { user: 'Admin User', action: 'Created scenario', time: 'Yesterday' },
  ];

  const userColumns: Column<UserProfile>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
            {(r.name ?? '').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{r.name ?? ''}</div>
            <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (_, r) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${roleColors[r.role] || 'bg-slate-700 text-slate-400'}`}
        >
          {r.role}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Status',
      render: () => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
          Active
        </span>
      ),
    },
    {
      key: 'id' as keyof (typeof users)[0],
      header: 'Actions',
      render: (_, r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditingId(r.id)}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(r.id)}>
            <Trash2 className="h-3 w-3 text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="User Management"
        purpose={<>{users.length}users registered</>}
        actions={
          <Button onClick={() => setShowAddForm(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Add User
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-xs text-[var(--text-muted)]">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === 'Admin').length}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === 'Analyst').length}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Analysts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-2xl font-bold">{defaultRoles.length}</div>
            <div className="text-xs text-[var(--text-muted)]">Roles</div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New User</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                aria-label="Close add user form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="text-sm text-[var(--text-muted)] mb-1 block">
                  Name
                </label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm text-[var(--text-muted)] mb-1 block">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label htmlFor="role" className="text-sm text-[var(--text-muted)] mb-1 block">
                  Role
                </label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
                >
                  {defaultRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddUser}>Add User</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users</CardTitle>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredUsers}
                columns={userColumns}
                pageSize={8}
                caption="User accounts: name, email, role, and last activity for each user"
                ariaLabel="User management table"
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <div className="text-sm">{log.action}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {log.user} | {log.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {defaultRoles.map((role) => (
              <div key={role.id} className="p-4 bg-slate-800 rounded-lg">
                <div className="font-medium mb-2">{role.name}</div>
                <div className="space-y-1">
                  {role.permissions.map((p) => (
                    <div key={p} className="text-xs text-slate-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {p === 'all' ? 'Full Access' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
