import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldAlert } from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { runExceptionRules } from '@/services/exceptions/runExceptionRules';
import { runAggregateRules } from '@/services/exceptions/runAggregateRules';
import { EXCEPTION_RULES, type ExceptionFinding } from '@/store/exceptionRuleCatalogue';
import { ExceptionReviewList } from '@/components/exceptions/ExceptionReviewList';
import type { ExceptionReviewCandidate } from '@/components/exceptions/ExceptionReviewCard';

/**
 * Phase 3 exception queue (J2): every catalogue-v2 rule runs over the whole
 * ledger (DEC-017) and the findings land here as review candidates. A flag
 * is never an error (AGENTS.md rule 7) — the reviewer dispositions each
 * one, and dispositions persist against the finding's stable key.
 */
export default function ExceptionQueuePage() {
  const navigate = useNavigate();
  const entries = useGLStore((s) => s.entries);
  const isLoading = useGLStore((s) => s.isLoading);

  useEffect(() => {
    document.title = 'FinPlan Pro — Exception Queue';
  }, []);

  const result = useMemo(() => (entries.length > 0 ? runExceptionRules(entries) : null), [entries]);
  const aggregateFindings = useMemo(
    () => (entries.length > 0 ? runAggregateRules(entries) : []),
    [entries]
  );

  const candidates: ExceptionReviewCandidate[] = useMemo(() => {
    if (!result) return [];
    return [...result.findings, ...aggregateFindings]
      .sort((a, b) => a.findingKey.localeCompare(b.findingKey))
      .map((finding) => toCandidate(finding));
  }, [result, aggregateFindings]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton
          variant="rectangular"
          height="32px"
          className="w-60"
          srLabel="Loading exception queue…"
        />
        <Skeleton variant="rectangular" height="400px" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <ShieldAlert className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold mb-2">No GL Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries first. Every entry is then checked by the exception rules
          and anything worth a second look appears here as a review candidate — never as a confirmed
          error.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Exception Queue"
        purpose="Rule findings over the imported ledger. Each one is a review candidate with its evidence — only your disposition decides whether it is a real problem."
      />

      <Card>
        <CardContent className="px-6 py-3 text-sm text-[var(--text-secondary)] space-y-1">
          <p role="status">
            {result!.examinedEntries.toLocaleString()} entries examined ·{' '}
            {candidates.length.toLocaleString()} review candidates ·{' '}
            {result!.skippedJournalEntries.toLocaleString()} entries without a journal id or
            reference (journal rules could not group them — counted, never hidden)
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Rules R-006…R-017 ran with recorded options: round amounts ≥{' '}
            {result!.options.roundAmountMin.toLocaleString()} (multiple of{' '}
            {result!.options.roundAmountMultiple.toLocaleString()}), dormancy{' '}
            {result!.options.dormancyDays} days, outlier accounts with ≥{' '}
            {result!.options.outlierMinEntries} entries at {result!.options.outlierMadFactor}× MAD.
            Aggregate rules R-001…R-004 also ran over monthly baselines (prior-month averages,
            month-over-month, prior-year, per-account z-scores). R-005 (margin trend break) is still
            PROPOSED in the catalogue and is not run.
          </p>
        </CardContent>
      </Card>

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-lg font-semibold mb-2">No review candidates</h2>
            <p className="text-[var(--text-muted)]">
              Every rule ran over every entry and nothing matched. That is a statement about the
              rules, not a guarantee the ledger is correct.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ExceptionReviewList candidates={candidates} />
      )}
    </div>
  );
}

const SEVERITY_BY_TIER: Record<number, ExceptionReviewCandidate['severity']> = {
  1: 'high',
  2: 'medium',
  3: 'low',
};

function toCandidate(finding: ExceptionFinding): ExceptionReviewCandidate {
  const ruleDef = EXCEPTION_RULES.find(
    (r) => r.ruleId === finding.ruleId && r.version === finding.ruleVersion
  );
  const sourceRefs = (finding.metadata?.sourceRefs as string[] | undefined) ?? [];
  return {
    id: finding.findingKey,
    ruleId: `${finding.ruleId}@v${finding.ruleVersion}`,
    ruleName: ruleDef?.name,
    version: String(finding.ruleVersion),
    severity: SEVERITY_BY_TIER[ruleDef?.tier ?? 2] ?? 'medium',
    evidence: {
      description: finding.message,
      formula: ruleDef?.evidence.formula,
      actualValue: finding.observedValue,
      expectedValue: finding.expectedValue,
      deviation: finding.deviation,
      sourceRowId: sourceRefs[0],
      context: {
        target: finding.targetId,
        period: finding.periodKey,
        evidenceRows: finding.evidenceRows ?? [],
        sourceRefs,
      },
    },
    recommendedAction: ruleDef?.recommendedAction,
  };
}
