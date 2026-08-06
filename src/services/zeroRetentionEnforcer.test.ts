/**
 * Phase 8 — Data Protection: zero-retention outbound governance.
 *
 * The enforcer is the GDPR choke point for data leaving FinPlan Pro
 * (AI copilot, ERP sync, exports): it classifies payloads, blocks
 * restricted (PII/salary) data, applies no-retention/no-training
 * headers with a bounded data-expiry, and emits an audit entry with a
 * bounded retention period (auditLogRetentionDays).
 */
import { describe, it, expect } from 'vitest';
import {
  generateZeroRetentionHeaders,
  enforcePolicy,
  classifyField,
  classifyPayload,
  redactSensitiveFields,
} from './zeroRetentionEnforcer';
import type { ZeroRetentionConfig } from '@/types/zero-retention';

describe('zeroRetentionEnforcer', () => {
  describe('generateZeroRetentionHeaders', () => {
    it('always applies no-retention and no-training directives', () => {
      const headers = generateZeroRetentionHeaders('confidential', 'user-1');
      expect(headers['X-No-Retention']).toBe('true');
      expect(headers['X-No-Training']).toBe('true');
      expect(headers['X-Data-Classification']).toBe('confidential');
      expect(headers['X-User-Id']).toBe('user-1');
      expect(headers['X-Request-Id']).toMatch(/^req-/);
    });

    it('sets a data-expiry ~24h ahead (bounded cache lifetime, not indefinite)', () => {
      const before = Date.now();
      const headers = generateZeroRetentionHeaders('internal', 'user-2');
      const expiry = new Date(headers['X-Data-Expiry']).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      expect(expiry - before).toBeGreaterThan(dayMs - 5_000);
      expect(expiry - before).toBeLessThan(dayMs + 5_000);
    });

    it('timestamps requests with valid ISO-8601 for the audit trail', () => {
      const headers = generateZeroRetentionHeaders('public', 'user-3');
      expect(Number.isNaN(Date.parse(headers['X-Request-Timestamp']))).toBe(false);
    });
  });

  describe('enforcePolicy', () => {
    it('blocks restricted (PII/salary) data from leaving the app by default', () => {
      const result = enforcePolicy('https://api.example.com', 'restricted', 128, 'u1', 'ai-query');
      expect(result.allowed).toBe(false);
      expect(result.denialReason).toMatch(/Restricted data/i);
    });

    it('allows confidential financial data with headers attached', () => {
      const result = enforcePolicy(
        'https://api.example.com',
        'confidential',
        128,
        'u1',
        'erp-sync'
      );
      expect(result.allowed).toBe(true);
      expect(result.denialReason).toBeNull();
      expect(result.headers['X-No-Retention']).toBe('true');
    });

    it('blocks payloads exceeding the configured size ceiling', () => {
      const result = enforcePolicy(
        'https://api.example.com',
        'internal',
        2 * 1024 * 1024,
        'u1',
        'export'
      );
      expect(result.allowed).toBe(false);
      expect(result.denialReason).toMatch(/exceeds maximum/i);
    });

    it('honours a config override that permits restricted data (explicit opt-out)', () => {
      const config: ZeroRetentionConfig = {
        blockRestrictedData: false,
        requireConsent: false,
        maxPayloadSizeBytes: 1024,
        auditLogRetentionDays: 30,
      };
      const result = enforcePolicy('https://x.io', 'restricted', 100, 'u1', 'legal-hold', config);
      expect(result.allowed).toBe(true);
    });

    it('emits a complete audit entry for every decision (allowed or denied)', () => {
      const result = enforcePolicy('https://x.io', 'restricted', 100, 'user-9', 'ai-query');
      const audit = result.auditEntry;
      expect(audit.id).toMatch(/^audit-/);
      expect(audit.destination).toBe('https://x.io');
      expect(audit.classification).toBe('restricted');
      expect(audit.payloadSizeBytes).toBe(100);
      expect(audit.userId).toBe('user-9');
      expect(audit.purpose).toBe('ai-query');
      expect(audit.headersApplied).toBe(true);
      expect(Number.isNaN(Date.parse(audit.timestamp))).toBe(false);
    });
  });

  describe('classifyField', () => {
    it('classifies PII fields as restricted', () => {
      expect(classifyField('employeeSSN', '123-45-6789')).toBe('restricted');
      expect(classifyField('date_of_birth_dob', '1990-01-01')).toBe('restricted');
      expect(classifyField('taxId', 'TIN-1')).toBe('restricted');
    });

    it('classifies compensation fields as restricted', () => {
      expect(classifyField('baseSalary', 120000)).toBe('restricted');
      expect(classifyField('annualBonus', 15000)).toBe('restricted');
    });

    it('classifies financial fields as confidential', () => {
      expect(classifyField('budgetAmount', 5000)).toBe('confidential');
      expect(classifyField('netRevenue', 1_000_000)).toBe('confidential');
    });

    it('classifies aggregated metrics as internal', () => {
      expect(classifyField('rowCount', 42)).toBe('internal');
      expect(classifyField('churnRate', 0.05)).toBe('internal');
    });

    it('treats short free-text as public and long text as internal', () => {
      expect(classifyField('label', 'Q3 plan')).toBe('public');
      expect(classifyField('notes', 'x'.repeat(120))).toBe('internal');
    });
  });

  describe('classifyPayload', () => {
    it('escalates to the most sensitive field present', () => {
      expect(
        classifyPayload({ label: 'Q3', rowCount: 10, budgetAmount: 5000, employeeSalary: 90000 })
      ).toBe('restricted');
    });

    it('a single confidential field dominates internal/public fields', () => {
      expect(classifyPayload({ label: 'Q3', rowCount: 10, budgetAmount: 5000 })).toBe(
        'confidential'
      );
    });

    it('an all-public payload stays public', () => {
      expect(classifyPayload({ label: 'Q3', version: 'v1' })).toBe('public');
    });
  });

  describe('redactSensitiveFields', () => {
    it('masks restricted fields and records the redaction for audit', () => {
      const { redacted, redactions } = redactSensitiveFields({
        employeeSalary: 120000,
        label: 'Q3',
      });
      expect(redacted['employeeSalary']).toBe('****');
      expect(redacted['label']).toBe('Q3');
      expect(redactions).toHaveLength(1);
      expect(redactions[0]).toMatchObject({
        field: 'employeeSalary',
        originalClassification: 'restricted',
        method: 'mask',
      });
    });

    it('hashes confidential numeric values (no raw figures leave the app)', () => {
      const { redacted, redactions } = redactSensitiveFields({ budgetAmount: 5000 });
      expect(String(redacted['budgetAmount'])).toMatch(/^hash-/);
      expect(String(redacted['budgetAmount'])).not.toContain('5000');
      expect(redactions[0]?.method).toBe('hash');
    });

    it('leaves non-sensitive fields untouched and never mutates the input', () => {
      const input = { label: 'Q3', rowCount: 10 };
      const { redacted, redactions } = redactSensitiveFields(input);
      expect(redacted).toEqual(input);
      expect(redactions).toHaveLength(0);
      expect(input.label).toBe('Q3');
    });
  });
});
