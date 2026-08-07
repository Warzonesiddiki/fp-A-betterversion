import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FXEngine, MissingFXRateError, type RateType } from '@/engines/FXEngine';
import { ArrowRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { addMoney, multiplyMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/financialFormatting';
import { CURRENCIES, formatMoney } from './constants';

/**
 * GAP-1 (F-0006) — exact-decimal ASC 830 translation math.
 *
 * Translation multiplies (local × rate) and sums per-category and overall
 * totals with raw IEEE-754 math; CTA adjustment is translated − at-historical.
 * Those are all currency arithmetic and feed the balance check (which
 * decides the "Balanced / Unbalanced" badge shown to the user — LOGIC).
 * Percentages/rates are scalar multipliers and are excluded; rates displayed
 * via toFixed(4) are scalar display, not money. Exported for *.money.test.ts.
 */
export interface TranslationInput {
  category: string;
  localAmount: number;
  translatedAmount: number;
  ctaAdjustment: number;
}

export interface TranslationTotals {
  local: number;
  translated: number;
  cta: number;
  assetTranslated: number;
  liabEqTranslated: number;
  balanced: boolean;
}

const BALANCE_TOLERANCE = 1; // $1 tolerance matching pre-existing logic.

export function translateAccount(
  localAmount: number,
  rate: number,
  historicalRate: number,
  isHistorical: boolean
): { translatedAmount: number; ctaAdjustment: number } {
  const translated = roundTo(multiplyMoney(localAmount, rate));
  const atHistorical = roundTo(multiplyMoney(localAmount, historicalRate));
  return {
    translatedAmount: translated,
    ctaAdjustment: isHistorical ? 0 : roundTo(subtractMoney(translated, atHistorical)),
  };
}

export function computeTranslationTotals(rows: readonly TranslationInput[]): TranslationTotals {
  const local = roundTo(sumMoney(rows.map((r) => r.localAmount)));
  const translated = roundTo(sumMoney(rows.map((r) => r.translatedAmount)));
  const cta = roundTo(sumMoney(rows.map((r) => r.ctaAdjustment)));
  const assetTranslated = roundTo(
    sumMoney(rows.filter((r) => r.category === 'asset').map((r) => r.translatedAmount))
  );
  const liabEqTranslated = roundTo(
    sumMoney(
      rows
        .filter((r) => r.category === 'liability' || r.category === 'equity')
        .map((r) => r.translatedAmount)
    )
  );
  const balanced =
    Math.abs(roundTo(addMoney(assetTranslated, liabEqTranslated))) < BALANCE_TOLERANCE;
  return { local, translated, cta, assetTranslated, liabEqTranslated, balanced };
}

interface AccountLine {
  code: string;
  name: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  localAmount: number;
}

interface TranslationRow {
  code: string;
  name: string;
  category: string;
  localAmount: number;
  rateType: RateType;
  rateUsed: number;
  translatedAmount: number;
  ctaAdjustment: number;
}

const RATE_MAP: Record<string, RateType> = {
  Cash: 'closing',
  'Accounts Receivable': 'closing',
  'Accounts Payable': 'closing',
  'Short-term Debt': 'closing',
  Inventory: 'historical',
  'Fixed Assets': 'historical',
  'Long-term Debt': 'historical',
  'Common Stock': 'historical',
  'Retained Earnings': 'historical',
  Revenue: 'average',
  COGS: 'average',
  'Operating Expense': 'average',
  Depreciation: 'average',
  'Interest Expense': 'average',
};

function getRateType(name: string): RateType {
  for (const [key, type] of Object.entries(RATE_MAP)) {
    if (name.includes(key)) return type;
  }
  return 'closing';
}

const ACCOUNTS: AccountLine[] = [
  { code: '1010', name: 'Cash', category: 'asset', localAmount: 500000 },
  { code: '1200', name: 'Accounts Receivable', category: 'asset', localAmount: 350000 },
  { code: '1300', name: 'Inventory', category: 'asset', localAmount: 280000 },
  { code: '1500', name: 'Fixed Assets', category: 'asset', localAmount: 1200000 },
  { code: '2010', name: 'Accounts Payable', category: 'liability', localAmount: -200000 },
  { code: '2200', name: 'Short-term Debt', category: 'liability', localAmount: -150000 },
  { code: '2500', name: 'Long-term Debt', category: 'liability', localAmount: -600000 },
  { code: '3010', name: 'Common Stock', category: 'equity', localAmount: -500000 },
  { code: '3200', name: 'Retained Earnings', category: 'equity', localAmount: -480000 },
  { code: '4010', name: 'Revenue', category: 'revenue', localAmount: -2000000 },
  { code: '5010', name: 'COGS', category: 'expense', localAmount: 1200000 },
  { code: '6010', name: 'Operating Expense', category: 'expense', localAmount: 500000 },
  { code: '6100', name: 'Depreciation', category: 'expense', localAmount: 80000 },
];

export function CurrencyTranslation() {
  const [entityCurrency, setEntityCurrency] = useState('EUR');
  const [parentCurrency, setParentCurrency] = useState('USD');
  const [period, setPeriod] = useState('2026');

  // F-0001: NEVER fabricate fallback rates (the old `|| 1.087` invented a
  // rate out of thin air). Missing rates are a blocking, user-visible error.
  const rateResults = useMemo(() => {
    const lookup = (label: string, fn: () => number) => {
      try {
        return { label, rate: fn(), error: null as string | null };
      } catch (e) {
        if (e instanceof MissingFXRateError)
          return { label, rate: null as number | null, error: e.message };
        throw e;
      }
    };
    return [
      lookup('closing', () => FXEngine.getRate(entityCurrency, parentCurrency, `${period}-12-31`)),
      lookup('average', () => FXEngine.getAverageRate(entityCurrency, parentCurrency, period)),
      lookup('historical', () => FXEngine.getRate(entityCurrency, parentCurrency)),
    ];
  }, [entityCurrency, parentCurrency, period]);

  const missingRateErrors = rateResults
    .filter((r) => r.error !== null)
    .map((r) => `${r.label}: ${r.error}`);
  const closingRate = rateResults[0]!.rate;
  const averageRate = rateResults[1]!.rate;
  const historicalRate = rateResults[2]!.rate;

  const rows = useMemo((): TranslationRow[] => {
    // Blocking state: without all three rates no translated number is shown.
    if (closingRate === null || averageRate === null || historicalRate === null) return [];
    return ACCOUNTS.map((acct) => {
      const rateType = getRateType(acct.name);
      const rate =
        rateType === 'closing'
          ? closingRate
          : rateType === 'average'
            ? averageRate
            : historicalRate;
      const { translatedAmount, ctaAdjustment } = translateAccount(
        acct.localAmount,
        rate,
        historicalRate,
        rateType === 'historical'
      );
      return {
        code: acct.code,
        name: acct.name,
        category: acct.category,
        localAmount: acct.localAmount,
        rateType,
        rateUsed: rate,
        translatedAmount,
        ctaAdjustment,
      };
    });
  }, [closingRate, averageRate, historicalRate]);

  const totals = useMemo(() => {
    const t = computeTranslationTotals(rows);
    return { local: t.local, translated: t.translated, cta: t.cta, balanced: t.balanced };
  }, [rows]);
  const isBalanced = totals.balanced;

  return (
    <div className="space-y-6" role="region" aria-label="CurrencyTranslation">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ASC 830 Currency Translation</h2>
          <p className="text-sm text-slate-400 mt-1">Temporal method with CTA adjustments</p>
        </div>
        <Badge
          variant={
            missingRateErrors.length > 0 ? 'destructive' : isBalanced ? 'default' : 'destructive'
          }
        >
          {missingRateErrors.length > 0 ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Blocked: missing rates
            </span>
          ) : isBalanced ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Balanced
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Unbalanced
            </span>
          )}
        </Badge>
      </div>

      {missingRateErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-red-500 bg-red-50 dark:bg-red-950/40 p-4"
        >
          <p className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Translation blocked: missing FX rates
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm text-red-600 dark:text-red-400">
            {missingRateErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Load the missing {entityCurrency}→{parentCurrency} rates for the period before relying
            on translated balances. No fallback rate is ever substituted.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label htmlFor="entity" className="block text-xs text-slate-500 mb-1">
                Entity
              </label>
              <select
                id="entity"
                value={entityCurrency}
                onChange={(e) => setEntityCurrency(e.target.value)}
                className="bg-white dark:bg-gray-900 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-500 mt-4" />
            <div>
              <label htmlFor="parent" className="block text-xs text-slate-500 mb-1">
                Parent
              </label>
              <select
                id="parent"
                value={parentCurrency}
                onChange={(e) => setParentCurrency(e.target.value)}
                className="bg-white dark:bg-gray-900 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="period" className="block text-xs text-slate-500 mb-1">
                Period
              </label>
              <input
                id="period"
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white dark:bg-gray-900 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white w-24"
              />
            </div>
            <div className="ml-auto flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Closing</span>
                <span className="ml-2 font-mono">
                  {closingRate === null ? '— missing' : formatNumber(closingRate, 4)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Average</span>
                <span className="ml-2 font-mono">
                  {averageRate === null ? '— missing' : formatNumber(averageRate, 4)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Historical</span>
                <span className="ml-2 font-mono">
                  {historicalRate === null ? '— missing' : formatNumber(historicalRate, 4)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Local Total</div>
            <div className="text-lg font-bold tabular-nums">
              {formatMoney(totals.local, entityCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Translated</div>
            <div className="text-lg font-bold tabular-nums">
              {formatMoney(totals.translated, parentCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">CTA Adjustment</div>
            <div
              className="text-lg font-bold tabular-nums flex items-center justify-center gap-1"
              style={{ color: totals.cta >= 0 ? '#16A34A' : '#DC2626' }}
            >
              {totals.cta >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatMoney(totals.cta, parentCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Method</div>
            <div className="text-lg font-bold">Temporal</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 dark:bg-slate-900 z-10">
                <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3" scope="col">
                    Account
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Cat.
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Local
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Rate Type
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Translated
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    CTA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.code} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>
                      {r.name}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline">{r.category}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatMoney(r.localAmount, entityCurrency)}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline">{r.rateType}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {formatNumber(r.rateUsed, 4)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {formatMoney(r.translatedAmount, parentCurrency)}
                    </td>
                    <td
                      className="px-4 py-2 text-right tabular-nums"
                      style={{
                        color:
                          r.ctaAdjustment === 0
                            ? undefined
                            : r.ctaAdjustment >= 0
                              ? '#16A34A'
                              : '#DC2626',
                      }}
                    >
                      {r.ctaAdjustment !== 0
                        ? `${r.ctaAdjustment >= 0 ? '+' : ''}${formatMoney(r.ctaAdjustment, parentCurrency)}`
                        : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-900 border-t border-slate-700">
                <tr className="font-bold">
                  <td className="px-4 py-3" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(totals.local, entityCurrency)}
                  </td>
                  <td className="px-4 py-3" colSpan={2} />
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(totals.translated, parentCurrency)}
                  </td>
                  <td
                    className="px-4 py-3 text-right tabular-nums"
                    style={{ color: totals.cta >= 0 ? '#16A34A' : '#DC2626' }}
                  >
                    {totals.cta >= 0 ? '+' : ''}
                    {formatMoney(totals.cta, parentCurrency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
