// @money-ast-allow Reason: Entry-direction filter: e.debit > e.credit selects debit-heavy entries for sumMoney, not a money result
/**
 * Government — Grants & Disbursement (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money governmentMetrics engine for grant disbursement
 * rate, cost per citizen, revenue collection gap and unutilized budget.
 */
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Landmark, Coins, Users, Banknote } from 'lucide-react';
import type { GLEntry } from '@/types';
import { formatMoney, roundTo, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';
import { computeGovernmentMetrics, modelGrantDisbursement } from './governmentMetrics';

export interface GrantDisbursementInput {
  budgetAppropriated: number | null;
  actualSpend: number | null;
  grantAllocated: number | null;
  grantDisbursed: number | null;
  citizensServed: number | null;
  totalExpenses: number;
  revenueCollected: number | null;
  revenueForecast: number | null;
}

/**
 * Sum debit-side amounts of entries matching `pattern`, or `null` when no
 * account name matches — the quantity was never posted, which must not be
 * replaced with an assumed constant.
 */
function sumDebitIfPosted(entries: readonly GLEntry[], pattern: RegExp): number | null {
  const matching = entries.filter((e) => pattern.test(e.accountName.toLowerCase()));
  if (matching.length === 0) return null;
  return roundTo(sumMoney(matching.map((e) => e.debit)), 2);
}

/** Sum credit-side amounts, or `null` when nothing matches. */
function sumCreditIfPosted(entries: readonly GLEntry[], pattern: RegExp): number | null {
  const matching = entries.filter((e) => pattern.test(e.accountName.toLowerCase()));
  if (matching.length === 0) return null;
  return roundTo(sumMoney(matching.map((e) => e.credit)), 2);
}

/** Derive grant-disbursement inputs from GL entries (exact sums). */
export function computeGrantDisbursementFromEntries(
  entries: readonly GLEntry[]
): GrantDisbursementInput {
  const budgetAppropriated = sumDebitIfPosted(entries, /budget|appropriation/);
  const actualSpend = sumDebitIfPosted(entries, /spend|expenditure|outlay/);
  const grantAllocated = sumDebitIfPosted(entries, /grant.*allocat|allocat.*grant/);
  const grantDisbursed = sumDebitIfPosted(entries, /grant.*disburse|disburse.*grant/);
  const citizensServed = sumDebitIfPosted(entries, /citizen.*served|served.*citizen/);
  const totalExpenses = roundTo(
    sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
    2
  );
  const revenueCollected = sumCreditIfPosted(entries, /tax|revenue|collected|receipts/);
  const revenueForecast = sumDebitIfPosted(entries, /forecast|budget.*revenue|planned/);

  return {
    // `null` = no tagged account posts this quantity. The previous constants
    // (10M budget / 9.5M spend / 1.25M citizens…) fabricated a full budget
    // picture whenever the GL lacked these accounts.
    budgetAppropriated,
    actualSpend,
    grantAllocated,
    grantDisbursed,
    citizensServed,
    totalExpenses,
    revenueCollected,
    revenueForecast,
  };
}

export default function GrantDisbursementPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Grants & Disbursement';
  }, []);

  const input = useMemo(() => computeGrantDisbursementFromEntries(entries), [entries]);
  const metrics = useMemo(() => computeGovernmentMetrics(input), [input]);
  const modeledDisbursement = useMemo(
    () =>
      input.grantAllocated !== null && metrics.grantDisbursementRatePct !== null
        ? modelGrantDisbursement(input.grantAllocated, metrics.grantDisbursementRatePct)
        : null,
    [input.grantAllocated, metrics.grantDisbursementRatePct]
  );

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Grants - No Data">
        <Landmark className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Grant Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view grant disbursement metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Grants & Disbursement">
      <header className="flex items-center justify-between">
        <PageHeader
          title={'Grants & Disbursement'}
          purpose={'Grant allocation, disbursement & collection analytics'}
        />
        <Button variant="outline" onClick={() => navigate('/government')}>
          Back to Government
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Grant KPIs">
        <KPIValue
          label="Grant Disbursement Rate"
          value={
            metrics.grantDisbursementRatePct === null
              ? '—'
              : formatPercent(metrics.grantDisbursementRatePct, 1)
          }
          changeLabel={
            metrics.grantDisbursementRatePct === null
              ? 'no grant allocation/disbursement accounts posted'
              : undefined
          }
          icon={<Coins className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Cost Per Citizen"
          value={metrics.costPerCitizen === null ? '—' : formatMoney(metrics.costPerCitizen)}
          changeLabel={
            metrics.costPerCitizen === null
              ? 'no citizen-count account posted'
              : 'posted expenses ÷ posted citizens served'
          }
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Budget Utilization"
          value={
            metrics.budgetUtilizationPct === null
              ? '—'
              : formatPercent(metrics.budgetUtilizationPct, 1)
          }
          changeLabel={
            metrics.budgetUtilizationPct === null
              ? 'no appropriation/spend accounts posted'
              : undefined
          }
          icon={<Banknote className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Revenue Collection Gap"
          value={
            metrics.revenueCollectionGapPct === null
              ? '—'
              : formatPercent(metrics.revenueCollectionGapPct, 1)
          }
          changeLabel={
            metrics.revenueCollectionGapPct === null
              ? 'no revenue forecast posted in the GL'
              : '(forecast − collected) ÷ forecast'
          }
          icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card aria-label="Disbursement Detail">
          <CardHeader>
            <CardTitle>Disbursement Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Grant Allocated</span>
              <span className="font-mono">
                {input.grantAllocated === null ? '— not posted' : formatMoney(input.grantAllocated)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Grant Disbursed</span>
              <span className="font-mono">
                {input.grantDisbursed === null ? '— not posted' : formatMoney(input.grantDisbursed)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Modeled Disbursement</span>
              <span className="font-mono">
                {modeledDisbursement === null
                  ? '— needs allocation + rate'
                  : formatMoney(modeledDisbursement)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card aria-label="Budget Detail">
          <CardHeader>
            <CardTitle>Budget Execution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Unutilized Budget</span>
              <span className="font-mono">
                {metrics.unutilizedBudget === null
                  ? '— appropriation/spend not both posted'
                  : formatMoney(metrics.unutilizedBudget)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Citizens Served</span>
              <span className="font-mono">
                {input.citizensServed === null
                  ? '— not posted'
                  : formatNumber(input.citizensServed)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Revenue Collected</span>
              <span className="font-mono">
                {input.revenueCollected === null
                  ? '— not posted'
                  : formatMoney(input.revenueCollected)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pt-2">
              Figures come only from tagged GL accounts (appropriation, spend, grants, citizens,
              receipts). Quantities the ledger does not post are shown blank — they are never filled
              with assumed budget constants.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
