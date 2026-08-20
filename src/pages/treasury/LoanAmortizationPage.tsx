/**
 * Loan Amortization page — wires the (previously orphan) LoanAmortizationEngine
 * to a real product surface (Omega Council BATCH-006: reachability program).
 *
 * Unlike mock-data demo pages, this renders REAL engine output: principal/rate/
 * term inputs flow through LoanAmortizationEngine.schedule() (exact-decimal) and
 * the final balance lands on $0.00 by construction.
 *
 * Feature-flagged via FEATURE_FLAGS['treasury.loan-amortization'] — an instant
 * kill-switch locally; on a hosted SaaS the same flag gates a % canary rollout.
 */
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoanAmortizationEngine } from '@/engines/LoanAmortizationEngine';
import { FEATURE_FLAGS, isFeatureActive, type FeatureFlagKey } from '@/utils/feature-flags';
import { Button } from '@/components/ui/Button';
import { sumMoney, roundTo, addMoney } from '@/utils/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

const FLAG: FeatureFlagKey = 'treasury.loan-amortization';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const k = 'finplan-session-id';
    let id = window.localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return 'fallback';
  }
}
interface FormState {
  principal: string;
  annualRatePct: string;
  months: string;
}

const DEFAULTS: FormState = { principal: '100000', annualRatePct: '6', months: '360' };

/** Money-primitive totals (GAP-1 F-0006). The page renders the actual
 *  per-row schedule from LoanAmortizationEngine (already exact-decimal),
 *  but the headline KPIs (total interest, total principal) were raw
 *  reduce + before; we route them through sumMoney+roundTo so the
 *  schedule's exact cents are preserved through the aggregation. */
export interface LoanScheduleTotals {
  totalInterest: number;
  totalPrincipal: number;
  totalPayment: number;
}

export function computeLoanScheduleTotals(
  schedule: ReadonlyArray<{ interest: number; principal: number }>
): LoanScheduleTotals {
  const totalInterest = schedule.length ? roundTo(sumMoney(schedule.map((r) => r.interest)), 2) : 0;
  const totalPrincipal = schedule.length
    ? roundTo(sumMoney(schedule.map((r) => r.principal)), 2)
    : 0;
  // totalPayment is the gross cash that flowed through — interest + principal.
  return {
    totalInterest,
    totalPrincipal,
    totalPayment: addMoney(totalInterest, totalPrincipal).toNumber(),
  };
}

export default function LoanAmortizationPage() {
  const fmt = useCurrencyFormatter();
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [schedule, setSchedule] = useState<ReturnType<
    typeof LoanAmortizationEngine.schedule
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = isFeatureActive(FLAG, getSessionId());

  if (!active) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Amortization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-muted)]">
              This tool is behind a feature flag ({FLAG}, rollout{' '}
              {FEATURE_FLAGS[FLAG].rolloutPercentage}%) and is not enabled for your session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculate = () => {
    const principal = Number(form.principal);
    const annualRatePct = Number(form.annualRatePct);
    const months = Number(form.months);
    if (!Number.isFinite(principal) || principal < 0) {
      setError('Principal must be a non-negative number.');
      setSchedule(null);
      return;
    }
    if (!Number.isFinite(annualRatePct) || annualRatePct < 0) {
      setError('Annual rate must be a non-negative number.');
      setSchedule(null);
      return;
    }
    if (!Number.isInteger(months) || months < 1) {
      setError('Term must be a whole number of months (≥ 1).');
      setSchedule(null);
      return;
    }
    setError(null);
    setSchedule(LoanAmortizationEngine.schedule(principal, annualRatePct / 100, months));
  };

  const { totalInterest, totalPrincipal } = schedule
    ? computeLoanScheduleTotals(schedule.schedule)
    : { totalInterest: 0, totalPrincipal: 0 };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Loan Amortization"
        purpose="Exact-decimal amortization schedule — the loan pays off to $0.00."
      />

      <Card>
        <CardHeader>
          <CardTitle>Loan terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span>Principal ($)</span>
              <input
                id="la-principal"
                aria-label="Principal in dollars"
                type="number"
                min={0}
                value={form.principal}
                onChange={(e) => setForm({ ...form, principal: e.target.value })}
                className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm w-40"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Annual rate (%)</span>
              <input
                id="la-rate"
                aria-label="Annual interest rate in percent"
                type="number"
                min={0}
                step={0.01}
                value={form.annualRatePct}
                onChange={(e) => setForm({ ...form, annualRatePct: e.target.value })}
                className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm w-32"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Term (months)</span>
              <input
                id="la-months"
                aria-label="Term in months"
                type="number"
                min={1}
                value={form.months}
                onChange={(e) => setForm({ ...form, months: e.target.value })}
                className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm w-28"
              />
            </label>
            <Button onClick={calculate}>Calculate</Button>
          </div>
          {error && (
            <p role="alert" className="text-red-400 text-sm mt-3">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {schedule && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{fmt.currency(schedule.monthlyPayment)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total interest</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold" data-testid="total-interest">
                  {fmt.currency(totalInterest)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Principal repaid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{fmt.currency(totalPrincipal)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Amortization schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <table
                className="w-full text-sm"
                aria-label="Loan amortization schedule"
                data-testid="amortization-table"
              >
                <thead>
                  <tr className="text-left text-[var(--text-muted)] border-b border-slate-700">
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4">Payment</th>
                    <th className="py-2 pr-4">Principal</th>
                    <th className="py-2 pr-4">Interest</th>
                    <th className="py-2 pr-4">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.schedule.map((row) => (
                    <tr key={row.month} className="border-b border-slate-800">
                      <td className="py-1.5 pr-4">{row.month}</td>
                      <td className="py-1.5 pr-4">{fmt.currency(row.payment)}</td>
                      <td className="py-1.5 pr-4">{fmt.currency(row.principal)}</td>
                      <td className="py-1.5 pr-4">{fmt.currency(row.interest)}</td>
                      <td className="py-1.5 pr-4">{fmt.currency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
