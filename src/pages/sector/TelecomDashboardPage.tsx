import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wifi } from 'lucide-react';
import {
  compareMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Telecom dashboard — vertical truthfulness sweep (wave 2).
 *
 * The previous version rendered config tiles as the configured target times
 * a magic factor with an invented change prop, plus hand-typed subscriber
 * and network literals (ARPU, churn, subscriber growth, SAC, network
 * utilisation, average data usage, EBITDA per user — all fictional).
 *
 * Subscriber counts, churn cohorts and network telemetry are operational
 * data no store in this app carries; a general ledger cannot produce them.
 * What it CAN produce — revenue, capital-named capex, operating expense,
 * credits on accounts named "subscriber", and the ratios between them — is
 * kept and shown for what it is.
 */

export function TelecomDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Telecom Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => compareMoney(e.credit, e.debit) > 0).map((e) => e.credit)),
      2
    );
    const capex = roundTo(
      sumMoney(
        entries
          .filter(
            (e) =>
              e.accountName.toLowerCase().includes('capital') ||
              e.accountName.toLowerCase().includes('capex') ||
              e.accountName.toLowerCase().includes('network')
          )
          .map((e) => e.debit)
      ),
      2
    );
    const opex = roundTo(
      sumMoney(
        entries
          .filter(
            (e) =>
              compareMoney(e.debit, e.credit) > 0 &&
              !e.accountName.toLowerCase().includes('capital')
          )
          .map((e) => e.debit)
      ),
      2
    );
    const subscribers = roundTo(
      sumMoney(
        entries
          .filter((e) => e.accountName.toLowerCase().includes('subscriber'))
          .map((e) => e.credit)
      ),
      2
    );
    return { revenue, capex, opex, subscribers };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Telecom Dashboard - No Data">
        <Wifi className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Telecom — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view posted telecom figures.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  const capexRatioPct =
    stats.revenue > 0
      ? roundTo(
          multiplyMoney(divideMoney(toDecimal(stats.capex), toDecimal(stats.revenue)), 100),
          1
        )
      : null;
  const opexRatioPct =
    stats.revenue > 0
      ? roundTo(multiplyMoney(divideMoney(toDecimal(stats.opex), toDecimal(stats.revenue)), 100), 1)
      : null;
  const operatingSurplus = roundTo(subtractMoney(stats.revenue, stats.opex), 2);

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Telecom Dashboard"
        purpose="Posted revenue, capex, opex and subscriber-ledger totals from the general ledger. ARPU, churn and network telemetry require feeds the ledger does not carry."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Total Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Network CapEx" value={formatCurrency(stats.capex)} />
        <KPIValue label="Operating Expenses" value={formatCurrency(stats.opex)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ledger-Derived Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">CAPEX / Revenue</span>
                <span className="font-mono tabular-nums">
                  {capexRatioPct === null ? '—' : formatPercent(capexRatioPct, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Opex / Revenue</span>
                <span className="font-mono tabular-nums">
                  {opexRatioPct === null ? '—' : formatPercent(opexRatioPct, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  Operating Surplus (revenue − opex)
                </span>
                <span className="font-mono tabular-nums">{formatCurrency(operatingSurplus)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  Subscriber Accounts (credit total)
                </span>
                <span className="font-mono tabular-nums">{formatCurrency(stats.subscribers)}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">
              Capex groups debits on accounts whose name mentions capital, capex or network; the
              subscriber row sums credits on accounts whose name mentions “subscriber” — posted
              amounts, not customer counts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not derivable from this ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-muted)]">
              ARPU, churn rate, subscriber growth and subscriber-acquisition cost need subscriber
              counts and billing events per period. Network utilisation and average data usage need
              network telemetry. EBITDA per user needs both. None of these live in a general ledger,
              so they are omitted rather than estimated.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default TelecomDashboardPage;
