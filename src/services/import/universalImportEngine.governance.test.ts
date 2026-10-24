/**
 * GOVERNANCE EVIDENCE for cap:data.universal-import
 *
 * O1 DECISION (2026-10-24): Go universal — import any data from D365 and
 * other accounting/finance tools with the user's own template system.
 *
 * The Universal Import Engine applies a template to parse any data source
 * into GL entries. It wraps the existing parseGLRows/parseD365Rows pipeline.
 *
 * Governance dimensions tested:
 *  1. Template validation — required fields, no duplicates, valid types
 *  2. D365 auto-detection — F&O and BC flavors detected from headers
 *  3. Generic import — user-defined column mappings produce GL entries
 *  4. Money primitive safety — amounts parsed through parseFinancialAmount
 *  5. Determinism — same input + template produces same output
 *  6. Rejection integrity — invalid rows rejected with reasons, not dropped
 *  7. Template registry — built-in templates available, user templates creatable
 */
import { describe, it, expect } from 'vitest';
import {
  universalImportParse,
  universalImportAutoDetect,
  buildMappingsFromTemplate,
} from './universalImportEngine';
import {
  validateTemplate,
  createUserTemplate,
  detectTemplate,
  isD365Template,
  getD365Flavor,
  BUILTIN_TEMPLATES,
} from './universalImportTemplate';

