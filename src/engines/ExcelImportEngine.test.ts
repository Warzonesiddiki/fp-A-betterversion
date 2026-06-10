import { describe, it, expect } from 'vitest';
import { ExcelImportEngine } from './ExcelImportEngine';

describe('ExcelImportEngine', () => {
  const engine = new ExcelImportEngine();

  describe('autoDetectMappings', () => {
    it('detects date column from header keywords', () => {
      const headers = ['Posting Date', 'Account Code', 'Debit', 'Credit'];
      const mappings = engine.autoDetectMappings(headers, []);
      const dateMapping = mappings.find((m) => m.sourceColumn === 'Posting Date');
      expect(dateMapping?.targetField).toBe('date');
      expect(dateMapping?.confidence).toBeGreaterThan(0.5);
    });

    it('detects account code column', () => {
      const headers = ['Date', 'GL Account', 'Amount'];
      const mappings = engine.autoDetectMappings(headers, []);
      const acctMapping = mappings.find((m) => m.sourceColumn === 'GL Account');
      expect(acctMapping?.targetField).toBe('accountCode');
    });

    it('detects debit and credit columns', () => {
      const headers = ['Date', 'Account', 'Debit', 'Credit'];
      const mappings = engine.autoDetectMappings(headers, []);
      const drMapping = mappings.find((m) => m.sourceColumn === 'Debit');
      const crMapping = mappings.find((m) => m.sourceColumn === 'Credit');
      expect(drMapping?.targetField).toBe('debit');
      expect(crMapping?.targetField).toBe('credit');
    });

    it('detects amount column', () => {
      const headers = ['Date', 'Code', 'Amount'];
      const mappings = engine.autoDetectMappings(headers, []);
      const amtMapping = mappings.find((m) => m.sourceColumn === 'Amount');
      expect(amtMapping?.targetField).toBe('amount');
    });

    it('marks unmapped columns as skip', () => {
      const headers = ['Date', 'Account', 'Random Column'];
      const mappings = engine.autoDetectMappings(headers, []);
      const skipMapping = mappings.find((m) => m.sourceColumn === 'Random Column');
      expect(skipMapping?.targetField).toBe('skip');
    });

    it('resolves conflicts: keeps highest confidence for unique fields', () => {
      const headers = ['Date', 'Posting Date', 'Account', 'Account Code'];
      const mappings = engine.autoDetectMappings(headers, []);
      const dateMappings = mappings.filter((m) => m.targetField === 'date');
      expect(dateMappings.length).toBe(1);
    });

    it('boosts confidence with date pattern in sample data', () => {
      const headers = ['Col A', 'Account'];
      const sampleRows = [
        { 'Col A': '2024-01-15', Account: '1000' },
        { 'Col A': '2024-02-20', Account: '2000' },
        { 'Col A': '2024-03-10', Account: '3000' },
      ];
      const mappings = engine.autoDetectMappings(headers, sampleRows);
      const colAMapping = mappings.find((m) => m.sourceColumn === 'Col A');
      expect(colAMapping?.targetField).toBe('date');
      expect(colAMapping?.confidence).toBeGreaterThan(0.7);
    });

    it('boosts confidence with numeric pattern for debit/credit', () => {
      const headers = ['Date', 'Account', 'DR'];
      const sampleRows = [
        { Date: '2024-01-01', Account: '1000', DR: '1,500.00' },
        { Date: '2024-01-02', Account: '2000', DR: '2,300.50' },
        { Date: '2024-01-03', Account: '3000', DR: '0' },
      ];
      const mappings = engine.autoDetectMappings(headers, sampleRows);
      const drMapping = mappings.find((m) => m.sourceColumn === 'DR');
      expect(drMapping?.targetField).toBe('debit');
    });
  });

  describe('mapData', () => {
    it('maps rows with correct field assignments', () => {
      const rows = [
        { 'Post Date': '2024-01-15', Account: '1000', DR: '500', CR: '0', Desc: 'Test entry' },
        { 'Post Date': '2024-01-16', Account: '2000', DR: '0', CR: '300', Desc: 'Another entry' },
      ];
      const mappings = engine.autoDetectMappings(Object.keys(rows[0]!), rows);
      const result = engine.mapData(rows, mappings);

      expect(result.mapped.length).toBe(2);
      expect(result!.mapped[0]!.accountCode).toBe('1000');
      expect(result!.mapped[0]!.debit).toBe(500);
      expect(result!.mapped[1]!.credit).toBe(300);
    });

    it('errors on missing account code', () => {
      const rows = [{ Date: '2024-01-01', Account: '', DR: '100', CR: '0' }];
      const mappings = [
        { sourceColumn: 'Date', targetField: 'date' as const, confidence: 1, reason: '' },
        { sourceColumn: 'Account', targetField: 'accountCode' as const, confidence: 1, reason: '' },
        { sourceColumn: 'DR', targetField: 'debit' as const, confidence: 1, reason: '' },
        { sourceColumn: 'CR', targetField: 'credit' as const, confidence: 1, reason: '' },
      ];
      const result = engine.mapData(rows, mappings);
      expect(result.errors.length).toBe(1);
      expect(result!.errors[0]!.column).toBe('accountCode');
    });

    it('warns on missing date', () => {
      const rows = [{ Date: '', Account: '1000', DR: '100', CR: '0' }];
      const mappings = [
        { sourceColumn: 'Date', targetField: 'date' as const, confidence: 1, reason: '' },
        { sourceColumn: 'Account', targetField: 'accountCode' as const, confidence: 1, reason: '' },
        { sourceColumn: 'DR', targetField: 'debit' as const, confidence: 1, reason: '' },
        { sourceColumn: 'CR', targetField: 'credit' as const, confidence: 1, reason: '' },
      ];
      const result = engine.mapData(rows, mappings);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('parses numeric values with commas', () => {
      const rows = [{ Date: '2024-01-01', Account: '1000', Amount: '1,234.56' }];
      const mappings = [
        { sourceColumn: 'Date', targetField: 'date' as const, confidence: 1, reason: '' },
        { sourceColumn: 'Account', targetField: 'accountCode' as const, confidence: 1, reason: '' },
        { sourceColumn: 'Amount', targetField: 'amount' as const, confidence: 1, reason: '' },
      ];
      const result = engine.mapData(rows, mappings);
      expect(result!.mapped[0]!.amount).toBe(1234.56);
    });
  });

  describe('validate', () => {
    it('returns valid for balanced data', () => {
      const rows = [
        {
          date: '2024-01-01',
          accountCode: '1000',
          accountName: '',
          debit: 500,
          credit: 0,
          amount: 500,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
        {
          date: '2024-01-01',
          accountCode: '2000',
          accountName: '',
          debit: 0,
          credit: 500,
          amount: -500,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
      ];
      const result = engine.validate(rows);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('warns on imbalanced debits/credits', () => {
      const rows = [
        {
          date: '2024-01-01',
          accountCode: '1000',
          accountName: '',
          debit: 500,
          credit: 0,
          amount: 500,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
        {
          date: '2024-01-01',
          accountCode: '2000',
          accountName: '',
          debit: 0,
          credit: 300,
          amount: -300,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
      ];
      const result = engine.validate(rows);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result!.warnings[0]!.message).toContain('imbalanced');
    });

    it('errors on empty data', () => {
      const result = engine.validate([]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getPreview', () => {
    it('returns first N rows', () => {
      const rows = [
        { a: '1' },
        { a: '2' },
        { a: '3' },
        { a: '4' },
        { a: '5' },
        { a: '6' },
        { a: '7' },
        { a: '8' },
        { a: '9' },
        { a: '10' },
        { a: '11' },
        { a: '12' },
      ];
      const preview = engine.getPreview(rows, 10);
      expect(preview.length).toBe(10);
    });

    it('returns all rows if fewer than count', () => {
      const rows = [{ a: '1' }, { a: '2' }];
      const preview = engine.getPreview(rows, 10);
      expect(preview.length).toBe(2);
    });
  });
});
