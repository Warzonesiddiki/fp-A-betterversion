/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useCollaborationStore } from '@/store/collaborationStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import {
  Users,
  MessageSquare,
  CheckSquare,
  Activity,
  Search,
  Download,
  RefreshCw,
  Eye,
  Circle,
  UserCheck,
} from 'lucide-react';
import type { GLEntry } from '@/types';
import { roundTo, sumMoney } from '@/utils/money';

interface TeamMember {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastActive: number;
  avatarColor: string;
}

function generateDemoTeam(): TeamMember[] {
  return [
    {
      id: 'm1',
      name: 'Carla Vargas',
      role: 'admin',
      status: 'online',
      lastActive: Date.now() - 60_000,
      avatarColor: 'blue',
    },
    {
      id: 'm2',
      name: 'Vera Chen',
      role: 'editor',
      status: 'online',
      lastActive: Date.now() - 5 * 60_000,
      avatarColor: 'green',
    },
    {
      id: 'm3',
      name: 'Chris Patel',
      role: 'editor',
      status: 'away',
      lastActive: Date.now() - 30 * 60_000,
      avatarColor: 'yellow',
    },
    {
      id: 'm4',
      name: 'Beth Williams',
      role: 'viewer',
      status: 'offline',
      lastActive: Date.now() - 24 * 60 * 60_000,
      avatarColor: 'slate',
    },
    {
      id: 'm5',
      name: 'Diana Foster',
      role: 'editor',
      status: 'online',
      lastActive: Date.now() - 10 * 60_000,
      avatarColor: 'purple',
    },
  ];
}

function computeWorkspaceStats(entries: readonly GLEntry[]) {
  const totalDebit = roundTo(sumMoney(entries.map((e) => e.debit)), 2);
  const totalCredit = roundTo(sumMoney(entries.map((e) => e.credit)), 2);
  const netChange = roundTo(sumMoney(entries.map((e) => e.netChange)), 2);
  const uniqueAccounts = new Set(entries.map((e) => e.accountCode)).size;

  const accountMap = new Map<
    string,
    { name: string; debit: number; credit: number; net: number; count: number }
  >();
  for (const e of entries) {
    const existing = accountMap.get(e.accountCode) ?? {
      name: e.accountName,
      debit: 0,
      credit: 0,
      net: 0,
      count: 0,
    };
    existing.debit += e.debit;
    existing.credit += e.credit;
    existing.net += e.netChange;
    existing.count += 1;
    accountMap.set(e.accountCode, existing);
  }

  const accountBreakdown = Array.from(accountMap.entries())
    .map(([code, data]) => ({
      accountCode: code,
      accountName: data.name,
      debit: data.debit,
      credit: data.credit,
      netChange: data.net,
      transactions: data.count,
    }))
    .sort((a, b) => Math.abs(b.credit) - Math.abs(a.credit));

  return { totalDebit, totalCredit, netChange, uniqueAccounts, accountBreakdown };
}

const memberColumns: Column[] = [
  { key: 'name', header: 'Member', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'lastActive', header: 'Last Active', sortable: true },
];

const accountColumns: Column[] = [
  { key: 'accountCode', header: 'Account Code', sortable: true },
  { key: 'accountName', header: 'Account Name', sortable: true },
  { key: 'debit', header: 'Debit', align: 'right', sortable: true },
  { key: 'credit', header: 'Credit', align: 'right', sortable: true },
  { key: 'netChange', header: 'Net Change', align: 'right', sortable: true },
  { key: 'transactions', header: 'Transactions', align: 'right', sortable: true },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'online', label: 'Online' },
  { value: 'away', label: 'Away' },
  { value: 'offline', label: 'Offline' },
];

const STATUS_COLOR: Record<string, string> = {
  online: 'text-green-700 dark:text-green-300',
  away: 'text-yellow-700 dark:text-yellow-300',
  offline: 'text-slate-500 dark:text-slate-400',
};

function formatLastActive(timestamp: number, now: number): string {
  const diffMs = now - timestamp;
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 60 * 60_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 24 * 60 * 60_000) return `${Math.floor(diffMs / (60 * 60_000))}h ago`;
  return `${Math.floor(diffMs / (24 * 60 * 60_000))}d ago`;
}

