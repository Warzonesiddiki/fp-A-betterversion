/**
 * DebtForm — the real data-entry path for the debt portfolio (GAP-1 follow-up /
 * Phase 4, mirroring the GAP-NEW-A LeaseForm pattern).
 *
 * Before this component the DebtSchedulePage was read-only over the store's
 * seed portfolio: nothing a user typed could persist. This form writes through
 * `useDebtStore`, which is persisted via `masterStorage` and RBAC-gated by
 * `enforce()` on every mutator (addInstrument/updateInstrument/removeInstrument),
 * so an entered instrument survives reload and appears on the dashboard
 * immediately with a schedule computed by the real DebtScheduleEngine.
 *
 * Validation is real and blocking: the submit handler refuses to create an
 * instrument with a bad principal, non-positive rate, out-of-range rate,
 * non-whole/oversized term or invalid date. Nothing is silently coerced — a
 * rejected field shows why.
 */
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { AmortizationType, DebtInstrumentInput, DebtType } from '@/store/debtStore';

export interface DebtFormProps {
  /** Existing instrument when editing; omitted when creating a new one. */
  initialValue?: DebtInstrumentInput;
  onSubmit: (instrument: DebtInstrumentInput) => void;
  onCancel?: () => void;
  /** Ids already in the portfolio — used to reject duplicates on create. */
  existingIds?: readonly string[];
}

type FieldErrors = Partial<Record<keyof DebtInstrumentInput, string>>;

interface FormValues {
  id: string;
  name: string;
  lender: string;
  displayType: string;
  status: DebtInstrumentInput['status'];
  principal: string;
  /** Held as a percentage in the UI (6 = 6%); stored as a rate (0.06). */
  ratePct: string;
  termMonths: string;
  startDate: string;
  type: DebtType;
  amortizationType: AmortizationType;
}

const STATUS_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'watch', label: 'Watch' },
  { value: 'past_due', label: 'Past Due' },
];

const TYPE_OPTIONS = [
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'revolver', label: 'Revolver' },
  { value: 'bond', label: 'Bond' },
];

const AMORTIZATION_OPTIONS = [
  { value: 'fully_amortizing', label: 'Fully Amortizing' },
  { value: 'interest_only', label: 'Interest Only' },
  { value: 'bullet', label: 'Bullet' },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toFormValues(instrument?: DebtInstrumentInput): FormValues {
  if (!instrument) {
    return {
      id: '',
      name: '',
      lender: '',
      displayType: '',
      status: 'current',
      principal: '',
      ratePct: '',
      termMonths: '',
      startDate: '',
      type: 'term_loan',
      amortizationType: 'fully_amortizing',
    };
  }
  return {
    id: instrument.id,
    name: instrument.name,
    lender: instrument.lender,
    displayType: instrument.displayType,
    status: instrument.status,
    principal: String(instrument.principal),
    // Rate 0.06 is shown as 6 (%). Rounded to 4dp so 0.0625 -> 6.25 exactly.
    ratePct: String(Math.round(instrument.rate * 1000000) / 10000),
    termMonths: String(instrument.termMonths),
    startDate: instrument.startDate,
    type: instrument.type,
    amortizationType: instrument.amortizationType,
  };
}

/**
 * Validate raw form strings into a typed DebtInstrumentInput.
 * Exported so the rules can be unit-tested directly, without a DOM.
 */
export function validateDebtForm(
  values: FormValues,
  options: { existingIds?: readonly string[]; isEdit?: boolean } = {}
): { ok: true; instrument: DebtInstrumentInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const { existingIds = [], isEdit = false } = options;

  const id = values.id.trim();
  if (!id) errors.id = 'Instrument ID is required';
  else if (!isEdit && existingIds.includes(id)) errors.id = `Instrument ID "${id}" already exists`;

  const name = values.name.trim();
  if (!name) errors.name = 'Name is required';

  const lender = values.lender.trim();
  if (!lender) errors.lender = 'Lender is required';

  const displayType = values.displayType.trim();
  if (!displayType) errors.displayType = 'Instrument type label is required';

  const principal = Number(values.principal);
  if (values.principal.trim() === '' || !Number.isFinite(principal)) {
    errors.principal = 'Principal must be a number';
  } else if (principal <= 0) {
    errors.principal = 'Principal must be greater than 0';
  }

  const ratePct = Number(values.ratePct);
  if (values.ratePct.trim() === '' || !Number.isFinite(ratePct)) {
    errors.rate = 'Interest rate must be a number';
  } else if (ratePct < 0 || ratePct >= 100) {
    errors.rate = 'Interest rate must be between 0 and 100 percent';
  }

  const termMonths = Number(values.termMonths);
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    errors.termMonths = 'Term must be a whole number of months above 0';
  } else if (termMonths > 1200) {
    errors.termMonths = 'Term cannot exceed 1200 months';
  }

  const startDate = values.startDate.trim();
  if (!ISO_DATE.test(startDate)) {
    errors.startDate = 'Start date must be YYYY-MM-DD';
  } else {
    // Round-trip check: Date.UTC rolls overflow days/months over (2026-02-31
    // becomes Mar 3, 2026-02-29 becomes Mar 1), so verify every component
    // survived exactly — an unreal date is rejected, not silently coerced.
    const [y, m, d] = startDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d!));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m! - 1 || dt.getUTCDate() !== d) {
      errors.startDate = 'Start date is not a real date';
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    instrument: {
      id,
      name,
      lender,
      displayType,
      status: values.status,
      principal,
      // Percent -> rate. Divide by 100 in integer space so 6.25% is exactly
      // 0.0625 rather than a binary-drifted 0.06250000000000001.
      rate: Math.round(ratePct * 10000) / 1000000,
      termMonths,
      startDate,
      type: values.type,
      paymentFrequency: 'monthly',
      amortizationType: values.amortizationType,
    },
  };
}

