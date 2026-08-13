import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { usePeriodCloseStore } from '@/store/periodCloseStore';
import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PeriodCloseStateMachine } from '@/engines/PeriodCloseStateMachine';
import { SOXComplianceEngine } from '@/engines/SOXComplianceEngine';
import type { SOXReport, SOXCheckResult, SOXControlCategory } from '@/engines/SOXComplianceEngine';
import { AuditLogEngine } from '@/engines/AuditLogEngine';
import { WorkflowEngine } from '@/engines/WorkflowEngine';
import { RBACEngine } from '@/engines/RBACEngine';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Shield,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Users,
  FileText,
  BarChart3,
  CalendarCheck,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
  info: '#3B82F6',
};

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  pass: CheckCircle,
  fail: XCircle,
  warning: AlertTriangle,
  not_applicable: Info,
};

const STATUS_COLORS: Record<string, string> = {
  pass: '#22C55E',
  fail: '#EF4444',
  warning: '#EAB308',
  not_applicable: '#6B7280',
};

const CATEGORY_LABELS: Record<SOXControlCategory, string> = {
  approval_workflow: 'Approval Workflows',
  segregation_of_duties: 'Segregation of Duties',
  audit_trail: 'Audit Trail',
  data_integrity: 'Data Integrity',
  access_control: 'Access Control',
  financial_reporting: 'Financial Reporting',
};

const CATEGORY_ICONS: Record<SOXControlCategory, typeof Shield> = {
  approval_workflow: FileText,
  segregation_of_duties: Users,
  audit_trail: Lock,
  data_integrity: Shield,
  access_control: Lock,
  financial_reporting: BarChart3,
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 90 ? '#22C55E' : score >= 70 ? '#EAB308' : score >= 50 ? '#F97316' : '#EF4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1E293B" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 283} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-sm text-[var(--text-muted)] mt-2">Compliance Score</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICON[status] ?? Info;
  const color = STATUS_COLORS[status] ?? '#6B7280';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? '#6B7280';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {severity}
    </span>
  );
}

