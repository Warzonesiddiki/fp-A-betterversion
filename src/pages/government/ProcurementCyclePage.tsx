/**
 * Government — Procurement Cycle (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money governmentMetrics procurement helpers for
 * competitive-tender %, compliance score, average cycle days and
 * negotiated savings.
 */
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { FileCheck2, ShieldCheck, CalendarClock, TrendingDown } from 'lucide-react';
import type { GLEntry } from '@/types';
import { formatMoney, roundTo, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';
import { computeProcurementMetrics } from './governmentMetrics';

export interface ProcurementInput {
  contractValue: number | null;
  competitivelyTenderedValue: number | null;
  compliantAudits: number | null;
  totalAudits: number | null;
  cycleDaysSum: number | null;
  contractCount: number | null;
  baselineSpend: number | null;
  realizedSpend: number | null;
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

/** Derive procurement inputs from GL entries (exact sums). */
export function computeProcurementFromEntries(entries: readonly GLEntry[]): ProcurementInput {
  return {
    // `null` = no tagged account posts this quantity. The previous constants
    // (5M contracts / 48-of-50 audits / 1350 days ÷ 30 contracts / 6M→5.7M
    // savings) fabricated an entire procurement record from an empty ledger.
    contractValue: sumDebitIfPosted(entries, /contract|award|procurement/),
    competitivelyTenderedValue: sumDebitIfPosted(entries, /tender|competitive|bidded/),
    compliantAudits: sumDebitIfPosted(entries, /compliant|audit.*pass/),
    totalAudits: sumDebitIfPosted(entries, /audit|review/),
    cycleDaysSum: sumDebitIfPosted(entries, /cycle|lead time/),
    contractCount: sumDebitIfPosted(entries, /contract count|contracts/),
    baselineSpend: sumDebitIfPosted(entries, /baseline spend|pre.negotiation/),
    realizedSpend: sumDebitIfPosted(entries, /realized spend|post.negotiation|actual spend/),
  };
}

export default function ProcurementCyclePage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Procurement Cycle';
  }, []);

  const input = useMemo(() => computeProcurementFromEntries(entries), [entries]);
  const metrics = useMemo(() => computeProcurementMetrics(input), [input]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Procurement - No Data">
        <FileCheck2
          className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold mb-2">No Procurement Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view procurement cycle metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Procurement Cycle">
      <header className="flex items-center justify-between">
        <PageHeader
          title="Procurement Cycle"
          purpose={'Procurement efficiency & compliance analytics'}
        />
        <Button variant="outline" onClick={() => navigate('/government')}>
          Back to Government
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Procurement KPIs">
        <KPIValue
          label="Competitive Tender"
          value={
            metrics.competitiveTenderPct === null
              ? '—'
              : formatPercent(metrics.competitiveTenderPct, 1)
          }
          changeLabel={
            metrics.competitiveTenderPct === null ? 'no contract/tender accounts posted' : undefined
          }
          icon={<FileCheck2 className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Compliance Score"
          value={
            metrics.complianceScorePct === null ? '—' : formatPercent(metrics.complianceScorePct, 1)
          }
          changeLabel={metrics.complianceScorePct === null ? 'no audit accounts posted' : undefined}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Avg Cycle (Days)"
          value={metrics.avgCycleDays === null ? '—' : formatNumber(metrics.avgCycleDays)}
          changeLabel={
            metrics.avgCycleDays === null
              ? 'no cycle-time/contract-count accounts posted'
              : 'cycle days ÷ contracts tracked'
          }
          icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Negotiated Savings"
          value={metrics.negotiatedSavings === null ? '—' : formatMoney(metrics.negotiatedSavings)}
          changeLabel={
            metrics.negotiatedSavings === null
              ? 'no baseline/realized spend posted'
              : 'baseline − realized spend'
          }
          icon={<TrendingDown className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Procurement Detail">
        <CardHeader>
          <CardTitle>Procurement Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Contract Value</span>
            <span className="font-mono">
              {input.contractValue === null ? '— not posted' : formatMoney(input.contractValue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Savings Rate</span>
            <span className="font-mono">
              {metrics.savingsRatePct === null
                ? '— needs baseline + realized spend'
                : formatPercent(metrics.savingsRatePct, 1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Contracts Tracked</span>
            <span className="font-mono">
              {input.contractCount === null ? '— not posted' : formatNumber(input.contractCount)}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] pt-2">
            Figures come only from tagged GL accounts (awards, tenders, audits, cycle times).
            Quantities the ledger does not post are shown blank — they are never filled with assumed
            procurement records.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
