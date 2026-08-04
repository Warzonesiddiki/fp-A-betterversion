/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FXEngine, MissingFXRateError } from '@/engines/FXEngine';
import { useFxRateStore } from '@/store/fxRateStore';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { multiplyMoney, roundTo, sumMoney } from '@/utils/money';
import { CURRENCIES, formatMoney } from './constants';

/**
 * GAP-1 (F-0006) — exact-decimal multi-currency translation and totals.
 *
 * Previously `e.revenue * rate` and `translated.reduce((s, e) => s +
 * e.revenueUSD, 0)` used raw IEEE-754 float math. FX rates and local-currency
 * amounts are currency inputs; translated values feed the consolidated
 * revenue/expenses/net-income/assets KPI cards and footer row. Multiplication
 * is now exact-decimal via `multiplyMoney`, sums via `sumMoney`, with a
 * single cent-round at the output boundary (`roundTo`). Exported for
 * *.money.test.ts.
 */
export interface TranslatedEntityInput {
  code: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  totalAssets: number;
}

export interface TranslatedEntityOutput extends TranslatedEntityInput {
  name: string;
  currency: string;
  rate: number;
  revenueUSD: number;
  expensesUSD: number;
  netIncomeUSD: number;
  assetsUSD: number;
}

export interface ConsolidatedTotals {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
}

export function translateEntityAmounts(
  e: TranslatedEntityInput & { name: string; currency: string },
  rate: number
): TranslatedEntityOutput {
  // FX-translated entity values are cent-rounded at the per-entity display
  // boundary (row-level); consolidated totals sum those rounded values at
  // full Decimal precision then round once at the output, matching the
  // "imported value" convention used in DynamicsConnector/QuickBooksConnector.
  return {
    ...e,
    name: e.name,
    currency: e.currency,
    rate,
    revenueUSD: roundTo(multiplyMoney(e.revenue, rate)),
    expensesUSD: roundTo(multiplyMoney(e.expenses, rate)),
    netIncomeUSD: roundTo(multiplyMoney(e.netIncome, rate)),
    assetsUSD: roundTo(multiplyMoney(e.totalAssets, rate)),
  };
}

export function computeConsolidatedTotals(
  rows: readonly Pick<
    TranslatedEntityOutput,
    'revenueUSD' | 'expensesUSD' | 'netIncomeUSD' | 'assetsUSD'
  >[]
): ConsolidatedTotals {
  // Sum at full Decimal precision over the already-rounded per-entity
  // values, then cent-round once at the output boundary.
  return {
    revenue: roundTo(sumMoney(rows.map((r) => r.revenueUSD))),
    expenses: roundTo(sumMoney(rows.map((r) => r.expensesUSD))),
    netIncome: roundTo(sumMoney(rows.map((r) => r.netIncomeUSD))),
    assets: roundTo(sumMoney(rows.map((r) => r.assetsUSD))),
  };
}

interface EntityRow {
  code: string;
  name: string;
  currency: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  totalAssets: number;
}

interface TranslatedEntity extends EntityRow {
  rate: number;
  revenueUSD: number;
  expensesUSD: number;
  netIncomeUSD: number;
  assetsUSD: number;
}

const ENTITIES: EntityRow[] = [
  {
    code: 'E100',
    name: 'Germany GmbH',
    currency: 'EUR',
    revenue: 5000000,
    expenses: 4200000,
    netIncome: 800000,
    totalAssets: 12000000,
  },
  {
    code: 'E200',
    name: 'UK Ltd',
    currency: 'GBP',
    revenue: 3500000,
    expenses: 2800000,
    netIncome: 700000,
    totalAssets: 8000000,
  },
  {
    code: 'E300',
    name: 'Japan KK',
    currency: 'JPY',
    revenue: 800000000,
    expenses: 650000000,
    netIncome: 150000000,
    totalAssets: 2000000000,
  },
  {
    code: 'E400',
    name: 'Switzerland AG',
    currency: 'CHF',
    revenue: 2000000,
    expenses: 1600000,
    netIncome: 400000,
    totalAssets: 5000000,
  },
  {
    code: 'E500',
    name: 'Canada Inc',
    currency: 'CAD',
    revenue: 2800000,
    expenses: 2300000,
    netIncome: 500000,
    totalAssets: 6000000,
  },
];

