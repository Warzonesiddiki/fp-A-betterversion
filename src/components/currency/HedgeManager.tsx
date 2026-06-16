/* eslint-disable jsx-a11y/label-has-associated-control */
import { memo, useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MultiCurrencyEngine } from '@/engines/MultiCurrencyEngine';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import {
  CURRENCIES,
  INSTRUMENTS,
  HEDGE_TYPES,
  STATUS_VARIANT,
  HEDGE_TYPE_VARIANT,
  formatMoney,
  type HedgeStatus,
  type HedgeType,
} from './constants';

interface HedgePosition {
  id: string;
  instrument: string;
  hedgeType: HedgeType;
  notionalAmount: number;
  contractedRate: number;
  currentRate: number;
  maturityDate: string;
  status: HedgeStatus;
  currency: string;
  entityCurrency: string;
}

interface HedgeForm {
  instrument: string;
  hedgeType: HedgeType;
  notionalAmount: string;
  contractedRate: string;
  currentRate: string;
  maturityDate: string;
  status: HedgeStatus;
  currency: string;
  entityCurrency: string;
}

const EMPTY_FORM: HedgeForm = {
  instrument: '',
  hedgeType: 'Fair Value',
  notionalAmount: '',
  contractedRate: '',
  currentRate: '',
  maturityDate: '',
  status: 'Active',
  currency: 'USD',
  entityCurrency: 'EUR',
};

const SAMPLE: HedgePosition[] = [
  {
    id: '1',
    instrument: 'Forward Contract',
    hedgeType: 'Cash Flow',
    notionalAmount: 500000,
    contractedRate: 1.085,
    currentRate: 1.092,
    maturityDate: '2026-06-30',
    status: 'Active',
    currency: 'USD',
    entityCurrency: 'EUR',
  },
  {
    id: '2',
    instrument: 'Currency Option',
    hedgeType: 'Fair Value',
    notionalAmount: 750000,
    contractedRate: 0.79,
    currentRate: 0.785,
    maturityDate: '2026-09-15',
    status: 'Active',
    currency: 'GBP',
    entityCurrency: 'EUR',
  },
  {
    id: '3',
    instrument: 'Cross-Currency Swap',
    hedgeType: 'Net Investment',
    notionalAmount: 1000000,
    contractedRate: 149.5,
    currentRate: 151.2,
    maturityDate: '2027-03-31',
    status: 'Active',
    currency: 'JPY',
    entityCurrency: 'EUR',
  },
];

