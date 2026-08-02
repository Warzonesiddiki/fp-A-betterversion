/**
 * GAP-NEW-A: unit tests for the lease form's validation rules.
 *
 * `validateLeaseForm` is the gate between raw user strings and a typed
 * `LeaseInput` that reaches the persisted store. It is exported so the rules can
 * be exercised directly, without a DOM, and every rejection path is asserted —
 * a validator that only gets tested on its happy path is not a validator.
 */
import { describe, it, expect } from 'vitest';
import { validateLeaseForm } from './LeaseForm';

const valid = {
  id: 'L-1',
  property: 'Test Office',
  type: 'Operating' as const,
  payment: '1000',
  commencementDate: '2026-01-01',
  leaseTerm: '12',
  discountRatePct: '5',
};

describe('validateLeaseForm (GAP-NEW-A)', () => {
  it('accepts a well-formed lease and converts the percentage to a rate', () => {
    const result = validateLeaseForm(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lease).toEqual({
      id: 'L-1',
      property: 'Test Office',
      type: 'Operating',
      payment: 1000,
      commencementDate: '2026-01-01',
      leaseTerm: 12,
      discountRate: 0.05,
    });
  });

  it('converts a fractional percentage to an exact rate', () => {
    // 6.25% must be exactly 0.0625. Naive `6.25 / 100` is 0.0625 here, but
    // 8.33 / 100 is 0.08330000000000001 — the integer-space conversion avoids it.
    const a = validateLeaseForm({ ...valid, discountRatePct: '6.25' });
    const b = validateLeaseForm({ ...valid, discountRatePct: '8.33' });
    expect(a.ok && a.lease.discountRate).toBe(0.0625);
    expect(b.ok && b.lease.discountRate).toBe(0.0833);
  });

  it('trims surrounding whitespace on text fields', () => {
    const result = validateLeaseForm({ ...valid, id: '  L-2  ', property: '  Padded  ' });
    expect(result.ok && result.lease.id).toBe('L-2');
    expect(result.ok && result.lease.property).toBe('Padded');
  });

  it('rejects a missing id', () => {
    const result = validateLeaseForm({ ...valid, id: '   ' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.id).toMatch(/required/i);
  });

  it('rejects a duplicate id on create but allows it on edit', () => {
    const onCreate = validateLeaseForm(valid, { existingIds: ['L-1'] });
    expect(onCreate.ok).toBe(false);
    if (!onCreate.ok) expect(onCreate.errors.id).toMatch(/already exists/i);

    const onEdit = validateLeaseForm(valid, { existingIds: ['L-1'], isEdit: true });
    expect(onEdit.ok).toBe(true);
  });

  it('rejects a missing property', () => {
    const result = validateLeaseForm({ ...valid, property: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.property).toMatch(/required/i);
  });

  it.each([
    ['zero', '0'],
    ['negative', '-500'],
  ])('rejects a %s payment', (_label, payment) => {
    const result = validateLeaseForm({ ...valid, payment });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.payment).toMatch(/greater than 0/i);
  });

  it('rejects a non-numeric payment rather than coercing it to NaN', () => {
    const result = validateLeaseForm({ ...valid, payment: 'abc' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.payment).toMatch(/must be a number/i);
  });

  it('rejects a malformed commencement date', () => {
    const result = validateLeaseForm({ ...valid, commencementDate: '01/01/2026' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.commencementDate).toMatch(/YYYY-MM-DD/);
  });

  it('rejects a well-formatted but impossible date', () => {
    const result = validateLeaseForm({ ...valid, commencementDate: '2026-13-45' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.commencementDate).toBeTruthy();
  });

  it.each([
    ['zero', '0'],
    ['negative', '-12'],
    ['fractional', '12.5'],
  ])('rejects a %s lease term', (_label, leaseTerm) => {
    const result = validateLeaseForm({ ...valid, leaseTerm });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.leaseTerm).toMatch(/whole number/i);
  });

  it('rejects an absurdly long lease term', () => {
    const result = validateLeaseForm({ ...valid, leaseTerm: '5000' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.leaseTerm).toMatch(/cannot exceed/i);
  });

  it.each([
    ['negative', '-1'],
    ['100 or above', '100'],
    ['absurd', '250'],
  ])('rejects a %s discount rate', (_label, discountRatePct) => {
    const result = validateLeaseForm({ ...valid, discountRatePct });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.discountRate).toMatch(/between 0 and 100/i);
  });

  it('accepts a zero discount rate (undiscounted lease)', () => {
    const result = validateLeaseForm({ ...valid, discountRatePct: '0' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lease.discountRate).toBe(0);
  });

  it('reports every invalid field at once rather than stopping at the first', () => {
    const result = validateLeaseForm({
      ...valid,
      id: '',
      property: '',
      payment: '-1',
      leaseTerm: '0',
      discountRatePct: '500',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      'discountRate',
      'id',
      'leaseTerm',
      'payment',
      'property',
    ]);
  });
});
