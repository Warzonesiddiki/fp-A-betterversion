/**
 * Atlas visual-regression harness (BMAD F-02 — docs/design/VISUAL_REGRESSION_RUNBOOK.md).
 *
 * Deterministic, dev-facing baseline surface for the shared Atlas components:
 *  1. FinancialStatusBadge — all ten lifecycle states (dark + light themes)
 *  2. PageHeader — full anatomy and minimal variant (wide + compact viewports)
 *  3. FinancialWorkspaceEmptyState — canonical finance setup state
 *
 * Screenshotted by tests/e2e/atlas-visual.spec.ts. All fixture data is FIXED
 * (no dates, no randomness, no live APIs) so the baselines are reproducible.
 * This page is intentionally NOT linked from the app navigation — it exists to
 * give the visual-regression runbook a browser-renderable component surface.
 */
import { Button } from '@/components/ui/Button';
import {
  FinancialStatusBadge,
  financialStatusValues,
  type FinancialStatus,
} from '@/components/ui/FinancialStatusBadge';
import { FinancialWorkspaceEmptyState } from '@/components/ui/FinancialWorkspaceEmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { LayoutDashboard, Target, Upload } from 'lucide-react';

const STATUS_DETAILS: Partial<Record<FinancialStatus, string>> = {
  draft: 'Local workspace data',
  pendingApproval: 'Awaiting CFO approval',
  locked: 'Period 2026-01',
  certified: 'Auditor verified 2026-08-01',
  offlineQueued: '3 queued changes',
  aiGenerated: 'Review sources before use',
};

const EMPTY_STATE_STEPS = [
  {
    title: 'Import actuals',
    description: 'Load a CSV or Excel general-ledger source into your workspace.',
  },
  {
    title: 'Confirm reporting accounts',
    description: 'Set up the chart of accounts used to organize your financial view.',
  },
  {
    title: 'Create your first plan',
    description: 'Build a budget or forecast once your finance structure is ready.',
  },
];

export function AtlasVisualBaselinePage() {
  return (
    <div className="fp-page space-y-10 p-6">
      <PageHeader
        title="Atlas Visual Baseline"
        purpose="Deterministic component surface for the F-02 visual-regression runbook."
        status={<FinancialStatusBadge status="certified" detail="Baseline fixtures fixed" />}
      />

      <section data-testid="badge-baseline" aria-labelledby="badge-baseline-title">
        <h2
          id="badge-baseline-title"
          className="mb-3 text-sm font-semibold uppercase tracking-wide"
        >
          FinancialStatusBadge — all ten lifecycle states
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {financialStatusValues.map((status) => (
            <li
              key={status}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3"
            >
              <FinancialStatusBadge status={status} detail={STATUS_DETAILS[status]} />
            </li>
          ))}
        </ul>
      </section>

      <section data-testid="pageheader-baseline" aria-labelledby="pageheader-baseline-title">
        <h2
          id="pageheader-baseline-title"
          className="mb-3 text-sm font-semibold uppercase tracking-wide"
        >
          PageHeader — full anatomy
        </h2>
        <PageHeader
          className="rounded-lg border border-slate-800 bg-slate-900 p-4"
          title="Executive Dashboard"
          purpose="3 entries · 1 accounts · 0 budgets"
          status={<FinancialStatusBadge status="draft" detail="Local workspace data" />}
          actions={
            <Button variant="secondary" size="sm" aria-label="Import financial data">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import
            </Button>
          }
        />

        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide">
          PageHeader — minimal variant
        </h2>
        <PageHeader
          className="rounded-lg border border-slate-800 bg-slate-900 p-4"
          title="Chart of Accounts"
        />
      </section>

      <section data-testid="emptystate-baseline" aria-labelledby="emptystate-baseline-title">
        <h2
          id="emptystate-baseline-title"
          className="mb-3 text-sm font-semibold uppercase tracking-wide"
        >
          FinancialWorkspaceEmptyState — canonical setup state
        </h2>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <FinancialWorkspaceEmptyState
            icon={<LayoutDashboard className="h-10 w-10" />}
            title="Set up your finance workspace"
            description="Load and validate your financial inputs before you begin planning, forecasting, and reporting."
            steps={EMPTY_STATE_STEPS}
            actions={
              <>
                <Button aria-label="Import actuals">
                  <Upload className="h-4 w-4 mr-2" />
                  Import actuals
                </Button>
                <Button variant="secondary" aria-label="Set up accounts">
                  <Target className="h-4 w-4 mr-2" />
                  Set up accounts
                </Button>
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}

export default AtlasVisualBaselinePage;