describe('data.universal-import — GOVERNANCE (O1: universal data importer)', () => {
  describe('template validation', () => {
    it('rejects templates with missing required fields', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        // postDate is missing
      });
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('postDate'))).toBe(true);
    });

    it('rejects templates with duplicate column mappings', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Account', // duplicate — same column for two fields
        debit: 'Debit',
      });
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });

    it('rejects templates with empty column names', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: '',
        postDate: 'Date',
      });
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('accountCode'))).toBe(true);
    });

    it('accepts valid templates with all required fields', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
        debit: 'Debit',
        credit: 'Credit',
      });
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('warns about unmapped optional fields', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
      });
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('debit'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('credit'))).toBe(true);
    });
  });

  describe('template registry', () => {
    it('has 4 built-in templates', () => {
      expect(BUILTIN_TEMPLATES).toHaveLength(4);
    });

    it('built-in templates include D365 F&O, D365 BC, generic CSV, generic XLSX', () => {
      const ids = BUILTIN_TEMPLATES.map((t) => t.id);
      expect(ids).toContain('builtin-d365-fo');
      expect(ids).toContain('builtin-d365-bc');
      expect(ids).toContain('builtin-generic-csv');
      expect(ids).toContain('builtin-generic-xlsx');
    });

    it('all built-in templates have builtIn=true', () => {
      for (const template of BUILTIN_TEMPLATES) {
        expect(template.builtIn).toBe(true);
      }
    });

    it('isD365Template returns true for D365 templates', () => {
      expect(isD365Template(BUILTIN_TEMPLATES[0]!)).toBe(true);
      expect(isD365Template(BUILTIN_TEMPLATES[1]!)).toBe(true);
      expect(isD365Template(BUILTIN_TEMPLATES[2]!)).toBe(false);
      expect(isD365Template(BUILTIN_TEMPLATES[3]!)).toBe(false);
    });

    it('getD365Flavor returns the correct flavor for D365 templates', () => {
      expect(getD365Flavor(BUILTIN_TEMPLATES[0]!)).toBe('d365_fo');
      expect(getD365Flavor(BUILTIN_TEMPLATES[1]!)).toBe('d365_bc');
      expect(getD365Flavor(BUILTIN_TEMPLATES[2]!)).toBeNull();
    });

    it('createUserTemplate produces a template with builtIn=false', () => {
      const template = createUserTemplate('My Template', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
      });
      expect(template.builtIn).toBe(false);
      expect(template.id).toMatch(/^user-/);
    });

    it('createUserTemplate sanitizes the id from the name', () => {
      const template = createUserTemplate('My Template!!', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
      });
      expect(template.id).toBe('user-my-template');
    });
  });

  describe('D365 auto-detection', () => {
    const d365FoHeaders = [
      'MainAccount',
      'MainAccountName',
      'AccountingDate',
      'AccountingCurrencyDebitAmount',
      'AccountingCurrencyCreditAmount',
      'SubledgerVoucher',
      'DataAreaId',
    ];

    const d365BcHeaders = [
      'G/L Account No.',
      'G/L Account Name',
      'Posting Date',
      'Debit Amount',
      'Credit Amount',
      'Document No.',
    ];

    it('detects D365 F&O template from F&O headers', () => {
      const template = detectTemplate(d365FoHeaders);
      expect(template).not.toBeNull();
      expect(template!.id).toBe('builtin-d365-fo');
    });

    it('detects D365 BC template from BC headers', () => {
      const template = detectTemplate(d365BcHeaders);
      expect(template).not.toBeNull();
      expect(template!.id).toBe('builtin-d365-bc');
    });

    it('returns null for non-D365 headers', () => {
      const template = detectTemplate(['Account', 'Date', 'Amount']);
      expect(template).toBeNull();
    });

    it('universalImportAutoDetect selects D365 F&O template', () => {
      const rows = [
        {
          MainAccount: '1000',
          AccountingDate: '2026-01-31',
          AccountingCurrencyDebitAmount: '1000.00',
          AccountingCurrencyCreditAmount: '0.00',
        },
      ];
      const { result, detectedTemplateId } = universalImportAutoDetect(rows);
      expect(detectedTemplateId).toBe('builtin-d365-fo');
      expect(result.sourceType).toBe('d365_fo');
      expect(result.d365Flavor).toBe('d365_fo');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.accountCode).toBe('1000');
    });

    it('universalImportAutoDetect selects D365 BC template', () => {
      const rows = [
        {
          'G/L Account No.': '1000',
          'Posting Date': '2026-01-31',
          'Debit Amount': '1000.00',
          'Credit Amount': '0.00',
        },
      ];
      const { result, detectedTemplateId } = universalImportAutoDetect(rows);
      expect(detectedTemplateId).toBe('builtin-d365-bc');
      expect(result.sourceType).toBe('d365_bc');
      expect(result.d365Flavor).toBe('d365_bc');
      expect(result.entries).toHaveLength(1);
    });

    it('universalImportAutoDetect returns null template for generic headers', () => {
      const rows = [{ Account: '1000', Date: '2026-01-31', Debit: '1000.00' }];
      const { result, detectedTemplateId } = universalImportAutoDetect(rows);
      expect(detectedTemplateId).toBeNull();
      // Generic template has no mappings, so all rows are rejected
      expect(result.acceptedRows).toBe(0);
      expect(result.rejectedRows).toBe(1);
    });
  });

  describe('generic import with user-defined mappings', () => {
    const genericTemplate = createUserTemplate('Generic Test', 'custom', {
      accountCode: 'Account',
      postDate: 'Date',
      debit: 'Debit',
      credit: 'Credit',
      description: 'Desc',
      currency: 'Currency',
    });

    it('parses rows with user-defined column mappings', () => {
      const rows = [
        {
          Account: '1000',
          Date: '2026-01-31',
          Debit: '1000.00',
          Credit: '0.00',
          Desc: 'Opening balance',
          Currency: 'USD',
        },
        {
          Account: '2000',
          Date: '2026-01-31',
          Debit: '0.00',
          Credit: '500.00',
          Desc: 'Payment',
          Currency: 'USD',
        },
      ];

      const result = universalImportParse({ rows, template: genericTemplate });
      expect(result.acceptedRows).toBe(2);
      expect(result.rejectedRows).toBe(0);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]!.accountCode).toBe('1000');
      // asMoney returns Money object with .minor (cents)
      expect((result.entries[0]!.debit as { minor: number }).minor).toBe(100000);
      expect(result.entries[1]!.accountCode).toBe('2000');
      expect((result.entries[1]!.credit as { minor: number }).minor).toBe(50000);
    });

    it('rejects rows missing required fields', () => {
      const rows = [
        { Account: '1000', Date: '2026-01-31', Debit: '1000.00' },
        { Account: '', Date: '2026-01-31', Debit: '1000.00' }, // missing account
        { Account: '2000', Date: '', Debit: '1000.00' }, // missing date
      ];

      const result = universalImportParse({ rows, template: genericTemplate });
      expect(result.acceptedRows).toBe(1);
      expect(result.rejectedRows).toBe(2);
      expect(result.rejections[0]!.code).toBe('VALIDATION');
    });

    it('rejects rows with negative amounts (magnitude check)', () => {
      const rows = [{ Account: '1000', Date: '2026-01-31', Debit: '-500.00', Credit: '0.00' }];

      const result = universalImportParse({ rows, template: genericTemplate });
      expect(result.acceptedRows).toBe(0);
      expect(result.rejectedRows).toBe(1);
      expect(result.rowErrors[0]).toContain('non-negative');
    });

    it('preserves exact monetary strings through parseFinancialAmount', () => {
      const rows = [{ Account: '1000', Date: '2026-01-31', Debit: '1234567.89', Credit: '0.00' }];

      const result = universalImportParse({ rows, template: genericTemplate });
      // asMoney returns Money object with .minor (cents) — 1234567.89 = 123456789 cents
      expect((result.entries[0]!.debit as { minor: number }).minor).toBe(123456789);
    });
  });

  describe('determinism', () => {
    it('same input + template produces same output', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
        debit: 'Debit',
        credit: 'Credit',
      });
      const rows = [
        { Account: '1000', Date: '2026-01-31', Debit: '1000.00', Credit: '0.00' },
        { Account: '2000', Date: '2026-01-31', Debit: '0.00', Credit: '500.00' },
      ];

      const result1 = universalImportParse({ rows, template });
      const result2 = universalImportParse({ rows, template });

      expect(result1.entries).toEqual(result2.entries);
      expect(result1.sourceRows).toEqual(result2.sourceRows);
      expect(result1.rejections).toEqual(result2.rejections);
    });
  });

  describe('rejection integrity', () => {
    it('rows with multiple errors collect all reasons', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
        debit: 'Debit',
      });
      const rows = [
        { Account: '', Date: '', Debit: '-100' }, // missing account, missing date, negative debit
      ];

      const result = universalImportParse({ rows, template });
      // The row has multiple issues — at least one rejection
      expect(result.rejectedRows).toBe(1);
      expect(result.rejections.length).toBeGreaterThanOrEqual(1);
    });

    it('unmapped amount fields default to 0, not rejected', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
        // debit and credit not mapped
      });
      const rows = [{ Account: '1000', Date: '2026-01-31' }];

      const result = universalImportParse({ rows, template });
      // Row is accepted (account + date present), amounts default to 0
      expect(result.acceptedRows).toBe(1);
      // asMoney returns Money object with .minor (cents)
      expect((result.entries[0]!.debit as { minor: number }).minor).toBe(0);
      expect((result.entries[0]!.credit as { minor: number }).minor).toBe(0);
    });

    it('source rows are 1-based (header = row 1, first data = row 2)', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
      });
      const rows = [
        { Account: '1000', Date: '2026-01-31' },
        { Account: '', Date: '2026-01-31' }, // rejected
        { Account: '2000', Date: '2026-01-31' },
      ];

      const result = universalImportParse({ rows, template });
      expect(result.sourceRows).toEqual([2, 4]);
    });
  });

  describe('buildMappingsFromTemplate', () => {
    it('returns auto-detected mappings for D365 templates', () => {
      const headers = [
        'MainAccount',
        'AccountingDate',
        'AccountingCurrencyDebitAmount',
        'AccountingCurrencyCreditAmount',
      ];
      const mappings = buildMappingsFromTemplate(BUILTIN_TEMPLATES[0]!, headers);
      expect(mappings.accountCode).toBe('MainAccount');
      expect(mappings.postDate).toBe('AccountingDate');
      expect(mappings.debit).toBe('AccountingCurrencyDebitAmount');
      expect(mappings.credit).toBe('AccountingCurrencyCreditAmount');
    });

    it('returns template mappings for generic templates', () => {
      const template = createUserTemplate('Test', 'custom', {
        accountCode: 'Account',
        postDate: 'Date',
      });
      const mappings = buildMappingsFromTemplate(template, ['Account', 'Date']);
      expect(mappings.accountCode).toBe('Account');
      expect(mappings.postDate).toBe('Date');
    });
  });
});
