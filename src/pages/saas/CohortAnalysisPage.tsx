// =============================================================================
// COHORT ANALYSIS — customer-cohort workspace (K17/K18 W-FAB remediation).
// -----------------------------------------------------------------------------
// The previous revision fabricated its entire dataset in module scope:
//   - buildRetentionMatrix(): six "Jan 2026 … Jun 2026" cohorts with
//     arithmetic retention curves (100 − i·3, floored at 40) rendered as a
//     measured "Retention Matrix (%)" heatmap and exported to PDF;
//   - buildCohortSizes(): customer counts from `120 + ((i·37) % 80) − i·10`
//     charted as real cohort sizes;
//   - KPI cards (Total Customers / Avg Retention / Avg Churn) computed from
//     those inventions, plus an "Avg Revenue / Cohort" that divided a
//     Math.abs() money aggregate by cohort count and fell back to a hardcoded
//     250000 when the GL was empty.
// Customer cohorts are not ledger objects: retention by acquisition month
// requires a subscription/customer feed this app does not have. The page now
// renders zero numbers, states what such a feed must provide, and routes to
// the ARR dashboard where MRR/ARR are genuinely derived from the GL.
// =============================================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CohortAnalysisPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Cohort Analysis';
  }, []);

  if (entries.length === 0) {
    return (
      <div
        className="p-6 space-y-6 max-w-7xl"
        data-testid="cohort-page"
        aria-labelledby="cohort-heading"
      >
        <PageHeader
          title="Cohort Analysis"
          titleId="cohort-heading"
          purpose="Customer retention by monthly cohort."
        />
        <EmptyState
          variant="no-data"
          title="No SaaS Data"
          description="Import general ledger data first. Note that customer cohorts additionally require a subscription feed that groups revenue by acquisition month — no cohorts are invented here."
          action={<Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>}
        />
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 max-w-7xl"
      data-testid="cohort-page"
      aria-labelledby="cohort-heading"
    >
      <PageHeader
        title="Cohort Analysis"
        titleId="cohort-heading"
        purpose="Customer retention by monthly cohort. Displays no cohort figures unless a customer-level feed provides them — none are estimated from the ledger."
      />

      <Card>
        <CardHeader>
          <CardTitle>What a cohort view requires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
          <p>
            A retention matrix ties every revenue posting to the customer and to that
            customer&apos;s acquisition month. A general ledger carries neither: it has no customer
            dimension and no first-purchase attribution. Building one here would require:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>a customer identifier on each subscription transaction; and</li>
            <li>
              the acquisition (first-bill) date per customer, so rows can be grouped into monthly
              cohorts.
            </li>
          </ul>
          <p>
            This page previously displayed an arithmetic demo matrix with invented month labels
            (Jan–Jun 2026), synthesized cohort sizes, and KPIs derived from them. Those datasets
            have been removed; nothing is rendered in their place.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available now from your ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Aggregate subscription revenue (41xx accounts) is derived from the posted GL on the ARR
            Dashboard, including the latest posted month and its month-over-month movement.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/saas/arr')} data-testid="open-arr-dashboard">
              Open ARR Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/saas/churn-analysis')}>
              Revenue-churn signal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
