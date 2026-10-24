import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { ShieldAlert, Download, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useGLStore } from '@/store/glStore';
import { formatNumber } from '@/utils/financialFormatting';
import { deriveCreditRisk, type CreditEntityRow } from './creditRiskData';

export default function CreditRiskPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const derivation = useMemo(() => deriveCreditRisk(entries), [entries]);

  const columns = useMemo<Column<CreditEntityRow>[]>(
    () => [
      { key: 'name', header: 'Entity', sortable: true },
      {
        key: 'assets',
        header: 'Assets',
        align: 'right',
        render: (_v, r) => fmt.currency0(r.assets),
        sortable: true,
      },
      {
        key: 'liabilities',
        header: 'Liabilities',
        align: 'right',
        render: (_v, r) => fmt.currency0(r.liabilities),
      },
      {
        key: 'equity',
        header: 'Equity',
        align: 'right',
        render: (_v, r) => fmt.currency0(r.equity),
      },
      {
        key: 'netIncome',
        header: 'Net income',
        align: 'right',
        render: (_v, r) => fmt.currency0(r.netIncome),
      },
      {
        key: 'debtToEquity',
        header: 'D/E',
        align: 'right',
        render: (_v, r) => (r.debtToEquity === null ? '—' : formatNumber(r.debtToEquity, 2)),
      },
      {
        key: 'currentRatio',
        header: 'Current ratio',
        align: 'right',
        render: (_v, r) => (r.currentRatio === null ? '—' : formatNumber(r.currentRatio, 2)),
      },
      {
        key: 'interestCoverage',
        header: 'Interest coverage',
        align: 'right',
        render: (_v, r) =>
          r.interestCoverage === null ? '—' : formatNumber(r.interestCoverage, 2),
      },
    ],
    [fmt]
  );

  if (entries.length === 0) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Credit Risk - No Data"
      >
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <ShieldAlert className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold mb-2">No Credit Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries to view posted assets, liabilities and honest coverage
          ratios. A default rating or loss provision is not invented.
        </p>
        <Button
          aria-label="Import GL data to view credit risk"
          onClick={() => navigate('/data/gl-upload')}
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
      role="main"
      aria-label="Credit Risk Assessment"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Credit Risk Assessment"
          purpose="Posted counterparty financials from the General Ledger. Probability of default, LGD, EAD and expected loss require a credit-facility book the GL does not carry — they are omitted, not estimated."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" aria-label="Export credit risk report">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export Report
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Credit Risk KPIs">
        <KPIValue label="Posted Assets" value={fmt.currency0(derivation.totalAssets)} />
        <KPIValue label="Posted Liabilities" value={fmt.currency0(derivation.totalLiabilities)} />
        <KPIValue label="Posted Revenue" value={fmt.currency0(derivation.totalRevenue)} />
        <KPIValue label="Entities" value={String(derivation.entities.length)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Not derivable from the posted GL</CardTitle>
          <CardDescription>Omitted rather than estimated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
          {derivation.unavailable.map((item) => (
            <p key={item.label}>
              <span className="font-medium text-[var(--text-secondary)]">{item.label}</span> —{' '}
              {item.reason}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card aria-label="Counterparty financial detail table">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <div>
              <CardTitle>Posted counterparty financials</CardTitle>
              <CardDescription>
                Assets, liabilities and ratios the ledger supports. No invented rating or EL.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={[...derivation.entities]}
            caption="Posted counterparty financials from the General Ledger"
            ariaLabel="Credit risk exposures table"
            emptyMessage="No entity-tagged activity in the posted GL."
          />
        </CardContent>
      </Card>
    </main>
  );
}