export function TeamWorkspace() {
  const { entries } = useGLStore();
  const { comments, tasks, activityLog } = useCollaborationStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Real-time tick for "last active" indicators
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = 'FinPlan Pro — Team Workspace';
  }, []);

  const stats = useMemo(() => computeWorkspaceStats(entries), [entries]);

  const teamMembers: TeamMember[] = useMemo(() => generateDemoTeam(), []);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teamMembers.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [teamMembers, searchQuery, roleFilter, statusFilter]);

  const onlineCount = teamMembers.filter((m) => m.status === 'online').length;
  const openTasks = tasks.filter((t) => (t as { status?: string }).status !== 'done').length;
  const completedTasks = tasks.length - openTasks;

  const memberTableData = useMemo(
    () =>
      filteredMembers.map((m) => ({
        name: m.name,
        role: m.role,
        status: m.status,
        lastActive: formatLastActive(m.lastActive, nowTick),
      })),
    [filteredMembers, nowTick]
  );

  const accountTableData = useMemo(
    () =>
      stats.accountBreakdown.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debit: formatCurrency(row.debit),
        credit: formatCurrency(row.credit),
        netChange: formatCurrency(row.netChange),
        transactions: formatNumber(row.transactions),
      })),
    [stats.accountBreakdown]
  );

  const handleRefresh = useCallback(() => {
    setNowTick(Date.now());
  }, []);

  const handleExportCsv = useCallback(() => {
    if (filteredMembers.length === 0) return;
    const header = 'id,name,role,status,lastActive';
    const rows = filteredMembers.map((m) =>
      [
        m.id,
        `"${m.name.replace(/"/g, '""')}"`,
        m.role,
        m.status,
        new Date(m.lastActive).toISOString(),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-workspace-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredMembers]);

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Team Workspace - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Users className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Team Workspace Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view team workspace.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view team workspace"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="Team Workspace Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 id="workspace-heading" className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-700" aria-hidden="true" />
            Team Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {formatNumber(entries.length)} entries imported
            {teamMembers.length} team members • {onlineCount} online
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-3 py-1 gap-1" aria-label="Real-time indicator">
            <span className="h-2 w-2 rounded-full bg-green-700 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-medium text-green-700">Live</span>
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            aria-label="Refresh team workspace"
          >
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={filteredMembers.length === 0}
            aria-label="Export team workspace to CSV"
          >
            <Download className="h-4 w-4 mr-1" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </header>

      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Workspace KPIs"
        aria-labelledby="workspace-heading"
      >
        <KPIValue
          label="Team Members"
          value={formatNumber(teamMembers.length)}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Online Now"
          value={formatNumber(onlineCount)}
          icon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Open Tasks"
          value={formatNumber(openTasks)}
          icon={<CheckSquare className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Activity Log"
          value={formatNumber(activityLog.length)}
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue={activeTab}
        aria-label="Team workspace views"
      >
        <TabsList aria-label="Tab list">
          <TabsTrigger value="overview" aria-label="Overview tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" aria-label="Members tab">
            Members ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" aria-label="Tasks tab">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="activity" aria-label="Activity tab">
            Activity ({activityLog.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <Card aria-label="Account Overview">
            <CardHeader>
              <CardTitle id="team-account-overview-title">Account Overview</CardTitle>
              <CardDescription>Top accounts by credit activity</CardDescription>
            </CardHeader>
            <CardContent aria-labelledby="team-account-overview-title">
              {accountTableData.length > 0 ? (
                <DataTable
                  columns={accountColumns}
                  data={accountTableData}
                  sortable
                  caption="Team workspace accounts table"
                  ariaLabel="Team workspace accounts"
                />
              ) : (
                <p className="text-slate-400">No account data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members tab */}
        <TabsContent value="members">
          <Card aria-label="Team Members">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle id="team-members-title">Team Members</CardTitle>
                  <CardDescription>
                    {filteredMembers.length} of {teamMembers.length} member
                    {teamMembers.length === 1 ? '' : 's'} shown
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4" aria-labelledby="team-members-title">
              {/* Filter row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Search by member name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    aria-label="Search team members"
                  />
                </div>
                <Select
                  label="Role"
                  options={ROLE_OPTIONS}
                  value={roleFilter}
                  onChange={setRoleFilter}
                />
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>

              {memberTableData.length > 0 ? (
                <DataTable
                  columns={memberColumns}
                  data={memberTableData}
                  sortable
                  caption="Team members table"
                  ariaLabel="Team members"
                />
              ) : (
                <p className="text-slate-400">No team members match the current filters.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks tab */}
        <TabsContent value="tasks">
          <Card aria-label="Collaboration tasks">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <CardDescription>
                {tasks.length} total • {openTasks} open • {completedTasks} completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-slate-500 text-sm">No tasks yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {tasks.slice(0, 10).map((t, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                        {String(
                          (t as { title?: string; id?: string }).title ??
                            (t as { id?: string }).id ??
                            `Task ${i + 1}`
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {String((t as { status?: string }).status ?? 'open')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity">
          <Card aria-label="Activity log">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
              <CardDescription>
                {activityLog.length} event{activityLog.length === 1 ? '' : 's'} • Comments:{' '}
                {comments.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLog.length === 0 ? (
                <p className="text-slate-500 text-sm">No activity yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {activityLog.slice(0, 15).map((a, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 p-2 rounded bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <Circle
                        className="h-2 w-2 mt-2 text-blue-700 fill-blue-700 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-slate-700 dark:text-slate-300 flex-1">
                        {String(
                          (a as { message?: string; text?: string }).message ??
                            (a as { text?: string }).text ??
                            ''
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card
        className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800"
        aria-label="Help"
      >
        <CardContent className="pt-6 flex items-start gap-3">
          <Eye
            className="h-5 w-5 text-sky-700 dark:text-sky-300 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-sky-900 dark:text-sky-200">
              About Team Workspace
            </p>
            <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">
              Team Workspace shows team members, online status, tasks, and activity log. Filter by
              role or status to find specific members. The activity log tracks collaboration
              history. Export the member list to CSV for audit purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default TeamWorkspace;
