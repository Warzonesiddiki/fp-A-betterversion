import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, Leaf, Target } from 'lucide-react';

/**
 * Carbon / ESG Emissions Dashboard (session 028, replaces fabricated
 * session-022 version).
 *
 * Pre-session-028 page rendered three scope buckets (Scope 1 / 2 / 3) with
 * hand-typed current/target/prior tCO2e values, six months of monthly
 * emissions, and a list of emission sources with hand-typed tonnage and
 * percentages — none of it was backed by an emissions feed.
 *
 * The general ledger does NOT carry tCO2e data: emissions come from
 * sustainability tracking systems (utility bills, fuel purchases,
 * supplier disclosures, ESG reports). The page therefore empty-states
 * when the GL is empty (the same surface the prior version rendered when
 * no data was imported) and discloses the missing feed.
 */
export default function CarbonDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Carbon Dashboard';
  }, []);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Leaf className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Carbon Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data and connect a sustainability / emissions feed to populate this dashboard.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Carbon Dashboard"
        purpose="Emissions reporting requires a sustainability feed that a general ledger does not carry."
      />

      <Card>
        <CardHeader>
          <CardTitle>Scope 1 / 2 / 3 Emissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[var(--text-muted)] space-y-3">
            <p>
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Per-scope emissions (tCO₂e) and per-source breakdown require a sustainability /
              emissions tracking feed. The general ledger does not carry tCO₂e values. A general
              ledger carries utility bills, fuel purchases, and supplier spend — the data that
              *feeds* an emissions calculation — but converting spend to emissions requires factors
              and unit conversions that a ledger does not.
            </p>
            <p>
              <Target className="h-4 w-4 inline-block mr-1" />
              Reduction targets, year-over-year change, and intensity ratios (tCO₂e / $M revenue)
              are reported by sustainability platforms (Sustainability Cloud, Watershed, Persefoni).
              Connect one to populate this dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