export function MultiCurrencyReporting() {
  const storeRates = useFxRateStore((s) => s.rates);
  const [parentCurrency, setParentCurrency] = useState('USD');

  const ratesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of storeRates) {
      map.set(`${r.fromCurrency}_${r.toCurrency}`, r.rate);
    }
    return map;
  }, [storeRates]);

  // F-0001: entities without an FX rate are EXCLUDED from consolidation and
  // surfaced via a blocking banner. The old `?? 1` silently translated at
  // an invented 1.0 rate.
  const translationResult = useMemo((): {
    rows: TranslatedEntity[];
    missingRates: string[];
  } => {
    const rows: TranslatedEntity[] = [];
    const missingRates: string[] = [];
    for (const e of ENTITIES) {
      let rate = ratesMap.get(`${e.currency}_${parentCurrency}`);
      if (rate === undefined) {
        try {
          rate = FXEngine.getRate(e.currency, parentCurrency);
        } catch (err) {
          if (err instanceof MissingFXRateError) {
            if (e.currency === parentCurrency) {
              rate = 1; // identity is a fact, not a fallback
            } else {
              missingRates.push(`${e.name} (${e.currency}→${parentCurrency})`);
              continue;
            }
          } else {
            throw err;
          }
        }
      }
      rows.push(translateEntityAmounts(e, rate));
    }
    return { rows, missingRates };
  }, [parentCurrency, ratesMap]);
  const translated = translationResult.rows;
  const missingRateEntities = translationResult.missingRates;

  const consolidated = useMemo(() => computeConsolidatedTotals(translated), [translated]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-400" /> Multi-Currency Reporting
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {ENTITIES.length} entities &middot; Consolidated in {parentCurrency}
          </p>
        </div>
      </div>

      {missingRateEntities.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-red-500 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-800 dark:text-red-300"
        >
          Consolidation incomplete — {missingRateEntities.length} entity(ies) excluded for missing
          FX rates: {missingRateEntities.join(', ')}. Totals below do NOT include these entities.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Reporting Currency</label>
          <select
            value={parentCurrency}
            onChange={(e) => setParentCurrency(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Total Revenue</div>
            <div className="text-lg font-bold tabular-nums">
              {formatMoney(consolidated.revenue, parentCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Total Expenses</div>
            <div className="text-lg font-bold tabular-nums">
              {formatMoney(consolidated.expenses, parentCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Net Income</div>
            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: consolidated.netIncome >= 0 ? '#16A34A' : '#DC2626' }}
            >
              {formatMoney(consolidated.netIncome, parentCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Total Assets</div>
            <div className="text-lg font-bold tabular-nums">
              {formatMoney(consolidated.assets, parentCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3" scope="col">
                  Entity
                </th>
                <th className="px-4 py-3" scope="col">
                  Currency
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Rate
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Expenses
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Net Income
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Assets
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {translated.map((e) => (
                <tr key={e.code} className="hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-400 mr-2">{e.code}</span>
                    {e.name}
                  </td>
                  <td className="px-4 py-3 font-mono">{e.currency}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {e.rate.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(e.revenueUSD, parentCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(e.expensesUSD, parentCurrency)}
                  </td>
                  <td
                    className="px-4 py-3 text-right tabular-nums font-medium"
                    style={{ color: e.netIncomeUSD >= 0 ? '#16A34A' : '#DC2626' }}
                  >
                    {formatMoney(e.netIncomeUSD, parentCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(e.assetsUSD, parentCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-700 bg-slate-900">
              <tr className="font-bold">
                <td className="px-4 py-3" colSpan={3}>
                  Consolidated
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoney(consolidated.revenue, parentCurrency)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoney(consolidated.expenses, parentCurrency)}
                </td>
                <td
                  className="px-4 py-3 text-right tabular-nums"
                  style={{ color: consolidated.netIncome >= 0 ? '#16A34A' : '#DC2626' }}
                >
                  {formatMoney(consolidated.netIncome, parentCurrency)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoney(consolidated.assets, parentCurrency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
