import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wheat } from 'lucide-react';
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
 * Agriculture dashboard — vertical truthfulness sweep (wave 2).
 *
 * The previous version rendered config tiles as the configured target times
 * a magic factor with an invented change prop, plus hand-typed agronomy and
 * operations literals (yield per hectare, revenue per acre, water usage,
 * equipment utilisation, labour cost, cost per unit, gross margin, active
 * farm count — all fictional).
 *
 * Agronomy yields, irrigation volumes and machine telematics are operational
 * records this app does not hold; a farm count needs an operations registry.
 * The only defensible additions to revenue/costs/margin are name-matched
 * payroll debits as a share of posted costs — shown for exactly what the
 * name match covers, and as `—` when no such postings exist (an absence is
 * not a zero).
 */

const LABOR_NAME_PATTERN = /labor|labour|wage|payroll|salari/;

export default function AgricultureDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Agriculture Dashboard';
  }, []);

  const stats = useMemo(() => {
    // revenue: credit-side amount when credit > debit (a credit-normal
    // account, typically revenue / income / liability).
    const revenue = roundTo(
      sumMoney(entries.filter((e) => compareMoney(e.credit, e.debit) > 0).map((e) => e.credit)),
      2
    );
    // costs: debit-side amount when debit > credit (a debit-normal
    // account, typically expense / asset).
    const costs = roundTo(
      sumMoney(entries.filter((e) => compareMoney(e.debit, e.credit) > 0).map((e) => e.debit)),
      2
    );
    // margin: dimensionless ratio. numerator is the currency difference
    // (revenue − costs); denominator is revenue. result is a percentage.
    const margin =
      revenue > 0
        ? roundTo(
            multiplyMoney(divideMoney(subtractMoney(revenue, costs), toDecimal(revenue)), 100),
            2
          )
        : 0;
    // Labour share: debits on accounts whose NAME mentions labor/wages/
    // payroll, divided by total posted costs. Name-matched subset — null
    // when nothing matches, because "no matching accounts" is not "0%".
    const laborTotal = roundTo(
      sumMoney(
        entries
          .filter((e) => LABOR_NAME_PATTERN.test(e.accountName.toLowerCase()))
          .map((e) => e.debit)
      ),
      2
    );
    const laborSharePct =
      laborTotal > 0 && costs > 0
        ? roundTo(multiplyMoney(divideMoney(toDecimal(laborTotal), toDecimal(costs)), 100), 1)
        : null;
    return { revenue, costs, margin, laborSharePct };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Agriculture Dashboard - No Data">
        <Wheat className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Agriculture — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view posted agriculture figures.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Agriculture Dashboard"
        purpose="Posted revenue, costs and margin from the general ledger. Agronomy and equipment metrics require operational feeds the ledger does not carry."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Costs" value={formatCurrency(stats.costs)} />
        <KPIValue label="Margin" value={`${formatPercent(stats.margin, 1)}`} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ledger-Derived Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  Labor Share of Posted Costs
                </span>
                <span className="font-mono tabular-nums">
                  {stats.laborSharePct === null ? '—' : formatPercent(stats.laborSharePct, 1)}
                </span>
              </div>
            </div>
            <p role="status" className="text-xs text-[var(--text-muted)] mt-4">
              Numerator: debits on accounts whose name mentions labor, wages or payroll.
              Denominator: all posted costs. `—` means no account matched, not a zero share.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not derivable from this ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-muted)]">
              Yield per hectare and revenue per acre come from agronomy and harvest records; water
              usage from irrigation telemetry; equipment utilisation from machine telematics; cost
              per unit and active-farm counts from a production registry. A general ledger records
              posted amounts only, so these are omitted rather than estimated.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