function CategorySummaryCard({
  category,
  data,
}: {
  category: SOXControlCategory;
  data: { passed: number; failed: number; total: number };
}) {
  const Icon = CATEGORY_ICONS[category];
  const pct = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 100;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-800 rounded">
            <Icon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium">{CATEGORY_LABELS[category]}</p>
            <p className="text-xs text-slate-500">
              {data.passed}/{data.total} passed
            </p>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? '#22C55E' : pct >= 50 ? '#EAB308' : '#EF4444',
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CheckRow({ check }: { check: SOXCheckResult }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATUS_ICON[check.status] ?? Info;
  const color = STATUS_COLORS[check.status] ?? '#6B7280';

  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{check.name}</p>
          <p className="text-xs text-slate-500 truncate">{check.controlId}</p>
        </div>
        <SeverityBadge severity={check.severity} />
        <StatusBadge status={check.status} />
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <p className="text-xs text-[var(--text-muted)]">{check.description}</p>
          <p className="text-xs text-[var(--text-secondary)]">{check.details}</p>
          {check.evidence.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Evidence:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {check.evidence.map((e, i) => (
                  <li key={i} className="text-xs text-[var(--text-muted)]">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {check.remediation && (
            <div className="mt-2 p-2 bg-amber-900/20 border border-amber-800/30 rounded">
              <p className="text-xs text-amber-400">
                <strong>Remediation:</strong> {check.remediation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SOXCompliancePage() {
  useEffect(() => {
    document.title = 'FinPlan Pro - SOX Compliance';
  }, []);

  const _navigate = useNavigate();

  // F-01 bridge: current fiscal period's close state, linking to the period
  // close workflow (the SOX page is where an auditor expects to find it).
  const periods = useMemo(() => buildFiscalPeriods(), []);
  const closeEntries = usePeriodCloseStore((s) => s.entries);
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentPeriod =
    periods.find(
      (p) => p.startDate.slice(0, 10) <= todayStr && p.endDate.slice(0, 10) >= todayStr
    ) ?? periods[0];
  const currentCloseState = currentPeriod
    ? (closeEntries[currentPeriod.id]?.state ?? 'open')
    : 'open';
  const currentStateLabel = PeriodCloseStateMachine.getStateLabel(currentCloseState);

  const [report, setReport] = useState<SOXReport | null>(null);
  const [filterCategory, setFilterCategory] = useState<SOXControlCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create engines with some sample data for demo
  const [engine] = useState(() => {
    const auditEngine = new AuditLogEngine({ retentionDays: 2555 });
    const workflowEngine = new WorkflowEngine();
    const rbacEngine = new RBACEngine();

    // Set up sample RBAC data
    rbacEngine.assignRole('admin-user', 'admin', ['*'], 'system');
    rbacEngine.assignRole('mgr-user', 'manager', ['entity-1'], 'admin-user');
    rbacEngine.assignRole('analyst-user', 'analyst', ['entity-1'], 'admin-user');
    rbacEngine.assignRole('viewer-user', 'viewer', ['entity-1'], 'admin-user');

    // Log some audit entries
    auditEngine.log({
      userId: 'analyst-user',
      userName: 'Analyst',
      action: 'create',
      resource: 'journal_entry',
      resourceId: 'je-001',
      details: 'Created journal entry',
      oldValue: null,
      newValue: { amount: 5000 },
    });
    auditEngine.log({
      userId: 'mgr-user',
      userName: 'Manager',
      action: 'approve',
      resource: 'journal_entry',
      resourceId: 'je-001',
      details: 'Approved journal entry',
    });
    auditEngine.log({
      userId: 'analyst-user',
      userName: 'Analyst',
      action: 'create',
      resource: 'budget',
      resourceId: 'b-001',
      details: 'Created Q1 budget',
    });

    // Create a workflow
    const wf = workflowEngine.createWorkflow({
      name: 'Budget Approval',
      description: 'Standard budget approval workflow',
      steps: [
        {
          id: 's1',
          name: 'Manager Review',
          type: 'sequential',
          approvers: ['mgr-user'],
          order: 0,
          timeoutHours: 48,
        },
        {
          id: 's2',
          name: 'Admin Approval',
          type: 'sequential',
          approvers: ['admin-user'],
          order: 1,
          timeoutHours: 24,
        },
      ],
      createdBy: 'admin-user',
      isTemplate: false,
    });

    // Submit a request
    workflowEngine.submitRequest(
      wf.id,
      'Q1 Budget Review',
      'Quarterly budget',
      'analyst-user',
      50000
    );

    return new SOXComplianceEngine(auditEngine, workflowEngine, rbacEngine);
  });

  const generateReport = useCallback(() => {
    // Derive real data from GL store
    const trialBalance = useGLStore.getState().trialBalance;
    const entries = useGLStore.getState().entries;

    // Calculate balance sheet from trial balance
    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    for (const row of trialBalance) {
      const ending = row.endingBalance ?? row.beginningBalance + row.debit - row.credit;
      if (row.accountType === 'Asset') assets += ending;
      else if (row.accountType === 'Liability') liabilities += ending;
      else if (row.accountType === 'Equity') equity += ending;
    }

    // Fallback to sensible defaults when no GL data exists
    const bs = {
      assets: assets || 100000,
      liabilities: liabilities || 60000,
      equity: equity || 40000,
    };

    // Derive ledger entries from GL entries
    const ledgerEntries =
      entries.length > 0
        ? entries.slice(0, 20).map((e) => ({ debit: e.debit ?? 0, credit: e.credit ?? 0 }))
        : [
            { debit: 5000, credit: 0 },
            { debit: 0, credit: 5000 },
          ];

    // Derive recent entries from GL entries
    const recentEntries =
      entries.length > 0
        ? entries.slice(0, 10).map((e) => ({
            period: e.period ?? 'Unknown',
            timestamp: e.date ?? new Date().toISOString(),
            action: 'create' as const,
          }))
        : [{ period: 'Q1-2026', timestamp: '2026-01-15T10:00:00Z', action: 'create' as const }];

    const r = engine.generateReport({
      balanceSheet: bs,
      ledgerEntries,
      closedPeriods: ['Q4-2025'],
      recentEntries,
    });
    setReport(r);
  }, [engine]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const filteredChecks = useMemo(() => {
    if (!report) return [];
    let checks = [...report.checks];
    if (filterCategory !== 'all') {
      checks = checks.filter((c) => c.category === filterCategory);
    }
    if (filterStatus !== 'all') {
      checks = checks.filter((c) => c.status === filterStatus);
    }
    return checks;
  }, [report, filterCategory, filterStatus]);

  const handleExport = useCallback(() => {
    if (!report) return;
    const headers = [
      'ID',
      'Control',
      'Category',
      'Name',
      'Status',
      'Severity',
      'Details',
      'Remediation',
    ];
    const rows = report.checks.map((c) => [
      c.id,
      c.controlId,
      c.category,
      c.name,
      c.status,
      c.severity,
      c.details,
      c.remediation ?? '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sox-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  if (!report) {
    return (
      <div
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Loading SOX compliance report"
      >
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Shield className="h-10 w-10 text-slate-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Generating Report...</h2>
        <p className="text-[var(--text-muted)]">Running SOX compliance checks.</p>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main" aria-label="SOX Compliance Dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" aria-hidden="true" />
            SOX Compliance
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Sarbanes-Oxley Act compliance monitoring and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/periods/close"
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
            aria-label={`Close period — ${currentPeriod?.name ?? ''} ${currentPeriod?.year ?? ''} is ${currentStateLabel}`}
          >
            <CalendarCheck className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Close period: {currentStateLabel}
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={generateReport}
            aria-label="Refresh compliance report"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExport}
            aria-label="Export compliance report as CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <section aria-label="Compliance Status Summary">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              <ScoreGauge score={report.overallScore} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <StatusBadge status={report.overallStatus} />
                  <span className="text-sm text-[var(--text-muted)]">
                    Generated {new Date(report.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold text-green-400">{report.summary.passed}</p>
                    <p className="text-xs text-slate-500">Passed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{report.summary.failed}</p>
                    <p className="text-xs text-slate-500">Failed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{report.summary.warnings}</p>
                    <p className="text-xs text-slate-500">Warnings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-muted)]">
                      {report.summary.total}
                    </p>
                    <p className="text-xs text-slate-500">Total Checks</p>
                  </div>
                </div>
                {report.criticalFindings.length > 0 && (
                  <div className="p-3 bg-red-900/20 border border-red-800/30 rounded">
                    <p className="text-sm text-red-400 font-medium">
                      {report.criticalFindings.length} critical finding(s) require immediate
                      attention
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Category Summary */}
      <section aria-label="Category Summary">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(report.byCategory) as SOXControlCategory[]).map((cat) => (
            <CategorySummaryCard key={cat} category={cat} data={report.byCategory[cat]} />
          ))}
        </div>
      </section>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <section aria-label="Recommendations">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                  >
                    <span className="text-amber-400 mt-0.5">*</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Filters */}
      <section aria-label="Compliance Check Filters">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label htmlFor="category" className="block text-xs text-slate-500 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as SOXControlCategory | 'all')}
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-xs text-slate-500 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="warning">Warning</option>
                  <option value="not_applicable">N/A</option>
                </select>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Checks List */}
      <section aria-label="Compliance Checks">
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold">Compliance Checks ({filteredChecks.length})</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredChecks.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No checks match the current filters.
                </div>
              ) : (
                filteredChecks.map((check) => <CheckRow key={check.id} check={check} />)
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
