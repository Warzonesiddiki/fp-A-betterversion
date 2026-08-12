import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Shield, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

type HedgeStatus = 'Active' | 'Expired' | 'Settled';

interface HedgePosition {
  id: string;
  instrument: string;
  notionalAmount: number;
  contractedRate: number;
  maturityDate: string;
  status: HedgeStatus;
  currency: string;
}

const INITIAL_HEDGES: HedgePosition[] = [];

const STATUS_VARIANT: Record<HedgeStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Active: 'default',
  Expired: 'secondary',
  Settled: 'outline',
};

interface HedgeForm {
  instrument: string;
  notionalAmount: string;
  contractedRate: string;
  maturityDate: string;
  status: HedgeStatus;
  currency: string;
}

const EMPTY_FORM: HedgeForm = {
  instrument: '',
  notionalAmount: '',
  contractedRate: '',
  maturityDate: '',
  status: 'Active',
  currency: 'USD',
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
const INSTRUMENTS = [
  'Forward Contract',
  'Currency Option',
  'Cross-Currency Swap',
  'Non-Deliverable Forward',
];
export default function HedgeManagementPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [hedges, setHedges] = useState<HedgePosition[]>(INITIAL_HEDGES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HedgeForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof HedgeForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const validate = useCallback((f: HedgeForm): Partial<Record<keyof HedgeForm, string>> => {
    const e: Partial<Record<keyof HedgeForm, string>> = {};
    if (!f.instrument.trim()) e.instrument = 'Instrument is required';
    if (!f.notionalAmount || isNaN(Number(f.notionalAmount)) || Number(f.notionalAmount) <= 0)
      e.notionalAmount = 'Amount must be positive';
    if (!f.contractedRate || isNaN(Number(f.contractedRate)) || Number(f.contractedRate) <= 0)
      e.contractedRate = 'Rate must be positive';
    if (!f.maturityDate) e.maturityDate = 'Maturity date is required';
    return e;
  }, []);

  const openAdd = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((h: HedgePosition) => {
    setForm({
      instrument: h.instrument,
      notionalAmount: h.notionalAmount.toString(),
      contractedRate: h.contractedRate.toString(),
      maturityDate: h.maturityDate,
      status: h.status,
      currency: h.currency,
    });
    setErrors({});
    setEditingId(h.id);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (editingId) {
      setHedges((prev) =>
        prev.map((h) =>
          h.id === editingId
            ? {
                ...h,
                instrument: form.instrument,
                notionalAmount: Number(form.notionalAmount),
                contractedRate: Number(form.contractedRate),
                maturityDate: form.maturityDate,
                status: form.status,
                currency: form.currency,
              }
            : h
        )
      );
    } else {
      const newHedge: HedgePosition = {
        id: Date.now().toString(),
        instrument: form.instrument,
        notionalAmount: Number(form.notionalAmount),
        contractedRate: Number(form.contractedRate),
        maturityDate: form.maturityDate,
        status: form.status,
        currency: form.currency,
      };
      setHedges((prev) => [...prev, newHedge]);
    }
    setShowForm(false);
    setEditingId(null);
  }, [form, editingId, validate]);

  const handleDelete = useCallback((id: string) => {
    setHedges((prev) => prev.filter((h) => h.id !== id));
    setDeleteId(null);
  }, []);

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Shield className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-4">Import data to manage FX hedges.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hedge Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            {hedges.length} position{hedges.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Position
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" aria-label="Currency hedge positions">
            <caption className="sr-only">
              Hedge positions showing instrument, notional, strike rate, and mark-to-market value
            </caption>
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                <th scope="col" className="px-4 py-3">
                  Instrument
                </th>
                <th scope="col" className="px-4 py-3">
                  Currency
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Notional
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Rate
                </th>
                <th scope="col" className="px-4 py-3">
                  Maturity
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {hedges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No hedging positions. Add a position to track FX exposure.
                  </td>
                </tr>
              ) : (
                hedges.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">{h.instrument}</td>
                    <td className="px-4 py-3 font-mono">{h.currency}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {fmt.currency0(h.notionalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(h.contractedRate, 4)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{h.maturityDate}</td>
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
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">
            {editingId ? 'Edit Position' : 'Add Position'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="instrument" className="block text-xs text-slate-400 mb-1">
                Instrument
              </label>
              <select
                id="instrument"
                value={form.instrument}
                onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="">Select instrument...</option>
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
              <label htmlFor="currency" className="block text-xs text-slate-400 mb-1">
                Currency
              </label>
              <select
                id="currency"
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
              <label htmlFor="notional-amount" className="block text-xs text-slate-400 mb-1">
                Notional Amount
              </label>
              <input
                id="notional-amount"
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
              <label htmlFor="contracted-rate" className="block text-xs text-slate-400 mb-1">
                Contracted Rate
              </label>
              <input
                id="contracted-rate"
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
              <label htmlFor="maturity-date" className="block text-xs text-slate-400 mb-1">
                Maturity Date
              </label>
              <input
                id="maturity-date"
                type="date"
                value={form.maturityDate}
                onChange={(e) => setForm((f) => ({ ...f, maturityDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              />
              {errors.maturityDate && (
                <p className="text-xs text-red-400 mt-1">{errors.maturityDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="status" className="block text-xs text-slate-400 mb-1">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as HedgeStatus }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Settled">Settled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Position'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Delete Position</h2>
          <p className="text-slate-400">Are you sure? This cannot be undone.</p>
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
