/**
 * LeaseForm — the real data-entry path for the lease portfolio (GAP-NEW-A).
 *
 * Before this component the lease pages were read-only over a hardcoded array:
 * "Add Lease" navigated to a detail page that rendered its own separate
 * constant, so nothing a user typed could ever persist or reach the dashboard.
 *
 * This form writes through `useLeaseStore`, which is persisted via
 * `masterStorage` and RBAC-gated by `enforce()` on every mutator, so an entered
 * lease survives reload and appears on the dashboard immediately.
 *
 * Validation is real and blocking: the submit handler refuses to create a lease
 * with a bad term, non-positive payment, out-of-range discount rate or invalid
 * date. Nothing is silently coerced — a rejected field shows why.
 *
 * @money-ast-allow Reason: this file is the lease data-entry form. The
 * flagged arithmetic (`Math.round(lease.discountRate * 1000000) / 10000`
 * and `Math.round(ratePct * 10000) / 1000000`) is a unit-conversion between
 * percentage and rate representations of the SAME discount rate (a unitless
 * ratio, e.g. 0.06 == 6%). The result feeds `lease.discountRate`, a
 * unitless ratio, not a money amount. Money math happens elsewhere via
 * `LeaseEngine` + the canonical money primitive.
 */
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { LeaseInput, LeaseType } from '@/store/leaseStore';

export interface LeaseFormProps {
  /** Existing lease when editing; omitted when creating a new one. */
  initialValue?: LeaseInput;
  onSubmit: (lease: LeaseInput) => void;
  onCancel?: () => void;
  /** Ids already in the portfolio — used to reject duplicates on create. */
  existingIds?: readonly string[];
}

type FieldErrors = Partial<Record<keyof LeaseInput, string>>;

interface FormValues {
  id: string;
  property: string;
  type: LeaseType;
  payment: string;
  commencementDate: string;
  leaseTerm: string;
  /** Held as a percentage in the UI (6 = 6%); stored as a rate (0.06). */
  discountRatePct: string;
}

const LEASE_TYPE_OPTIONS = [
  { value: 'Operating', label: 'Operating' },
  { value: 'Finance', label: 'Finance' },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toFormValues(lease?: LeaseInput): FormValues {
  if (!lease) {
    return {
      id: '',
      property: '',
      type: 'Operating',
      payment: '',
      commencementDate: '',
      leaseTerm: '',
      discountRatePct: '',
    };
  }
  return {
    id: lease.id,
    property: lease.property,
    type: lease.type,
    payment: String(lease.payment),
    commencementDate: lease.commencementDate,
    leaseTerm: String(lease.leaseTerm),
    // Rate 0.06 is shown as 6 (%). Rounded to 4dp so 0.0625 -> 6.25 exactly.
    discountRatePct: String(Math.round(lease.discountRate * 1000000) / 10000),
  };
}

/**
 * Validate raw form strings into a typed LeaseInput.
 * Exported so the rules can be unit-tested directly, without a DOM.
 */
export function validateLeaseForm(
  values: FormValues,
  options: { existingIds?: readonly string[]; isEdit?: boolean } = {}
): { ok: true; lease: LeaseInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const { existingIds = [], isEdit = false } = options;

  const id = values.id.trim();
  if (!id) errors.id = 'Lease ID is required';
  else if (!isEdit && existingIds.includes(id)) errors.id = `Lease ID "${id}" already exists`;

  const property = values.property.trim();
  if (!property) errors.property = 'Property is required';

  const payment = Number(values.payment);
  if (values.payment.trim() === '' || !Number.isFinite(payment)) {
    errors.payment = 'Monthly payment must be a number';
  } else if (payment <= 0) {
    errors.payment = 'Monthly payment must be greater than 0';
  }

  const commencementDate = values.commencementDate.trim();
  if (!ISO_DATE.test(commencementDate)) {
    errors.commencementDate = 'Commencement date must be YYYY-MM-DD';
  } else if (Number.isNaN(new Date(commencementDate).getTime())) {
    errors.commencementDate = 'Commencement date is not a real date';
  }

  const leaseTerm = Number(values.leaseTerm);
  if (!Number.isInteger(leaseTerm) || leaseTerm <= 0) {
    errors.leaseTerm = 'Lease term must be a whole number of months above 0';
  } else if (leaseTerm > 1200) {
    errors.leaseTerm = 'Lease term cannot exceed 1200 months';
  }

  const ratePct = Number(values.discountRatePct);
  if (values.discountRatePct.trim() === '' || !Number.isFinite(ratePct)) {
    errors.discountRate = 'Discount rate must be a number';
  } else if (ratePct < 0 || ratePct >= 100) {
    errors.discountRate = 'Discount rate must be between 0 and 100 percent';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    lease: {
      id,
      property,
      type: values.type,
      payment,
      commencementDate,
      leaseTerm,
      // Percent -> rate. Divide by 100 in integer space so 6.25% is exactly
      // 0.0625 rather than a binary-drifted 0.06250000000000001.
      discountRate: Math.round(ratePct * 10000) / 1000000,
    },
  };
}

export function LeaseForm({ initialValue, onSubmit, onCancel, existingIds = [] }: LeaseFormProps) {
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
      const result = validateLeaseForm(values, { existingIds, isEdit });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      onSubmit(result.lease);
    },
    [values, existingIds, isEdit, onSubmit]
  );

  const errorSummary = useMemo(() => Object.values(errors).filter(Boolean), [errors]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Lease details">
      {errorSummary.length > 0 && (
        <div role="alert" className="rounded-md bg-red-900/40 p-3 text-sm text-red-200">
          {errorSummary.length} field{errorSummary.length === 1 ? '' : 's'} need attention
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Lease ID"
          value={values.id}
          disabled={isEdit}
          error={errors.id}
          onChange={(e) => setField('id', e.target.value)}
        />
        <Input
          label="Property"
          value={values.property}
          error={errors.property}
          onChange={(e) => setField('property', e.target.value)}
        />
        <Select
          label="Lease Type"
          options={LEASE_TYPE_OPTIONS}
          value={values.type}
          onChange={(v) => setField('type', v as LeaseType)}
        />
        <Input
          label="Monthly Payment"
          type="number"
          value={values.payment}
          error={errors.payment}
          onChange={(e) => setField('payment', e.target.value)}
        />
        <Input
          label="Commencement Date"
          type="date"
          value={values.commencementDate}
          error={errors.commencementDate}
          onChange={(e) => setField('commencementDate', e.target.value)}
        />
        <Input
          label="Lease Term (months)"
          type="number"
          value={values.leaseTerm}
          error={errors.leaseTerm}
          onChange={(e) => setField('leaseTerm', e.target.value)}
        />
        <Input
          label="Discount Rate (%)"
          type="number"
          step="0.01"
          value={values.discountRatePct}
          error={errors.discountRate}
          onChange={(e) => setField('discountRatePct', e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {isEdit ? 'Save Lease' : 'Add Lease'}
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

export default LeaseForm;