export const HedgeManager = memo(function HedgeManager() {
  const [hedges, setHedges] = useState<HedgePosition[]>(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HedgeForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof HedgeForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const active = hedges.filter((h) => h.status === 'Active');
    const totalNotional = active.reduce((s, h) => s + h.notionalAmount, 0);
    const totalFairValue = active.reduce(
      (s, h) =>
        s +
        MultiCurrencyEngine.calculateTranslationGainLoss(
          h.notionalAmount,
          h.contractedRate,
          h.currentRate
        ),
      0
    );
    const byType = HEDGE_TYPES.map((t) => ({
      type: t,
      count: active.filter((h) => h.hedgeType === t).length,
      notional: active.filter((h) => h.hedgeType === t).reduce((s, h) => s + h.notionalAmount, 0),
    }));
    return { activeCount: active.length, totalNotional, totalFairValue, byType };
  }, [hedges]);

  const validate = useCallback((f: HedgeForm): Partial<Record<keyof HedgeForm, string>> => {
    const e: Partial<Record<keyof HedgeForm, string>> = {};
    if (!f.instrument) e.instrument = 'Required';
    if (!f.notionalAmount || Number(f.notionalAmount) <= 0) e.notionalAmount = 'Must be positive';
    if (!f.contractedRate || Number(f.contractedRate) <= 0) e.contractedRate = 'Must be positive';
    if (!f.currentRate || Number(f.currentRate) <= 0) e.currentRate = 'Must be positive';
    if (!f.maturityDate) e.maturityDate = 'Required';
    return e;
  }, []);

  const handleSave = useCallback(() => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const pos: HedgePosition = {
      id: editingId ?? Date.now().toString(),
      instrument: form.instrument,
      hedgeType: form.hedgeType,
      notionalAmount: Number(form.notionalAmount),
      contractedRate: Number(form.contractedRate),
      currentRate: Number(form.currentRate),
      maturityDate: form.maturityDate,
      status: form.status,
      currency: form.currency,
      entityCurrency: form.entityCurrency,
    };
    setHedges((prev) =>
      editingId ? prev.map((h) => (h.id === editingId ? pos : h)) : [...prev, pos]
    );
    setShowForm(false);
    setEditingId(null);
  }, [form, editingId, validate]);

  const openEdit = useCallback((h: HedgePosition) => {
    setForm({
      instrument: h.instrument,
      hedgeType: h.hedgeType,
      notionalAmount: h.notionalAmount.toString(),
      contractedRate: h.contractedRate.toString(),
      currentRate: h.currentRate.toString(),
      maturityDate: h.maturityDate,
      status: h.status,
      currency: h.currency,
      entityCurrency: h.entityCurrency,
    });
    setErrors({});
    setEditingId(h.id);
    setShowForm(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" /> Hedge Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {metrics.activeCount} active &middot; ASC 815 compliance
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY_FORM);
            setErrors({});
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Hedge
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Active</div>
            <div className="text-2xl font-bold">{metrics.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Notional</div>
            <div className="text-2xl font-bold tabular-nums">
              {formatMoney(metrics.totalNotional)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Fair Value</div>
            <div
              className="text-2xl font-bold tabular-nums flex items-center justify-center gap-1"
              style={{ color: metrics.totalFairValue >= 0 ? '#16A34A' : '#DC2626' }}
            >
              {metrics.totalFairValue >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatMoney(metrics.totalFairValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Types</div>
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              {metrics.byType.map((m) => (
                <Badge key={m.type} variant="outline" className="text-xs">
                  {m.type}: {m.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Hedge Effectiveness (ASC 815)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {metrics.byType.map((m) => (
              <div key={m.type} className="p-3 rounded bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">{m.type}</div>
                <div className="text-lg font-bold">{m.count}</div>
                <div className="text-xs text-slate-500 tabular-nums">{formatMoney(m.notional)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3" scope="col">
                  Instrument
                </th>
                <th className="px-4 py-3" scope="col">
                  Type
                </th>
                <th className="px-4 py-3" scope="col">
                  Pair
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Notional
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  P&L
                </th>
                <th className="px-4 py-3" scope="col">
                  Status
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {hedges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No positions.
                  </td>
                </tr>
              ) : (
                hedges.map((h) => {
                  const pnl = MultiCurrencyEngine.calculateTranslationGainLoss(
                    h.notionalAmount,
                    h.contractedRate,
                    h.currentRate
                  );
                  return (
                    <tr key={h.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3">{h.instrument}</td>
                      <td className="px-4 py-3">
                        <Badge variant={HEDGE_TYPE_VARIANT[h.hedgeType]}>{h.hedgeType}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {h.entityCurrency}/{h.currency}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(h.notionalAmount)}
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums font-medium"
                        style={{ color: pnl >= 0 ? '#16A34A' : '#DC2626' }}
                      >
                        {pnl >= 0 ? '+' : ''}
                        {formatMoney(pnl)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[h.status]}>{h.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(h)}
                          aria-label="Edit hedge"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(h.id)}
                          aria-label="Delete hedge"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">
            {editingId ? 'Edit' : 'Add'} Hedge Position
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Instrument</label>
              <select
                value={form.instrument}
                onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="">Select...</option>
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              {errors.instrument && (
                <p className="text-xs text-red-400 mt-1">{errors.instrument}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hedge Type</label>
              <select
                value={form.hedgeType}
                onChange={(e) => setForm((f) => ({ ...f, hedgeType: e.target.value as HedgeType }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                {HEDGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as HedgeStatus }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Settled">Settled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Entity Currency</label>
              <select
                value={form.entityCurrency}
                onChange={(e) => setForm((f) => ({ ...f, entityCurrency: e.target.value }))}
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
              <label className="block text-xs text-slate-400 mb-1">Hedged Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
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
              <label className="block text-xs text-slate-400 mb-1">Notional</label>
              <input
                type="number"
                value={form.notionalAmount}
                onChange={(e) => setForm((f) => ({ ...f, notionalAmount: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                placeholder="0"
              />
              {errors.notionalAmount && (
                <p className="text-xs text-red-400 mt-1">{errors.notionalAmount}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contracted Rate</label>
              <input
                type="number"
                step="any"
                value={form.contractedRate}
                onChange={(e) => setForm((f) => ({ ...f, contractedRate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                placeholder="0.0000"
              />
              {errors.contractedRate && (
                <p className="text-xs text-red-400 mt-1">{errors.contractedRate}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Rate</label>
              <input
                type="number"
                step="any"
                value={form.currentRate}
                onChange={(e) => setForm((f) => ({ ...f, currentRate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                placeholder="0.0000"
              />
              {errors.currentRate && (
                <p className="text-xs text-red-400 mt-1">{errors.currentRate}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Maturity</label>
              <input
                type="date"
                value={form.maturityDate}
                onChange={(e) => setForm((f) => ({ ...f, maturityDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              />
              {errors.maturityDate && (
                <p className="text-xs text-red-400 mt-1">{errors.maturityDate}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? 'Save' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Delete Position</h2>
          <p className="text-slate-400">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) {
                  setHedges((p) => p.filter((h) => h.id !== deleteId));
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
