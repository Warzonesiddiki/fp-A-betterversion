import { useState } from 'react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useFxRateStore } from '@/store/fxRateStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Plus, Trash2 } from 'lucide-react';
import { formatNumber } from '@/utils/financialFormatting';

// K30 four-states honesty notes:
// - Rates are read from the persisted fxRateStore. This page previously seeded
//   a hardcoded INITIAL_RATES table (USD→EUR 0.92 / USD→GBP 0.79 / USD→JPY
//   149.5) into local state and rendered it as though the user had entered it —
//   that fabrication is removed; an empty store now renders the shared
//   EmptyState instead of invented quotes.
// - Both stores are synchronous Zustand reads, so there is deliberately NO
//   loading skeleton on this page: one would fake asynchrony that does not
//   exist (same honesty test as ScenarioBuilderPage).

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

/** Which store call failed, so the ErrorState retry re-runs exactly that action. */
type FailedAction = { kind: 'add' } | { kind: 'delete'; id: string };

export default function FXRatesPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const rates = useFxRateStore((s) => s.rates);
  const addRate = useFxRateStore((s) => s.addRate);
  const deleteRate = useFxRateStore((s) => s.deleteRate);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RateForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState<FailedAction | null>(null);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const validate = (f: RateForm): Partial<Record<keyof RateForm, string>> => {
    const e: Partial<Record<keyof RateForm, string>> = {};
    if (!f.rate || isNaN(Number(f.rate)) || Number(f.rate) <= 0)
      e.rate = 'Rate must be a positive number';
    if (f.fromCurrency === f.toCurrency) e.toCurrency = 'Currencies must differ';
    if (rates.some((r) => r.fromCurrency === f.fromCurrency && r.toCurrency === f.toCurrency))
      e.toCurrency = 'This currency pair already exists';
    if (!f.effectiveDate) e.effectiveDate = 'Date is required';
    return e;
  };

  const handleAdd = () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      addRate({
        id: Date.now().toString(),
        fromCurrency: form.fromCurrency,
        toCurrency: form.toCurrency,
        rate: Number(form.rate),
        effectiveDate: form.effectiveDate,
        source: 'manual',
      });
      setActionError(null);
      setFailedAction(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      // K30 four-states: store rejection (RBAC deny / persistence failure)
      // surfaces as an ErrorState inside the form whose Retry re-runs this
      // exact add against the same form values.
      setActionError(err instanceof Error ? err.message : 'Failed to save the exchange rate');
      setFailedAction({ kind: 'add' });
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteRate(id);
      setActionError(null);
      setFailedAction(null);
      setDeleteId(null);
    } catch (err) {
      setDeleteId(null);
      setActionError(err instanceof Error ? err.message : 'Failed to delete the exchange rate');
      setFailedAction({ kind: 'delete', id });
    }
  };

  // K30 four-states: the retry control re-runs exactly the failed store call.
  const retryFailedAction = () => {
    if (!failedAction) return;
    if (failedAction.kind === 'add') handleAdd();
    else handleDelete(failedAction.id);
  };

  const purposeText = `${rates.length} rate${rates.length !== 1 ? 's' : ''} configured`;

  const addAction = (
    <Button size="sm" onClick={openAddForm} data-testid="fx-add-rate">
      <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
      Add Rate
    </Button>
  );

  let body: ReactNode;
  let headerActions: ReactNode;
  if (entries.length === 0) {
    // K30 four-states — empty ledger: PageHeader stays mounted so the page h1
    // never disappears; the shared EmptyState explains why translation is
    // disabled and routes to the import flow. No demo ledger or rate table is
    // invented here.
    headerActions = null;
    body = (
      <EmptyState
        variant="no-data"
        title="No data to translate"
        description="Import General Ledger entries to enable FX translation. Exchange rates apply to posted multi-currency amounts."
        action={
          <Button onClick={() => navigate('/data/gl-upload')} data-testid="fx-empty-import">
            Import Data
          </Button>
        }
      />
    );
  } else if (rates.length === 0) {
    // K30 four-states — empty rate book: the real fxRateStore holds no rates,
    // so the honest state is an explicit EmptyState whose CTA starts rate
    // entry (this branch previously rendered three fabricated seed quotes).
    headerActions = addAction;
    body = (
      <EmptyState
        variant="no-data"
        title="No exchange rates configured"
        description="Add a currency pair rate to enable multi-currency translation of posted entries."
        action={
          <Button onClick={openAddForm} data-testid="fx-empty-add">
            Add Rate
          </Button>
        }
      />
    );
  } else {
    headerActions = addAction;
    body = (
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
              {rates.map((r) => (
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
                      aria-label={`Delete ${r.fromCurrency}/${r.toCurrency} rate`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-6" aria-labelledby="fx-rates-heading">
      {/* Delete failures surface at page level; add failures render inside the
          open form modal below so they stay visible over its overlay. */}
      {actionError && failedAction?.kind === 'delete' && (
        <ErrorState
          title="Could not delete exchange rate"
          message={actionError}
          onRetry={retryFailedAction}
          retryLabel="Retry delete"
          className="py-8"
        />
      )}
      <PageHeader
        title="FX Rates"
        titleId="fx-rates-heading"
        purpose={purposeText}
        actions={headerActions}
      />

      {body}

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
          {showForm && actionError && failedAction?.kind === 'add' && (
            <ErrorState
              title="Could not add exchange rate"
              message={actionError}
              onRetry={retryFailedAction}
              retryLabel="Retry add"
              className="py-4"
            />
          )}
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
