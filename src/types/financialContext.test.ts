import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FINANCIAL_CONTEXT,
  financialContextFromParams,
  financialContextsEqual,
  financialContextToParams,
  mergeFinancialContext,
  serializeFinancialContext,
} from './financialContext';

describe('financialContext serialization', () => {
  it('serializes a full context deterministically in fixed order', () => {
    const ctx = {
      ...DEFAULT_FINANCIAL_CONTEXT,
      scope: { entityIds: ['ent-1', 'ent-2'], label: 'ent-1, ent-2' },
      period: { start: '2026-01', end: '2026-03', calendar: 'fiscal' as const },
      version: { id: 'v-2026', label: '2026 Plan', lifecycle: 'draft' as const },
      currency: { code: 'EUR' },
    };
    expect(serializeFinancialContext(ctx)).toBe(
      'entity=ent-1%2Cent-2&period=2026-01..2026-03&version=v-2026&currency=EUR'
    );
  });

  it('round-trips through URLSearchParams', () => {
    const ctx = {
      ...DEFAULT_FINANCIAL_CONTEXT,
      scope: { entityIds: ['ent-3'], label: 'ent-3' },
      period: { start: '2026-07', end: '2026-09', calendar: 'fiscal' as const },
      currency: { code: 'GBP' },
    };
    const params = financialContextToParams(ctx);
    const parsed = financialContextFromParams(params);
    expect(mergeFinancialContext(DEFAULT_FINANCIAL_CONTEXT, parsed)).toEqual({
      ...ctx,
      freshness: 'unknown',
      source: 'local-draft',
    });
  });

  it('ignores invalid period and currency values', () => {
    const params = new URLSearchParams(
      'entity=ent-1&period=2026-13..bad&version=v1&currency=usd&unknown=1'
    );
    const parsed = financialContextFromParams(params);
    expect(parsed.scope).toEqual({ entityIds: ['ent-1'], label: 'ent-1' });
    expect(parsed.version).toEqual({ id: 'v1', label: 'v1', lifecycle: 'draft' });
    expect(parsed.period).toBeUndefined();
    expect(parsed.currency).toBeUndefined();
  });

  it('returns empty patch for empty params', () => {
    expect(financialContextFromParams(new URLSearchParams(''))).toEqual({});
  });

  it('does not serialize freshness (ephemeral runtime state)', () => {
    const ctx = { ...DEFAULT_FINANCIAL_CONTEXT, freshness: 'stale' as const };
    expect(serializeFinancialContext(ctx)).not.toContain('freshness');
  });

  it('compares equality including freshness and source', () => {
    const a = { ...DEFAULT_FINANCIAL_CONTEXT };
    const b = { ...DEFAULT_FINANCIAL_CONTEXT };
    expect(financialContextsEqual(a, b)).toBe(true);
    expect(financialContextsEqual(a, { ...b, freshness: 'stale' })).toBe(false);
    expect(financialContextsEqual(a, { ...b, source: 'server' })).toBe(false);
  });
});
