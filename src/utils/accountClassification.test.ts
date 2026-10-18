/**
 * Phase 2 (F-P2-01/F-P2-03) — canonical account classification + sign contract.
 *
 * One resolver decides which statement class an entry belongs to and which
 * side is its natural (positive) balance:
 *   1. the account master's type wins (owner-correctable truth);
 *   2. the documented code-prefix convention (1 Asset · 2 Liability ·
 *      3 Equity · 4 Revenue · 5 COGS · 6 OpEx · 7 Interest · 8 Tax) is the
 *      fallback for entries with no typed account;
 *   3. anything else is `unclassified` — reported, never silently dropped.
 *
 * Interest/tax are presentation subclasses of expense: an OpEx-typed account
 * whose code carries prefix 7/8 presents as interest/tax, so the P&L's net
 * income articulates with the balance sheet's current-period earnings.
 */
import { describe, expect, it } from 'vitest';
import {
  classifyByPrefix,
  classFromAccountType,
  entriesForClass,
  isDebitNormal,
  resolveAccountClass,
  signedClassAmount,
} from './accountClassification';
import { SignConventionEngine } from '@/engines/SignConventionEngine';
import type { AccountType } from '@/types';

describe('classifyByPrefix — the documented 1–8 convention', () => {
  it.each([
    ['1010', 'asset'],
    ['2010', 'liability'],
    ['3010', 'equity'],
    ['4010', 'revenue'],
    ['5010', 'cogs'],
    ['6010', 'opex'],
    ['7010', 'interest'],
    ['8010', 'tax'],
  ])('%s → %s', (code, cls) => {
    expect(classifyByPrefix(code)).toBe(cls);
  });

  it.each(['9010', '0010', '', 'abcd'])('%s → unclassified', (code) => {
    expect(classifyByPrefix(code)).toBe('unclassified');
  });

  it('missing code → unclassified', () => {
    expect(classifyByPrefix(undefined)).toBe('unclassified');
    expect(classifyByPrefix(null)).toBe('unclassified');
  });
});

describe('resolveAccountClass — account type beats code prefix', () => {
  it('a Revenue-typed account coded 1010 is revenue, not asset', () => {
    expect(resolveAccountClass({ accountCode: '1010', accountType: 'Revenue' })).toBe('revenue');
  });

  it('an Asset-typed account coded 4010 is asset, not revenue', () => {
    expect(resolveAccountClass({ accountCode: '4010', accountType: 'Asset' })).toBe('asset');
  });

  it('CapEx-typed accounts present as assets', () => {
    expect(classFromAccountType('CapEx')).toBe('asset');
    expect(resolveAccountClass({ accountCode: '6010', accountType: 'CapEx' })).toBe('asset');
  });

  it('OpEx-typed accounts with prefix 7/8 present as interest/tax', () => {
    expect(resolveAccountClass({ accountCode: '7010', accountType: 'OpEx' })).toBe('interest');
    expect(resolveAccountClass({ accountCode: '8010', accountType: 'OpEx' })).toBe('tax');
    expect(resolveAccountClass({ accountCode: '6010', accountType: 'OpEx' })).toBe('opex');
  });

  it('falls back to prefix when the type is Unknown or absent', () => {
    expect(resolveAccountClass({ accountCode: '4010', accountType: 'Unknown' })).toBe('revenue');
    expect(resolveAccountClass({ accountCode: '4010' })).toBe('revenue');
    expect(resolveAccountClass({ accountCode: '9010', accountType: 'Unknown' })).toBe(
      'unclassified'
    );
  });
});

describe('sign contract — natural balance agrees with SignConventionEngine', () => {
  const types: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'COGS', 'OpEx', 'CapEx'];
  it.each(types)('%s: classifier natural sign == engine natural sign', (type) => {
    const cls = classFromAccountType(type);
    expect(cls).not.toBeNull();
    const engineSaysDebit = SignConventionEngine.getNaturalSign(type) === 'debit';
    expect(isDebitNormal(cls!)).toBe(engineSaysDebit);
  });

  it('debit-normal classes take Dr − Cr; credit-normal take Cr − Dr', () => {
    expect(signedClassAmount({ debit: 100, credit: 30 }, 'asset').toNumber()).toBe(70);
    expect(signedClassAmount({ debit: 100, credit: 30 }, 'revenue').toNumber()).toBe(-70);
    expect(signedClassAmount({ debit: 30, credit: 100 }, 'revenue').toNumber()).toBe(70);
  });

  it('a credit-heavy expense stays negative — signs are never absolutised', () => {
    expect(signedClassAmount({ debit: 50, credit: 100 }, 'opex').toNumber()).toBe(-50);
  });
});

describe('entriesForClass — the drill/trace selector', () => {
  const entries = [
    { accountCode: '4010', debit: 0, credit: 500 },
    { accountCode: '1010', accountType: 'Revenue' as const, debit: 0, credit: 250 },
    { accountCode: '5010', debit: 100, credit: 0 },
    { accountCode: '9010', debit: 70, credit: 0 },
  ];

  it('selects exactly the entries behind a class figure', () => {
    const revenue = entriesForClass(entries, 'revenue');
    expect(revenue).toHaveLength(2);
    const traced = revenue.reduce((sum, e) => sum + signedClassAmount(e, 'revenue').toNumber(), 0);
    expect(traced).toBe(750);
  });

  it('unclassified entries are selectable and never land in a class', () => {
    expect(entriesForClass(entries, 'unclassified')).toHaveLength(1);
    expect(entriesForClass(entries, 'asset')).toHaveLength(0);
  });
});
