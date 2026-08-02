/**
 * Phase 4: unit tests for the debt form's validation rules.
 *
 * `validateDebtForm` is the gate between raw user strings and a typed
 * `DebtInstrumentInput` that reaches the persisted store. It is exported so
 * the rules can be exercised directly, without a DOM, and every rejection path
 * is asserted — a validator that only gets tested on its happy path is not a
 * validator.
 */
import { describe, it, expect } from 'vitest';
import { validateDebtForm } from './DebtForm';

const valid = {
  id: 'DEBT-X1',
  name: 'Expansion Term Loan',
  lender: 'First National',
  displayType: 'Term Loan',
  status: 'current' as const,
  principal: '1500000',
  ratePct: '5.5',
  termMonths: '60',
  startDate: '2026-01-01',
  type: 'term_loan' as const,
  amortizationType: 'fully_amortizing' as const,
};

describe('validateDebtForm (Phase 4)', () => {
  it('accepts a well-formed instrument and converts the percentage to a rate', () => {
    const result = validateDebtForm(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.instrument).toEqual({
      id: 'DEBT-X1',
      name: 'Expansion Term Loan',
      lender: 'First National',
      displayType: 'Term Loan',
      status: 'current',
      principal: 1500000,
      rate: 0.055,
      termMonths: 60,
      startDate: '2026-01-01',
      type: 'term_loan',
      paymentFrequency: 'monthly',
      amortizationType: 'fully_amortizing',
    });
  });

  it('converts a fractional percentage to an exact rate', () => {
    // 6.25% must be exactly 0.0625 — the integer-space conversion avoids
    // binary-drifted percentages (8.33 / 100 is 0.08330000000000001).
    const result = validateDebtForm({ ...valid, ratePct: '6.25' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.instrument.rate).toBe(0.0625);
  });

  it('rejects a missing instrument id', () => {
    const result = validateDebtForm({ ...valid, id: '  ' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.id).toBe('Instrument ID is required');
  });

  it('rejects a duplicate id on create', () => {
    const result = validateDebtForm(valid, { existingIds: ['DEBT-X1'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.id).toMatch(/already exists/);
  });

  it('allows the duplicate id on edit', () => {
    const result = validateDebtForm(valid, { existingIds: ['DEBT-X1'], isEdit: true });
    expect(result.ok).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = validateDebtForm({ ...valid, name: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBe('Name is required');
  });

  it('rejects a missing lender', () => {
    const result = validateDebtForm({ ...valid, lender: '  ' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.lender).toBe('Lender is required');
  });

  it('rejects a missing display type label', () => {
    const result = validateDebtForm({ ...valid, displayType: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.displayType).toBe('Instrument type label is required');
  });

  it('rejects a non-numeric principal', () => {
    const result = validateDebtForm({ ...valid, principal: 'abc' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.principal).toBe('Principal must be a number');
  });

  it('rejects a non-positive principal', () => {
    const result = validateDebtForm({ ...valid, principal: '0' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.principal).toBe('Principal must be greater than 0');
  });

  it('rejects a non-numeric rate', () => {
    const result = validateDebtForm({ ...valid, ratePct: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.rate).toBe('Interest rate must be a number');
  });

  it('rejects a negative or >=100 rate', () => {
    const neg = validateDebtForm({ ...valid, ratePct: '-1' });
    expect(neg.ok).toBe(false);
    if (neg.ok) return;
    expect(neg.errors.rate).toBe('Interest rate must be between 0 and 100 percent');

    const over = validateDebtForm({ ...valid, ratePct: '100' });
    expect(over.ok).toBe(false);
    if (over.ok) return;
    expect(over.errors.rate).toBe('Interest rate must be between 0 and 100 percent');
  });

  it('rejects a zero rate as valid but accepts a 0% instrument', () => {
    const zero = validateDebtForm({ ...valid, ratePct: '0' });
    expect(zero.ok).toBe(true);
  });

  it('rejects a non-whole or zero term', () => {
    const frac = validateDebtForm({ ...valid, termMonths: '12.5' });
    expect(frac.ok).toBe(false);
    if (frac.ok) return;
    expect(frac.errors.termMonths).toBe('Term must be a whole number of months above 0');

    const zero = validateDebtForm({ ...valid, termMonths: '0' });
    expect(zero.ok).toBe(false);
  });

  it('rejects a term above 1200 months', () => {
    const result = validateDebtForm({ ...valid, termMonths: '1201' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.termMonths).toBe('Term cannot exceed 1200 months');
  });

  it('rejects a malformed start date', () => {
    const result = validateDebtForm({ ...valid, startDate: '01/15/2026' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.startDate).toBe('Start date must be YYYY-MM-DD');
  });

  it('rejects an unreal date like 2026-02-31', () => {
    const result = validateDebtForm({ ...valid, startDate: '2026-02-31' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.startDate).toBe('Start date is not a real date');
  });

  it('accumulates every error at once (nothing silently coerced)', () => {
    const result = validateDebtForm({
      id: '',
      name: '',
      lender: '',
      displayType: '',
      status: 'current',
      principal: '-5',
      ratePct: '150',
      termMonths: '0',
      startDate: 'nope',
      type: 'term_loan',
      amortizationType: 'fully_amortizing',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      'displayType',
      'id',
      'lender',
      'name',
      'principal',
      'rate',
      'startDate',
      'termMonths',
    ]);
  });
});
