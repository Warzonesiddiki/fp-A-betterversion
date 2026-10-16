import { describe, it, expect } from 'vitest';
import { parseD365Rows, detectD365Flavor, parseD365Date } from './d365Parser';

describe('d365Parser', () => {
  describe('detectD365Flavor', () => {
    it('detects Dynamics 365 Finance & Operations from GeneralJournalAccountEntryEntity headers', () => {
      const headers = [
        'LedgerAccount',
        'AccountingDate',
        'AccountingCurrencyDebitAmount',
        'AccountingCurrencyCreditAmount',
        'SubledgerVoucher',
        'DataAreaId',
      ];
      expect(detectD365Flavor(headers)).toBe('d365_fo');
    });

    it('detects Dynamics 365 Business Central from G/L Entries headers', () => {
      const headers = [
        'G/L Account No.',
        'Posting Date',
        'Debit Amount',
        'Credit Amount',
        'Document No.',
        'Description',
      ];
      expect(detectD365Flavor(headers)).toBe('d365_bc');
    });

    it('returns null when headers do not match D365 schemas', () => {
      const headers = ['RandomCol', 'AnotherCol'];
      expect(detectD365Flavor(headers)).toBeNull();
    });
  });

  describe('parseD365Date', () => {
    it('parses ISO YYYY-MM-DD dates', () => {
      expect(parseD365Date('2023-11-15')).toBe('2023-11-15');
    });

    it('parses ISO timestamp dates', () => {
      expect(parseD365Date('2023-11-15T00:00:00Z')).toBe('2023-11-15');
      expect(parseD365Date('2023-11-15 00:00:00')).toBe('2023-11-15');
    });

    it('parses D365 dd-MMM-yyyy format (e.g. 11-Nov-2023)', () => {
      expect(parseD365Date('11-Nov-2023')).toBe('2023-11-11');
      expect(parseD365Date('01-Jan-2024')).toBe('2024-01-01');
      expect(parseD365Date('29-Feb-2024')).toBe('2024-02-29'); // Leap year
    });

    it('rejects calendar-invalid dates with null', () => {
      expect(parseD365Date('29-Feb-2023')).toBeNull(); // Non-leap year
      expect(parseD365Date('31-Nov-2023')).toBeNull(); // Nov has 30 days
      expect(parseD365Date('2023-02-29')).toBeNull();
      expect(parseD365Date('invalid-date')).toBeNull();
      expect(parseD365Date('')).toBeNull();
    });
  });

  describe('F&O GeneralJournalAccountEntryEntity mapping', () => {
    it('maps standard F&O export rows to GLEntry structure', () => {
      const rows = [
        {
          LedgerAccount: '110110-001-023',
          MainAccountName: 'Cash and cash equivalents',
          AccountingDate: '2023-11-15',
          AccountingCurrencyDebitAmount: '1500.50',
          AccountingCurrencyCreditAmount: '0.00',
          SubledgerVoucher: 'VCH-00100',
          Text: 'Customer payment received',
          DataAreaId: 'USMF',
          TransactionCurrencyCode: 'USD',
        },
        {
          LedgerAccount: '120100-001-023',
          MainAccountName: 'Accounts Receivable',
          AccountingDate: '15-Nov-2023',
          AccountingCurrencyDebitAmount: '0',
          AccountingCurrencyCreditAmount: '1500.50',
          SubledgerVoucher: 'VCH-00100',
          Text: 'Customer payment received',
          DataAreaId: 'USMF',
          TransactionCurrencyCode: 'USD',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });

      expect(result.flavor).toBe('d365_fo');
      expect(result.rejections).toHaveLength(0);
      expect(result.rowErrors).toHaveLength(0);
      expect(result.entries).toHaveLength(2);

      // Row 1 checks
      expect(result.sourceRows[0]).toBe(2);
      expect(result.entries[0]?.accountCode).toBe('110110');
      expect(result.entries[0]?.accountName).toBe('Cash and cash equivalents');
      expect(result.entries[0]?.date).toBe('2023-11-15');
      expect(result.entries[0]?.postDate).toBe('2023-11-15');
      expect(result.entries[0]?.debit).toBe(1500.5);
      expect(result.entries[0]?.credit).toBe(0);
      expect(result.entries[0]?.journalId).toBe('VCH-00100');
      expect(result.entries[0]?.description).toBe('Customer payment received');
      expect(result.entries[0]?.entityId).toBe('USMF');
      expect(result.entries[0]?.currency).toBe('USD');

      // Row 2 checks
      expect(result.sourceRows[1]).toBe(3);
      expect(result.entries[1]?.accountCode).toBe('120100');
      expect(result.entries[1]?.debit).toBe(0);
      expect(result.entries[1]?.credit).toBe(1500.5);
    });
  });

  describe('Business Central G/L Entries mapping', () => {
    it('maps standard BC export rows to GLEntry structure', () => {
      const rows = [
        {
          'G/L Account No.': '10100',
          'G/L Account Name': 'Checking Account',
          'Posting Date': '2024-03-31',
          'Debit Amount': '2400.00',
          'Credit Amount': '0.00',
          'Document No.': 'DOC-991',
          Description: 'Quarterly client retainer',
          'Business Unit Code': 'CORP',
        },
        {
          'G/L Account No.': '40100',
          'G/L Account Name': 'Service Revenue',
          'Posting Date': '2024-03-31',
          'Debit Amount': '0.00',
          'Credit Amount': '2400.00',
          'Document No.': 'DOC-991',
          Description: 'Quarterly client retainer',
          'Business Unit Code': 'CORP',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_bc' });

      expect(result.flavor).toBe('d365_bc');
      expect(result.rejections).toHaveLength(0);
      expect(result.entries).toHaveLength(2);

      expect(result.entries[0]?.accountCode).toBe('10100');
      expect(result.entries[0]?.accountName).toBe('Checking Account');
      expect(result.entries[0]?.postDate).toBe('2024-03-31');
      expect(result.entries[0]?.debit).toBe(2400);
      expect(result.entries[0]?.credit).toBe(0);
      expect(result.entries[0]?.journalId).toBe('DOC-991');
      expect(result.entries[0]?.entityId).toBe('CORP');
    });

    it('maps Business Central signed Amount column when debit/credit columns are omitted', () => {
      const rows = [
        {
          'G/L Account No.': '10100',
          'Posting Date': '2024-03-31',
          Amount: '500.00', // positive = debit
          'Document No.': 'DOC-100',
        },
        {
          'G/L Account No.': '20100',
          'Posting Date': '2024-03-31',
          Amount: '-500.00', // negative = credit
          'Document No.': 'DOC-100',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_bc' });
      expect(result.rejections).toHaveLength(0);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]?.debit).toBe(500);
      expect(result.entries[0]?.credit).toBe(0);
      expect(result.entries[1]?.debit).toBe(0);
      expect(result.entries[1]?.credit).toBe(500);
    });
  });

  describe('validation and rejection of malformed rows', () => {
    it('rejects row when account code is missing', () => {
      const rows = [
        {
          LedgerAccount: '',
          AccountingDate: '2023-11-15',
          AccountingCurrencyDebitAmount: '100',
          AccountingCurrencyCreditAmount: '0',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });
      expect(result.entries).toHaveLength(0);
      expect(result.rejections).toHaveLength(1);
      expect(result.rejections[0]?.row).toBe(2);
      expect(result.rejections[0]?.code).toBe('VALIDATION');
      expect(result.rejections[0]?.reason).toMatch(/missing account code/i);
    });

    it('rejects row when posting date is missing', () => {
      const rows = [
        {
          LedgerAccount: '1100',
          AccountingDate: '',
          AccountingCurrencyDebitAmount: '100',
          AccountingCurrencyCreditAmount: '0',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });
      expect(result.entries).toHaveLength(0);
      expect(result.rejections).toHaveLength(1);
      expect(result.rejections[0]?.row).toBe(2);
      expect(result.rejections[0]?.reason).toMatch(/missing posting date/i);
    });

    it('rejects row when posting date is unparseable or calendar-invalid', () => {
      const rows = [
        {
          LedgerAccount: '1100',
          AccountingDate: '31-Nov-2023',
          AccountingCurrencyDebitAmount: '100',
          AccountingCurrencyCreditAmount: '0',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });
      expect(result.entries).toHaveLength(0);
      expect(result.rejections).toHaveLength(1);
      expect(result.rejections[0]?.row).toBe(2);
      expect(result.rejections[0]?.reason).toMatch(/unparseable posting date "31-Nov-2023"/i);
    });

    it('rejects row when amounts are missing (missing != zero)', () => {
      const rows = [
        {
          LedgerAccount: '1100',
          AccountingDate: '2023-11-15',
          // Neither debit nor credit nor amount provided
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });
      expect(result.entries).toHaveLength(0);
      expect(result.rejections).toHaveLength(1);
      expect(result.rejections[0]?.row).toBe(2);
      expect(result.rejections[0]?.reason).toMatch(/missing debit, credit, or amount/i);
    });

    it('rejects row with malformed or negative debit/credit', () => {
      const rows = [
        {
          LedgerAccount: '1100',
          AccountingDate: '2023-11-15',
          AccountingCurrencyDebitAmount: 'invalid-amt',
          AccountingCurrencyCreditAmount: '0',
        },
        {
          LedgerAccount: '1100',
          AccountingDate: '2023-11-15',
          AccountingCurrencyDebitAmount: '-50.00',
          AccountingCurrencyCreditAmount: '0',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });
      expect(result.entries).toHaveLength(0);
      expect(result.rejections).toHaveLength(2);
      expect(result.rejections[0]?.row).toBe(2);
      expect(result.rejections[0]?.reason).toMatch(/unparseable debit amount/i);
      expect(result.rejections[1]?.row).toBe(3);
      expect(result.rejections[1]?.reason).toMatch(/debit must be non-negative/i);
    });

    it('rejects summary / header / non-transaction rows', () => {
      const rows = [
        {
          LedgerAccount: 'Total for Account 110110',
          AccountingDate: '2023-11-15',
          AccountingCurrencyDebitAmount: '5000',
          AccountingCurrencyCreditAmount: '5000',
        },
      ];

      const result = parseD365Rows(rows, { flavor: 'd365_fo' });
      expect(result.entries).toHaveLength(0);
      expect(result.rejections).toHaveLength(1);
      expect(result.rejections[0]?.reason).toMatch(/non-transaction/i);
    });
  });
});
