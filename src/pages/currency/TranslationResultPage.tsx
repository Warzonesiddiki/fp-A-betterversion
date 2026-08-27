// @money-ast-allow Reason: this file is the currency-translation results
// page. The flagged `===` is `sourceCurrency === targetCurrency`, a string
// identity check on an ISO-4217 currency code. The signed net amount of a
// GL entry is derived in `translationResultData.ts` and fed into the
// canonical money primitive (`sumMoney` / `roundTo`). No currency value is
// compared or accumulated with raw float math downstream.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Repeat, ArrowRight } from 'lucide-react';
import { formatNumber } from '@/utils/financialFormatting';
import { sumMoney, roundTo } from '@/utils/money';
import { buildTranslationEntries } from './translationResultData';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';

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

interface CurrencySelectorProps {
  readonly sourceCurrency: string;
  readonly targetCurrency: string;
  readonly onSourceChange: (currency: string) => void;
  readonly onTargetChange: (currency: string) => void;
  readonly rate: number | undefined;
}

function CurrencySelector({
  sourceCurrency,
  targetCurrency,
  onSourceChange,
  onTargetChange,
  rate,
}: CurrencySelectorProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div>
        <label htmlFor="source-currency" className="block text-xs text-[var(--text-muted)] mb-1">
          Source Currency
        </label>
        <select
          id="source-currency"
          value={sourceCurrency}
          onChange={(e) => onSourceChange(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <ArrowRight className="h-5 w-5 text-[var(--text-muted)] mt-4" />
      <div>
        <label htmlFor="target-currency" className="block text-xs text-[var(--text-muted)] mb-1">
          Target Currency
        </label>
        <select
          id="target-currency"
          value={targetCurrency}
          onChange={(e) => onTargetChange(e.target.value)}
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
        <div className="text-xs text-[var(--text-muted)]">Exchange Rate</div>
        <div className="text-lg font-bold tabular-nums">
          {rate === undefined ? '—' : formatNumber(rate, 6)}
        </div>
      </div>
    </div>
  );
}

export default function TranslationResultPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [sourceCurrency, setSourceCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');

  const rate = useMemo<number | undefined>(() => {
    if (sourceCurrency === targetCurrency) return 1;
    return RATES[sourceCurrency]?.[targetCurrency];
  }, [sourceCurrency, targetCurrency]);

  const translationData = useMemo(
    () => (rate === undefined ? [] : buildTranslationEntries(entries, rate)),
    [entries, rate]
  );

  const totals = useMemo(() => {
    const original = roundTo(sumMoney(translationData.map((e) => e.originalAmount)), 2);
    const translated = roundTo(sumMoney(translationData.map((e) => e.translatedAmount)), 2);
    return { original, translated };
  }, [translationData]);

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Repeat className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data to Translate</h2>
        <p className="text-[var(--text-muted)] mb-4">
          Import GL data to perform currency translation.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  if (rate === undefined)
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Translation Results" />
        <Card>
          <CardContent className="p-4">
            <CurrencySelector
              sourceCurrency={sourceCurrency}
              targetCurrency={targetCurrency}
              onSourceChange={setSourceCurrency}
              onTargetChange={setTargetCurrency}
              rate={undefined}
            />
          </CardContent>
        </Card>
        <ErrorState
          title="Missing exchange rate"
          message={`No exchange rate is available for ${sourceCurrency} → ${targetCurrency}. Translation is blocked rather than computed at a placeholder rate of 1. Pick a supported pair or load the missing rate.`}
          errorCode="MISSING_FX_RATE"
        />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Translation Results" />

      {/* Currency Selector */}
      <Card>
        <CardContent className="p-4">
          <CurrencySelector
            sourceCurrency={sourceCurrency}
            targetCurrency={targetCurrency}
            onSourceChange={setSourceCurrency}
            onTargetChange={setTargetCurrency}
            rate={rate}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-[var(--text-muted)]">Original ({sourceCurrency})</div>
            <div className="text-lg font-bold">
              {formatCurrency(totals.original, sourceCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-[var(--text-muted)]">Translated ({targetCurrency})</div>
            <div className="text-lg font-bold">
              {formatCurrency(totals.translated, targetCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Translation Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table
              className="w-full text-sm"
              aria-label="Translation results by entity and currency"
            >
              <caption className="sr-only">
                Currency translation results showing entity, source currency, target currency,
                exchange rate, and translated amount
              </caption>
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th scope="col" className="px-4 py-3">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Original ({sourceCurrency})
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Translated ({targetCurrency})
                  </th>
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
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
