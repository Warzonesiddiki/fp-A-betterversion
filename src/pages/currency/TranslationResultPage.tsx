import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Repeat, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

const RATES: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    CHF: 0.88,
    CAD: 1.36,
    AUD: 1.53,
    CNY: 7.24,
    INR: 83.12,
    BRL: 4.97,
  },
  EUR: {
    USD: 1.087,
    GBP: 0.859,
    JPY: 162.5,
    CHF: 0.957,
    CAD: 1.478,
    AUD: 1.663,
    CNY: 7.87,
    INR: 90.35,
    BRL: 5.4,
  },
  GBP: {
    USD: 1.266,
    EUR: 1.164,
    JPY: 189.2,
    CHF: 1.114,
    CAD: 1.72,
    AUD: 1.936,
    CNY: 9.16,
    INR: 105.2,
    BRL: 6.29,
  },
  JPY: {
    USD: 0.00669,
    EUR: 0.00615,
    GBP: 0.00529,
    CHF: 0.00589,
    CAD: 0.0091,
    AUD: 0.0102,
    CNY: 0.0484,
    INR: 0.556,
    BRL: 0.0333,
  },
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL'];

function formatCurrency(n: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

interface TranslationEntry {
  accountCode: string;
  accountName: string;
  originalAmount: number;
  translatedAmount: number;
  gainLoss: number;
}

export default function TranslationResultPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [sourceCurrency, setSourceCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');

  const rate = useMemo(() => {
    if (sourceCurrency === targetCurrency) return 1;
    return RATES[sourceCurrency]?.[targetCurrency] ?? 1;
  }, [sourceCurrency, targetCurrency]);

  const translationData = useMemo((): TranslationEntry[] => {
    const accountMap = new Map<string, { name: string; total: number }>();
    for (const entry of entries) {
      const code = entry.accountCode || 'Unknown';
      const existing = accountMap.get(code);
      const amount = (entry.debit || 0) - (entry.credit || 0);
      if (existing) {
        existing.total += amount;
      } else {
        accountMap.set(code, { name: entry.accountName || code, total: amount });
      }
    }
    return Array.from(accountMap.entries())
      .map(([code, { name, total }]) => ({
        accountCode: code,
        accountName: name,
        originalAmount: total,
        translatedAmount: total * rate,
        gainLoss: total * rate - total,
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }, [entries, rate]);

  const totals = useMemo(() => {
    const original = translationData.reduce((s, e) => s + e.originalAmount, 0);
    const translated = translationData.reduce((s, e) => s + e.translatedAmount, 0);
    return { original, translated, gainLoss: translated - original };
  }, [translationData]);

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Repeat className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data to Translate</h2>
        <p className="text-slate-400 mb-4">Import GL data to perform currency translation.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Translation Results</h1>

      {/* Currency Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Source Currency</label>
              <select
                value={sourceCurrency}
                onChange={(e) => setSourceCurrency(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
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
              <label className="block text-xs text-slate-500 mb-1">Target Currency</label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto text-right mt-4">
              <div className="text-xs text-slate-500">Exchange Rate</div>
              <div className="text-lg font-bold tabular-nums">{rate.toFixed(6)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Original ({sourceCurrency})</div>
            <div className="text-lg font-bold">
              {formatCurrency(totals.original, sourceCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Translated ({targetCurrency})</div>
            <div className="text-lg font-bold">
              {formatCurrency(totals.translated, targetCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Translation Gain/Loss</div>
            <div
              className="text-lg font-bold flex items-center justify-center gap-1"
              style={{ color: totals.gainLoss >= 0 ? '#4ade80' : '#f87171' }}
            >
              {totals.gainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatCurrency(totals.gainLoss, targetCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Translation Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Original ({sourceCurrency})</th>
                  <th className="px-4 py-3 text-right">Translated ({targetCurrency})</th>
                  <th className="px-4 py-3 text-right">Gain/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {translationData.map((e) => (
                  <tr key={e.accountCode} className="hover:bg-slate-900/50">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-slate-400 mr-2">{e.accountCode}</span>
                      <span className="text-slate-300">{e.accountName}</span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatCurrency(e.originalAmount, sourceCurrency)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {formatCurrency(e.translatedAmount, targetCurrency)}
                    </td>
                    <td
                      className="px-4 py-2 text-right tabular-nums font-medium"
                      style={{ color: e.gainLoss >= 0 ? '#4ade80' : '#f87171' }}
                    >
                      {e.gainLoss >= 0 ? '+' : ''}
                      {formatCurrency(e.gainLoss, targetCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-900 border-t border-slate-700">
                <tr className="font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(totals.original, sourceCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(totals.translated, targetCurrency)}
                  </td>
                  <td
                    className="px-4 py-3 text-right tabular-nums"
                    style={{ color: totals.gainLoss >= 0 ? '#4ade80' : '#f87171' }}
                  >
                    {totals.gainLoss >= 0 ? '+' : ''}
                    {formatCurrency(totals.gainLoss, targetCurrency)}
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
