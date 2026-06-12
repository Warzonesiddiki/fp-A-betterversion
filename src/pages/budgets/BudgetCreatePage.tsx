/* eslint-disable jsx-a11y/label-has-associated-control */
import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeft, ArrowRight, Check, DollarSign } from 'lucide-react';

export default function BudgetCreatePage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Budget Create';
  }, []);

  const navigate = useNavigate();
  const { createBudget } = useBudgetStore();
  const { accounts } = useGLStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    fiscalYear: new Date().getFullYear(),
    baseCurrency: 'USD',
    description: '',
    budgetMethod: 'incremental' as 'incremental' | 'zero-based',
  });
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalAmount = useMemo(() => {
    let total = 0;
    for (const key of Object.keys(amounts)) {
      total += amounts[key] || 0;
    }
    return total;
  }, [amounts]);

  const _accountOptions = useMemo(
    () => [...accounts.map((a) => ({ value: a.id, label: a.code + ' — ' + a.name }))],
    [accounts]
  );

  const steps = useMemo(
    () => [
      {
        label: 'Details',
        status: (step > 0 ? 'done' : step === 0 ? 'current' : 'pending') as
          | 'done'
          | 'current'
          | 'pending',
        description: 'Budget info',
      },
      {
        label: 'Accounts',
        status: (step > 1 ? 'done' : step === 1 ? 'current' : 'pending') as
          | 'done'
          | 'current'
          | 'pending',
        description: 'Select accounts',
      },
      {
        label: 'Amounts',
        status: (step > 2 ? 'done' : step === 2 ? 'current' : 'pending') as
          | 'done'
          | 'current'
          | 'pending',
        description: 'Set amounts',
      },
      {
        label: 'Review',
        status: (step > 3 ? 'done' : step === 3 ? 'current' : 'pending') as
          | 'done'
          | 'current'
          | 'pending',
        description: 'Confirm & create',
      },
    ],
    [step]
  );

  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    if (s === 0) {
      if (!form.name || form.name.length < 2) errors.name = 'Name must be at least 2 characters';
    }
    if (s === 1) {
      if (selectedAccountIds.length === 0) errors.accounts = 'Select at least one account';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };

  const handleCreate = (status: 'Draft' | 'InReview') => {
    setSubmitError(null);
    if (totalAmount === 0 && !window.confirm('Total amount is $0. Create budget anyway?')) return;
    try {
      const budgetId = createBudget({
        name: form.name,
        fiscalYear: form.fiscalYear,
        baseCurrency: form.baseCurrency,
        description: form.description,
        departments: [],
        entities: ['default'],
        status,
        template: 'Standard',
        totalAmount,
        createdByName: 'Current User',
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        version: 1,
        progress: 0,
      });
      navigate('/budgets/' + budgetId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create budget');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">No Accounts Defined</h2>
        <p className="text-slate-400 mb-6">
          Create your Chart of Accounts first before creating budgets.
        </p>
        <Button onClick={() => navigate('/data/chart-of-accounts')}>Set Up Accounts</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Create Budget</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Set up a new budget for planning and tracking
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/budgets')}>
          Cancel
        </Button>
      </div>

      <ProgressStepper steps={steps} currentStep={step} />

      {step === 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Budget Details</h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Budget Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. FY2025 Annual Operating Budget"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fiscal Year</label>
              <Input
                type="number"
                value={form.fiscalYear}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fiscalYear: parseInt(e.target.value) || new Date().getFullYear(),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Base Currency</label>
              <Select
                options={[{ value: 'USD', label: 'USD — US Dollar' }]}
                value={form.baseCurrency}
                onChange={(v) => setForm({ ...form, baseCurrency: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Budget Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, budgetMethod: 'incremental' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    form.budgetMethod === 'incremental'
                      ? 'bg-blue-900/30 border-blue-600 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium">Incremental</div>
                  <div className="text-xs opacity-70">Build on prior year actuals</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, budgetMethod: 'zero-based' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    form.budgetMethod === 'zero-based'
                      ? 'bg-emerald-900/30 border-emerald-600 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium">Zero-Based</div>
                  <div className="text-xs opacity-70">Justify every dollar from $0</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Description (optional)
              </label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this budget..."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Select Accounts</h3>
            <p className="text-sm text-slate-400">Choose the accounts to include in this budget.</p>
            {formErrors.accounts && (
              <Alert type="error" title="Validation Error" message={formErrors.accounts} />
            )}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {accounts.map((a) => {
                const selected = selectedAccountIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ' +
                      (selected
                        ? 'bg-blue-900/30 border border-blue-800/50'
                        : 'hover:bg-slate-800/50 border border-transparent')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setSelectedAccountIds((prev) =>
                          prev.includes(a.id) ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                        )
                      }
                      className="rounded"
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {a.code} — {a.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.type} · {a.category}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={selectedAccountIds.length === 0}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Set Amounts</h3>
            <p className="text-sm text-slate-400">
              Enter monthly amounts for each selected account.
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedAccountIds.map((id) => {
                const account = accounts.find((a) => a.id === id);
                return (
                  <div key={id} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-sm font-medium mb-2">
                      {account?.code} — {account?.name}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 12 }, (_, m) => {
                        const key = id + '-' + m;
                        return (
                          <div key={m}>
                            <label className="text-[10px] text-slate-500 block mb-0.5">
                              {new Date(form.fiscalYear, m).toLocaleString('default', {
                                month: 'short',
                              })}
                            </label>
                            <input
                              type="number"
                              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={amounts[key] ?? ''}
                              onChange={(e) =>
                                setAmounts((prev) => ({
                                  ...prev,
                                  [key]: parseFloat(e.target.value) || 0,
                                }))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-right text-xs text-slate-400 mt-1">
                      Total:{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(
                        Array.from({ length: 12 }, (_, m) => amounts[id + '-' + m] || 0).reduce(
                          (s, v) => s + v,
                          0
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-slate-400">
              Total Budget:{' '}
              <span className="font-bold text-white">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Review & Create</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Name</span>
                <span className="font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fiscal Year</span>
                <span>{form.fiscalYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Currency</span>
                <span>{form.baseCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accounts</span>
                <span>{selectedAccountIds.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(totalAmount)}
                </span>
              </div>
            </div>
            {form.description && (
              <div className="text-sm text-slate-400 p-3 bg-slate-900 rounded">
                {form.description}
              </div>
            )}
            {submitError && <Alert type="error" title="Error" message={submitError} />}
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="secondary" onClick={() => handleCreate('Draft')}>
                <Check className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => handleCreate('InReview')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
