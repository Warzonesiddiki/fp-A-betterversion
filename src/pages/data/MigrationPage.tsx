import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import MigrationWizard from '@/components/migration/MigrationWizard';
import { formatPercent } from '@/utils/financialFormatting';
import {
  ArrowLeft,
  Database,
  FileSpreadsheet,
  FileText,
  Layers,
  Building2,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  MigrationEngine,
  type MigrationSource,
  type MigrationSnapshot,
} from '@/engines/MigrationEngine';
import { PageHeader } from '@/components/ui/PageHeader';
// MORPHEUS PICK 8 (2026-06-18): 40L → ~400L. Added 4-stat header, last migration
// summary, source system picker grid (5 sources), recent migrations history list
// (last 10), cube migration section, action buttons. Targets SOX 404 compliance
// auditor workflow + enterprise migration onboarding (Planful/Adaptive/Anaplan).
// PROMETHEUS TURN 346+ fix (cycle 25): aligned page with MigrationSnapshot
// interface — uses timestamp/data.length/applied/id instead of non-existent
// MigrationResult fields (completedAt, rowCount, status, snapshotId).
// NOTE: CubeMigrationEngine import removed (was unused per ESLint 2026-06-18).

const migrationEngine = new MigrationEngine();

const SOURCE_PICKER: {
  value: MigrationSource;
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
  badge: string;
}[] = [
  {
    value: 'excel',
    label: 'Excel',
    description: 'XLSX / XLS workbooks with multiple sheets',
    icon: FileSpreadsheet,
    badge: 'Most common',
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated flat files',
    icon: FileText,
    badge: 'Lightweight',
  },
  {
    value: 'planful',
    label: 'Planful',
    description: 'Export from Planful and import',
    icon: Building2,
    badge: 'Cloud EPM',
  },
  {
    value: 'adaptive',
    label: 'Adaptive Insights',
    description: 'Export from Adaptive and import',
    icon: Building2,
    badge: 'Cloud EPM',
  },
  {
    value: 'anaplan',
    label: 'Anaplan',
    description: 'Export from Anaplan and import',
    icon: Building2,
    badge: 'Cloud EPM',
  },
];

const CUBE_SOURCES = [
  { value: 'essbase', label: 'Oracle Essbase' },
  { value: 'tm1', label: 'IBM TM1' },
  { value: 'ssas', label: 'MS SQL Server Analysis Services' },
] as const;

export default function MigrationPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState<MigrationSnapshot[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [activeSource, setActiveSource] = useState<MigrationSource | null>(null);
  const [showCubePicker, setShowCubePicker] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    document.title = 'FinPlan Pro — Data Migration';
    setHistory(migrationEngine.getMigrationSnapshots());
    const interval = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // 4-stat header KPIs
  const stats = useMemo(() => {
    const last7d = history.filter(
      (m) => nowTick - new Date(m.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const totalRecords = history.reduce((sum, m) => sum + (m.data?.length || 0), 0);
    const successCount = history.filter((m) => m.applied).length;
    const successRate = history.length > 0 ? (successCount / history.length) * 100 : 0;
    return {
      total: history.length,
      last7d: last7d.length,
      totalRecords,
      successRate,
    };
  }, [history, nowTick]);

  const lastMigration = useMemo(
    () => (history.length > 0 ? (history[history.length - 1] ?? null) : null),
    [history]
  );

  const handleStartMigration = useCallback((source: MigrationSource) => {
    setActiveSource(source);
    setShowWizard(true);
  }, []);

  const handleComplete = useCallback(
    (snapshotId: string) => {
      setHistory(migrationEngine.getMigrationSnapshots());
      setShowWizard(false);
      setActiveSource(null);
      navigate('/data', { state: { migrationComplete: true, snapshotId } });
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    setShowWizard(false);
    setActiveSource(null);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (window.confirm(`Clear all ${history.length} migration records? This cannot be undone.`)) {
      migrationEngine.clearMigrationSnapshots();
      setHistory([]);
    }
  }, [history.length]);

  const formatTimestamp = (iso: string, now: number): string => {
    const d = new Date(iso);
    const diffMs = now - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toISOString().slice(0, 10);
  };

  if (showWizard) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader
          icon={<Database className="h-6 w-6" />}
          title={`Data Migration — ${SOURCE_PICKER.find((s) => s.value === activeSource)?.label ?? ''}`}
          actions={
            <Button variant="ghost" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
            </Button>
          }
        />
        <MigrationWizard onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Database className="h-6 w-6" />}
        title="Data Migration"
        purpose="Migrate data from Excel, Planful, Adaptive, or Anaplan into FinPlan Pro"
        actions={
          <Button variant="outline" onClick={() => navigate('/data')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Data
          </Button>
        }
      />

      {/* 4-stat header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Total Migrations
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {stats.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Last 7 Days
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-sky-400">{stats.last7d}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Records Imported
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-purple-400">
              {stats.totalRecords.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Success Rate
            </div>
            <div
              className={`text-2xl font-bold tabular-nums mt-1 ${
                stats.successRate >= 95
                  ? 'text-green-400'
                  : stats.successRate >= 80
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {formatPercent(stats.successRate)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source system picker grid */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Source System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOURCE_PICKER.map((source) => {
              const Icon = source.icon;
              return (
                <button
                  key={source.value}
                  type="button"
                  onClick={() => handleStartMigration(source.value)}
                  className="text-left p-4 rounded border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-sky-600 transition-colors"
                  aria-label={`Start ${source.label} migration`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm">{source.label}</div>
                        <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          {source.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{source.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cube migration (essbase/tm1/ssas) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> Cube Migration
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCubePicker((v) => !v)}
              aria-expanded={showCubePicker}
            >
              {showCubePicker ? 'Hide' : 'Show'} sources
            </Button>
          </div>
        </CardHeader>
        {showCubePicker && (
          <CardContent>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Migrate OLAP cubes from enterprise EPM systems. Cube migration uses a separate engine
              and writes to a different snapshot namespace.
            </p>
            <div className="flex flex-wrap gap-2">
              {CUBE_SOURCES.map((src) => (
                <Button
                  key={src.value}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    alert(
                      `Cube migration from ${src.label} is currently in pre-release. Use MigrationEngine for row-level imports.`
                    )
                  }
                >
                  Migrate from {src.label}
                </Button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Last migration summary */}
      {lastMigration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Last Migration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Source
                </div>
                <div className="font-semibold mt-0.5">{lastMigration.source}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Records
                </div>
                <div className="font-semibold tabular-nums mt-0.5">
                  {(lastMigration.data?.length ?? 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Status
                </div>
                <div
                  className={`font-semibold mt-0.5 ${
                    lastMigration.applied ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {lastMigration.applied ? 'success' : 'rolled back'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Completed
                </div>
                <div className="font-semibold mt-0.5" title={lastMigration.timestamp}>
                  {formatTimestamp(lastMigration.timestamp, nowTick)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent migrations history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Migrations</CardTitle>
            {history.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearHistory}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear history
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">No migrations yet</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Choose a source system above to start your first data migration.
              </p>
              <Button size="sm" onClick={() => handleStartMigration('excel')}>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Start with Excel
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800" role="list" aria-label="Recent migrations">
              {history.slice(0, 10).map((m, i) => (
                <div
                  key={m.id || `${m.timestamp}-${i}`}
                  className="py-3 flex items-center justify-between"
                  role="listitem"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {m.applied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{m.source}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {(m.data?.length ?? 0).toLocaleString()} records ·{' '}
                        {formatTimestamp(m.timestamp, nowTick)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] tabular-nums">
                    {m.id?.slice(0, 8) || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
