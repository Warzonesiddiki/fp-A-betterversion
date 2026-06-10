import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FXEngine, type RateType } from '@/engines/FXEngine';
import { ArrowRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { CURRENCIES, formatMoney } from './constants';

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

  const closingRate = useMemo(
    () => FXEngine.getRate(entityCurrency, parentCurrency, `${period}-12-31`) || 1.087,
    [entityCurrency, parentCurrency, period]
  );
  const averageRate = useMemo(
    () => FXEngine.getAverageRate(entityCurrency, parentCurrency, period) || 1.075,
    [entityCurrency, parentCurrency, period]
  );
  const historicalRate = useMemo(
    () => FXEngine.getRate(entityCurrency, parentCurrency) || 1.05,
    [entityCurrency, parentCurrency]
  );

  const rows = useMemo((): TranslationRow[] => {
    return ACCOUNTS.map((acct) => {
      const rateType = getRateType(acct.name);
      const rate =
        rateType === 'closing'
          ? closingRate
          : rateType === 'average'
            ? averageRate
            : historicalRate;
      const translated = acct.localAmount * rate;
      const atHistorical = acct.localAmount * historicalRate;
      return {
        code: acct.code,
        name: acct.name,
        category: acct.category,
        localAmount: acct.localAmount,
        rateType,
        rateUsed: rate,
        translatedAmount: translated,
        ctaAdjustment: rateType === 'historical' ? 0 : translated - atHistorical,
      };
    });
  }, [closingRate, averageRate, historicalRate]);

  const totals = useMemo(
    () => ({
      local: rows.reduce((s, r) => s + r.localAmount, 0),
      translated: rows.reduce((s, r) => s + r.translatedAmount, 0),
      cta: rows.reduce((s, r) => s + r.ctaAdjustment, 0),
    }),
    [rows]
  );

  const isBalanced = useMemo(() => {
    const assets = rows
      .filter((r) => r.category === 'asset')
      .reduce((s, r) => s + r.translatedAmount, 0);
    const liabEq = rows
      .filter((r) => r.category === 'liability' || r.category === 'equity')
      .reduce((s, r) => s + r.translatedAmount, 0);
    return Math.abs(assets + liabEq) < 1;
  }, [rows]);

  return (
    <div className="space-y-6" role="region" aria-label="CurrencyTranslation">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ASC 830 Currency Translation</h2>
          <p className="text-sm text-slate-400 mt-1">Temporal method with CTA adjustments</p>
        </div>
        <Badge variant={isBalanced ? 'default' : 'destructive'}>
          {isBalanced ? (
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

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Entity</label>
              <select
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
              <label className="block text-xs text-slate-500 mb-1">Parent</label>
              <select
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
              <label className="block text-xs text-slate-500 mb-1">Period</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white dark:bg-gray-900 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white w-24"
              />
            </div>
            <div className="ml-auto flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Closing</span>
                <span className="ml-2 font-mono">{closingRate.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-slate-500">Average</span>
                <span className="ml-2 font-mono">{averageRate.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-slate-500">Historical</span>
                <span className="ml-2 font-mono">{historicalRate.toFixed(4)}</span>
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
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Cat.</th>
                  <th className="px-4 py-3 text-right">Local</th>
                  <th className="px-4 py-3">Rate Type</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Translated</th>
                  <th className="px-4 py-3 text-right">CTA</th>
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
                      {r.rateUsed.toFixed(4)}
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
