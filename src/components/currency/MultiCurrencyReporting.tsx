import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FXEngine } from '@/engines/FXEngine';
import { useFxRateStore } from '@/store/fxRateStore';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { CURRENCIES, formatMoney } from './constants';

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

  const translated = useMemo((): TranslatedEntity[] => {
    return ENTITIES.map((e) => {
      const rate =
        ratesMap.get(`${e.currency}_${parentCurrency}`) ??
        FXEngine.getRate(e.currency, parentCurrency) ??
        FXEngine.getRate(e.currency, 'USD') ??
        1;
      return {
        ...e,
        rate,
        revenueUSD: e.revenue * rate,
        expensesUSD: e.expenses * rate,
        netIncomeUSD: e.netIncome * rate,
        assetsUSD: e.totalAssets * rate,
      };
    });
  }, [parentCurrency, ratesMap]);

  const consolidated = useMemo(
    () => ({
      revenue: translated.reduce((s, e) => s + e.revenueUSD, 0),
      expenses: translated.reduce((s, e) => s + e.expensesUSD, 0),
      netIncome: translated.reduce((s, e) => s + e.netIncomeUSD, 0),
      assets: translated.reduce((s, e) => s + e.assetsUSD, 0),
    }),
    [translated]
  );

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
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Net Income</th>
                <th className="px-4 py-3 text-right">Assets</th>
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