export function DebtForm({ initialValue, onSubmit, onCancel, existingIds = [] }: DebtFormProps) {
  const isEdit = initialValue !== undefined;
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialValue));
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const result = validateDebtForm(values, { existingIds, isEdit });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      onSubmit(result.instrument);
    },
    [values, existingIds, isEdit, onSubmit]
  );

  const errorSummary = useMemo(() => Object.values(errors).filter(Boolean), [errors]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Debt instrument details">
      {errorSummary.length > 0 && (
        <div role="alert" className="rounded-md bg-red-900/40 p-3 text-sm text-red-200">
          {errorSummary.length} field{errorSummary.length === 1 ? '' : 's'} need attention
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Instrument ID"
          value={values.id}
          disabled={isEdit}
          error={errors.id}
          onChange={(e) => setField('id', e.target.value)}
        />
        <Input
          label="Name"
          value={values.name}
          error={errors.name}
          onChange={(e) => setField('name', e.target.value)}
        />
        <Input
          label="Lender"
          value={values.lender}
          error={errors.lender}
          onChange={(e) => setField('lender', e.target.value)}
        />
        <Input
          label="Instrument Type Label"
          value={values.displayType}
          error={errors.displayType}
          onChange={(e) => setField('displayType', e.target.value)}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(v) => setField('status', v as DebtInstrumentInput['status'])}
        />
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={values.type}
          onChange={(v) => setField('type', v as DebtType)}
        />
        <Select
          label="Amortization"
          options={AMORTIZATION_OPTIONS}
          value={values.amortizationType}
          onChange={(v) => setField('amortizationType', v as AmortizationType)}
        />
        <Input
          label="Principal ($)"
          type="number"
          value={values.principal}
          error={errors.principal}
          onChange={(e) => setField('principal', e.target.value)}
        />
        <Input
          label="Interest Rate (%)"
          type="number"
          step="0.01"
          value={values.ratePct}
          error={errors.rate}
          onChange={(e) => setField('ratePct', e.target.value)}
        />
        <Input
          label="Term (months)"
          type="number"
          value={values.termMonths}
          error={errors.termMonths}
          onChange={(e) => setField('termMonths', e.target.value)}
        />
        <Input
          label="Start Date"
          type="date"
          value={values.startDate}
          error={errors.startDate}
          onChange={(e) => setField('startDate', e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {isEdit ? 'Save Instrument' : 'Add Instrument'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export default DebtForm;
