/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/label-has-associated-control */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FXEngine, type FXRateEntry } from '@/engines/FXEngine';
import { useFxRateStore } from '@/store/fxRateStore';
import { Plus, TrendingUp, TrendingDown, History, Trash2 } from 'lucide-react';
import { CURRENCIES, SOURCE_LABEL, SOURCE_VARIANT, formatMoney } from './constants';

interface RateForm {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  date: string;
  source: FXRateEntry['source'];
}

const EMPTY_FORM: RateForm = {
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  rate: '',
  date: new Date().toISOString().slice(0, 10),
  source: 'manual',
};

export function FXRateManager() {
  const storeRates = useFxRateStore((s) => s.rates);
  const addRate = useFxRateStore((s) => s.addRate);
  const deleteRate = useFxRateStore((s) => s.deleteRate);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RateForm, string>>>({});
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  useEffect(() => {
    FXEngine.clearRates();
    for (const r of storeRates) {
      FXEngine.setRate(r.fromCurrency, r.toCurrency, r.rate, r.effectiveDate, r.source ?? 'manual');
    }
  }, [storeRates]);

  const rates = useMemo(() => {
    const all: FXRateEntry[] = [];
    for (const r of storeRates) {
      all.push({
        from: r.fromCurrency,
        to: r.toCurrency,
        rate: r.rate,
        date: r.effectiveDate,
        source: r.source ?? 'manual',
      });
    }
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }, [storeRates]);

  const pairs = useMemo(() => {
    const map = new Map<string, FXRateEntry[]>();
    for (const r of rates) {
      const key = `${r.from}_${r.to}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, entries]) => ({
      key,
      from: entries[0]!.from,
      to: entries[0]!.to,
      latest: entries[entries.length - 1]!,
      count: entries.length,
      change:
        entries.length > 1
          ? ((entries[entries.length - 1]!.rate - entries[0]!.rate) / entries[0]!.rate) * 100
          : 0,
    }));
  }, [rates]);

  const history = useMemo(
    () => (selectedPair ? rates.filter((r) => `${r.from}_${r.to}` === selectedPair) : []),
    [rates, selectedPair]
  );

  const validate = useCallback((f: RateForm): Partial<Record<keyof RateForm, string>> => {
    const e: Partial<Record<keyof RateForm, string>> = {};
    if (!f.rate || isNaN(Number(f.rate)) || Number(f.rate) <= 0) e.rate = 'Rate must be positive';
    if (f.fromCurrency === f.toCurrency) e.toCurrency = 'Currencies must differ';
    if (!f.date) e.date = 'Date is required';
    return e;
  }, []);

  const handleAdd = useCallback(() => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    addRate({
      id: `fx-${Date.now()}`,
      fromCurrency: form.fromCurrency,
      toCurrency: form.toCurrency,
      rate: Number(form.rate),
      effectiveDate: form.date,
      source: form.source,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }, [form, validate, addRate]);

  const handleDelete = useCallback(
    (from: string, to: string, date: string) => {
      const match = storeRates.find(
        (r) => r.fromCurrency === from && r.toCurrency === to && r.effectiveDate === date
      );
      if (match) deleteRate(match.id);
    },
    [storeRates, deleteRate]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">FX Rate Manager</h2>
          <p className="text-sm text-slate-400 mt-1">
            {pairs.length} pair{pairs.length !== 1 ? 's' : ''} &middot; {rates.length} rate
            {rates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY_FORM);
            setErrors({});
            setShowForm(true);
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Rate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th className="px-4 py-3" scope="col">
                    Pair
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Change
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Entries
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pairs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      No rates configured.
                    </td>
                  </tr>
                ) : (
                  pairs.map((p) => (
                    <tr
                      key={p.key}
                      className={`hover:bg-slate-900/50 cursor-pointer ${selectedPair === p.key ? 'bg-slate-800/50' : ''}`}
                      onClick={() => setSelectedPair(selectedPair === p.key ? null : p.key)}
                    >
                      <td className="px-4 py-3 font-mono font-medium">
                        {p.from}/{p.to}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.latest?.rate.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="flex items-center justify-end gap-1 tabular-nums"
                          style={{ color: p.change >= 0 ? '#16A34A' : '#DC2626' }}
                        >
                          {p.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {p.change >= 0 ? '+' : ''}
                          {p.change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">{p.count}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPair(p.key);
                          }}
                          aria-label="View rate history"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" /> Rate History
            </h3>
            {selectedPair ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history.map((r, i) => (
                  <div
                    key={`${r.date}-${i}`}
                    className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                  >
                    <div>
                      <div className="text-xs text-slate-400">{r.date}</div>
                      <div className="font-mono text-sm tabular-nums">{r.rate.toFixed(6)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={SOURCE_VARIANT[r.source]}>{SOURCE_LABEL[r.source]}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.from, r.to, r.date)}
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Select a pair to view history
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Add FX Rate</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">From</label>
              <select
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
              <label className="block text-xs text-slate-400 mb-1">To</label>
              <select
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
              <label className="block text-xs text-slate-400 mb-1">Rate</label>
              <input
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
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              />
              {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((f) => ({ ...f, source: e.target.value as FXRateEntry['source'] }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="manual">Manual</option>
                <option value="api">API</option>
                <option value="feed">Feed</option>
              </select>
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
    </div>
  );
}
