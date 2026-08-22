// =============================================================================
// CHURN DASHBOARD — customer-churn workspace (K17/K18 W-FAB remediation).
// -----------------------------------------------------------------------------
// The previous revision invented three datasets in module scope and rendered
// them as measured business records:
//   - MONTHLY_CHURN: six months of logo/revenue churn and save-rate
//     percentages (3.2% / 2.8% / 42 …) plotted as a "Churn Trend";
//   - SEGMENT_CHURN: "Enterprise / Mid-Market / SMB / Startup" with churn %,
//     customer counts and MRR ($125,000 …) plotted as "Churn by Segment";
//   - AT_RISK: five customers with invented names ("Acme Corp", "TechStart
//     Inc", …), MRR amounts, risk scores [85, 72, 68, 91, 78] and "X days
//     ago" login strings, rendered as a data table AND exported to Excel as
//     if they were real accounts.
// All five KPI cards were computed from those arrays. None of it is derivable
// from this app's stores: a general ledger carries journal postings, not
// per-customer subscription events, support saves or engagement telemetry.
//
// This page now renders zero numbers. It states exactly which feed each churn
// metric requires and routes to the one churn-adjacent signal the GL does
// support (period-over-period movement of 41xx subscription revenue on
// ChurnAnalysisPage). Empty GL → shared EmptyState under the page h1, same
// four-states idiom as ICEliminationPage.
// =============================================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ChurnDashboard() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Churn Dashboard';
  }, []);

  if (entries.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="churn-dashboard-heading">
        <PageHeader
          title="Churn Dashboard"
          titleId="churn-dashboard-heading"
          purpose="Customer retention and churn analysis workspace."
        />
        <EmptyState
          variant="no-data"
          title="No SaaS Data"
          description="Import general ledger data first. Note that logo-level churn metrics additionally require a subscription-management feed — no churn figures are invented here."
          action={<Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="churn-dashboard-heading">
      <PageHeader
        title="Churn Dashboard"
        titleId="churn-dashboard-heading"
        purpose="Customer retention and churn analysis workspace. Displays no churn figures unless a customer-level feed provides them — none are estimated from the ledger."
      />

      <Card>
        <CardHeader>
          <CardTitle>What each churn metric requires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
          <p>
            A general ledger records journal postings; it does not know when a customer cancels,
            downgrades, is saved by support, or stops signing in. The following therefore cannot be
            computed here and are omitted rather than estimated:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-[var(--text-secondary)]">Logo churn</span> — needs
              subscription start/end events per customer.
            </li>
            <li>
              <span className="font-medium text-[var(--text-secondary)]">Revenue churn</span> —
              needs contracted recurring amount per customer over time.
            </li>
            <li>
              <span className="font-medium text-[var(--text-secondary)]">Save rate</span> — needs
              cancellation-and-recovery outcomes from the support/billing system.
            </li>
            <li>
              <span className="font-medium text-[var(--text-secondary)]">Segment churn mix</span> —
              needs plan/tier assignment per customer.
            </li>
            <li>
              <span className="font-medium text-[var(--text-secondary)]">
                At-risk customers & risk scores
              </span>{' '}
              — needs engagement telemetry (logins, usage) plus a scoring model.
            </li>
          </ul>
          <p>
            This page previously filled all of the above with hardcoded demo values, including
            invented customer names exported to Excel. Those datasets have been removed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The churn-adjacent signal the GL does support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Period-over-period movement of 41xx subscription revenue is derived from the posted
            ledger on the Churn Analysis page — a revenue-churn <em>signal</em>, clearly not a
            logo-churn measure.
          </p>
          <Button
            onClick={() => navigate('/saas/churn-analysis')}
            data-testid="open-churn-analysis"
          >
            Open revenue-churn signal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
