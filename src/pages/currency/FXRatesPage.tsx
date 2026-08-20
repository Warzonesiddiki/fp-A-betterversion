// @money-ast-allow Reason: this file is the FX Rates page. The flagged
// `===` are string identity checks on ISO-4217 currency codes (USD, EUR,
// GBP, …) used to validate that the from/to currencies in an exchange
// rate are distinct and to match a rate to its source currency. These
// are not money-amount comparisons.

import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/utils/financialFormatting';
import type { ExchangeRate } from '@/types';

const INITIAL_RATES: ExchangeRate[] = [
  { id: '1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2026-01-01' },
  { id: '2', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, effectiveDate: '2026-01-01' },
  { id: '3', fromCurrency: 'USD', toCurrency: 'JPY', rate: 149.5, effectiveDate: '2026-01-01' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL'];

interface RateForm {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  effectiveDate: string;
}

const EMPTY_FORM: RateForm = {
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  rate: '',
  effectiveDate: '',
};

export default function FXRatesPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [rates, setRates] = useState<ExchangeRate[]>(INITIAL_RATES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RateForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const validate = useCallback(
    (f: RateForm): Partial<Record<keyof RateForm, string>> => {
      const e: Partial<Record<keyof RateForm, string>> = {};
      if (!f.rate || isNaN(Number(f.rate)) || Number(f.rate) <= 0)
        e.rate = 'Rate must be a positive number';
      if (f.fromCurrency === f.toCurrency) e.toCurrency = 'Currencies must differ';
      if (rates.some((r) => r.fromCurrency === f.fromCurrency && r.toCurrency === f.toCurrency))
        e.toCurrency = 'This currency pair already exists';
      if (!f.effectiveDate) e.effectiveDate = 'Date is required';
      return e;
    },
    [rates]
  );

  const handleAdd = useCallback(() => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const newRate: ExchangeRate = {
      id: Date.now().toString(),
      fromCurrency: form.fromCurrency,
      toCurrency: form.toCurrency,
      rate: Number(form.rate),
      effectiveDate: form.effectiveDate,
    };
    setRates((prev) => [...prev, newRate]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }, [form, validate]);

  const handleDelete = useCallback((id: string) => {
    setRates((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
  }, []);

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-4">Import data to enable FX translation.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="FX Rates"
        purpose={
          <>
            {rates.length}rate{rates.length !== 1 ? 's' : ''}configured
          </>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setErrors({});
              setShowForm(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Rate
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" aria-label="FX rates by currency pair">
            <caption className="sr-only">Detailed breakdown of fx rates by currency pair</caption>
            <thead>
              <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                <th scope="col" className="px-4 py-3">
                  From
                </th>
                <th scope="col" className="px-4 py-3">
                  To
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Rate
                </th>
                <th scope="col" className="px-4 py-3">
                  Effective Date
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--text-muted)]">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No exchange rates configured. Add rates to enable multi-currency translation.
                  </td>
                </tr>
              ) : (
                rates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-mono">{r.fromCurrency}</td>
                    <td className="px-4 py-3 font-mono">{r.toCurrency}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatNumber(r.rate, 4)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{r.effectiveDate}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(r.id)}
                        aria-label="Delete FX rate"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Rate Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Add Exchange Rate</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="from-currency"
                className="block text-xs text-[var(--text-muted)] mb-1"
              >
                From Currency
              </label>
              <select
                id="from-currency"
                value={form.fromCurrency}
                onChange={(e) => setForm((f) => ({ ...f, fromCurrency: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="to-currency" className="block text-xs text-[var(--text-muted)] mb-1">
                To Currency
              </label>
              <select
                id="to-currency"
                value={form.toCurrency}
                onChange={(e) => setForm((f) => ({ ...f, toCurrency: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.toCurrency && (
                <p className="text-xs text-red-400 mt-1">{errors.toCurrency}</p>
              )}
            </div>
            <div>
              <label htmlFor="rate" className="block text-xs text-[var(--text-muted)] mb-1">
                Rate
              </label>
              <input
                id="rate"
                type="number"
                step="any"
                min="0"
                value={form.rate}
                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                placeholder="0.0000"
              />
              {errors.rate && <p className="text-xs text-red-400 mt-1">{errors.rate}</p>}
            </div>
            <div>
              <label
                htmlFor="effective-date"
                className="block text-xs text-[var(--text-muted)] mb-1"
              >
                Effective Date
              </label>
              <input
                id="effective-date"
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              />
              {errors.effectiveDate && (
                <p className="text-xs text-red-400 mt-1">{errors.effectiveDate}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Rate</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Delete Rate</h2>
          <p className="text-[var(--text-muted)]">
            Are you sure you want to delete this exchange rate? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
