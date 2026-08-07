/**
 * DataMaskingEngine.ext.test.ts — role-based masking known answers
 * (MISSION D wave 2, 2026-08-07). Sensitive-data hygiene per the security
 * spec: privileged roles see raw values, everyone else gets patterns with
 * only the allowed tail visible.
 */
import { describe, expect, it } from 'vitest';
import { DataMaskingEngine, type MaskingRule } from './DataMaskingEngine';

describe('DataMaskingEngine — defaults', () => {
  const e = new DataMaskingEngine();

  it('privileged roles see unmasked values', () => {
    expect(e.mask('123-45-6789', 'ssn', 'admin').masked).toBe(false);
    expect(e.mask(120000, 'salary', 'finance').value).toBe('120000');
    expect(e.mask('a@b.com', 'email', 'admin').masked).toBe(false);
  });

  it('unprivileged roles get masked values', () => {
    const ssn = e.mask('123-45-6789', 'ssn', 'analyst');
    expect(ssn.masked).toBe(true);
    expect(ssn.value).toBe('XXX-XX-6789'); // pattern + last 4

    const salary = e.mask(120000, 'salary', 'analyst');
    expect(salary.masked).toBe(true);
    expect(salary.value).toBe('$***,***');

    const email = e.mask('alice@example.com', 'email', 'analyst');
    expect(email.value).toBe('***@***.***');

    const phone = e.mask('(555) 123-4567', 'phone', 'analyst');
    expect(phone.value).toBe('(***) ***-4567');

    const acct = e.mask('123456789', 'account_number', 'analyst');
    expect(acct.value).toBe('****6789');

    const cc = e.mask('4111111111111111', 'credit_card', 'analyst');
    expect(cc.value).toBe('**** **** **** 1111');
  });

  it('short values mask fully without showing the tail', () => {
    const ssn = e.mask('1234', 'ssn', 'analyst');
    expect(ssn.value).toBe('XXX-XX-'); // length <= showLast → pattern only
    expect(e.mask('', 'ssn', 'analyst')).toEqual({ masked: true, value: '', originalType: 'ssn' });
  });

  it('unknown field types pass through unmasked', () => {
    const r = e.mask('whatever', 'custom', 'analyst');
    expect(r.masked).toBe(false);
    expect(r.value).toBe('whatever');
  });

  it('convenience wrappers delegate', () => {
    expect(e.maskSSN('123-45-6789', 'admin').masked).toBe(false);
    expect(e.maskSalary(80000, 'hr').masked).toBe(false);
    expect(e.maskEmail('x@y.z', 'hr').masked).toBe(true);
    expect(e.maskPhone('555-0100', 'hr').masked).toBe(true);
  });

  it('maskObject applies per-field types and passes others through', () => {
    const out = e.maskObject(
      { ssn: '123-45-6789', name: 'Alice', salary: 90000 },
      { ssn: 'ssn', salary: 'salary' },
      'analyst'
    );
    expect((out.ssn as { value: string }).value).toBe('XXX-XX-6789');
    expect((out.salary as { value: string }).value).toBe('$***,***');
    expect(out.name).toBe('Alice');
  });
});

describe('DataMaskingEngine — rule management', () => {
  it('addRule upserts by id', () => {
    const e = new DataMaskingEngine([]);
    const rule: MaskingRule = {
      id: 'r1',
      fieldType: 'custom',
      roles: ['admin'],
      maskPattern: 'REDACTED',
      showLast: 0,
      enabled: true,
    };
    e.addRule(rule);
    expect(e.getRules()).toHaveLength(1);
    e.addRule({ ...rule, maskPattern: 'REDACTED2' });
    expect(e.getRules()).toHaveLength(1);
    expect(e.getRule('custom')!.maskPattern).toBe('REDACTED2');
  });

  it('removeRule and getRule', () => {
    const e = new DataMaskingEngine();
    expect(e.removeRule('nope')).toBe(false);
    expect(e.removeRule('ssn')).toBe(true);
    expect(e.getRule('ssn')).toBeUndefined();
    expect(e.getRules().length).toBe(5);
  });

  it('disabled rules never mask', () => {
    const e = new DataMaskingEngine([
      { id: 'off', fieldType: 'ssn', roles: [], maskPattern: 'X', showLast: 0, enabled: false },
    ]);
    expect(e.mask('123', 'ssn', 'anyone').masked).toBe(false);
  });

  it('serialize / deserialize round-trips rules', () => {
    const e = new DataMaskingEngine();
    const json = e.serialize();
    const e2 = new DataMaskingEngine([]);
    e2.deserialize(json);
    expect(e2.getRules()).toHaveLength(6);
    expect(e2.mask('123-45-6789', 'ssn', 'analyst').value).toBe('XXX-XX-6789');
  });
});
