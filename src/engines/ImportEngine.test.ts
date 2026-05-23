import { describe, it, expect, beforeEach } from 'vitest';
import { ImportEngine } from './ImportEngine';

// Helper to create a mock File
function createMockFile(content: string, name: string, type = 'text/csv'): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

describe('ImportEngine', () => {
  let engine: ImportEngine;

  beforeEach(() => {
    engine = new ImportEngine();
  });

  it('should initialize with idle progress', () => {
    const progress = engine.getProgress();
    expect(progress.status).toBe('idle');
    expect(progress.percent).toBe(0);
  });

  it('should detect CSV format', () => {
    const file = createMockFile('a,b\n1,2', 'test.csv');
    expect(engine.detectFormat(file)).toBe('csv');
  });

  it('should detect JSON format', () => {
    const file = createMockFile('[{"a":1}]', 'test.json', 'application/json');
    expect(engine.detectFormat(file)).toBe('json');
  });

  it('should detect unknown format', () => {
    const file = createMockFile('data', 'test.xyz', 'application/octet-stream');
    expect(engine.detectFormat(file)).toBe('unknown');
  });

  it('should import CSV with auto-delimiter detection', async () => {
    const csv = 'name,amount,date\nRevenue,1000,2026-01-15\nExpense,500,2026-01-16';
    const file = createMockFile(csv, 'data.csv');
    const { result, snapshot } = await engine.importCSV(file);

    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.columns).toEqual(['name', 'amount', 'date']);
    expect(result.preview).toHaveLength(2);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.fileName).toBe('data.csv');
  });

  it('should import CSV with tab delimiter', async () => {
    const tsv = 'name\tamount\nRevenue\t1000\nExpense\t500';
    const file = createMockFile(tsv, 'data.tsv');
    const { result } = await engine.importCSV(file);

    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.columns).toEqual(['name', 'amount']);
  });

  it('should import CSV with semicolon delimiter', async () => {
    const csv = 'name;amount\nRevenue;1000\nExpense;500';
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importCSV(file);

    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
  });

  it('should handle quoted fields with commas', async () => {
    const csv = 'name,description\nRevenue,"Income, net"';
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importCSV(file);

    expect(result.valid).toBe(true);
    expect(result.preview[0].description).toBe('Income, net');
  });

  it('should validate required columns', async () => {
    const csv = 'name,amount\nRevenue,1000';
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importCSV(file, {
      requiredColumns: ['name', 'missing_col'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('missing_col'))).toBe(true);
  });

  it('should validate numeric columns', async () => {
    const csv = 'name,amount\nRevenue,abc\nExpense,500';
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importCSV(file, {
      numericColumns: ['amount'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Non-numeric'))).toBe(true);
  });

  it('should handle empty file', async () => {
    const file = createMockFile('', 'empty.csv');
    const { result } = await engine.importCSV(file);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('header row');
  });

  it('should handle file with only headers', async () => {
    const file = createMockFile('name,amount', 'headers.csv');
    const { result } = await engine.importCSV(file);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('header row');
  });

  it('should import JSON array', async () => {
    const json = JSON.stringify([
      { name: 'Revenue', amount: 1000 },
      { name: 'Expense', amount: 500 },
    ]);
    const file = createMockFile(json, 'data.json', 'application/json');
    const { result } = await engine.importJSON(file);

    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.columns).toEqual(['name', 'amount']);
  });

  it('should import JSON single object', async () => {
    const json = JSON.stringify({ name: 'Revenue', amount: 1000 });
    const file = createMockFile(json, 'data.json', 'application/json');
    const { result } = await engine.importJSON(file);

    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(1);
  });

  it('should handle invalid JSON', async () => {
    const file = createMockFile('{invalid json', 'bad.json', 'application/json');
    const { result } = await engine.importJSON(file);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('Invalid JSON');
  });

  it('should validate JSON required fields', async () => {
    const json = JSON.stringify([{ name: 'Revenue' }]);
    const file = createMockFile(json, 'data.json', 'application/json');
    const { result } = await engine.importJSON(file, {
      requiredFields: ['name', 'amount'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('amount'))).toBe(true);
  });

  it('should track snapshots for rollback', async () => {
    const csv = 'name,amount\nRevenue,1000';
    const file = createMockFile(csv, 'data.csv');
    const { snapshot } = await engine.importCSV(file);

    expect(engine.getSnapshots()).toHaveLength(1);
    expect(engine.getSnapshots()[0].fileName).toBe('data.csv');

    // Rollback
    if (snapshot) {
      engine.rollback(snapshot.id);
      expect(engine.getSnapshots()[0].applied).toBe(false);
    }
  });

  it('should clear snapshots', async () => {
    const csv = 'name,amount\nRevenue,1000';
    const file = createMockFile(csv, 'data.csv');
    await engine.importCSV(file);

    expect(engine.getSnapshots()).toHaveLength(1);
    engine.clearSnapshots();
    expect(engine.getSnapshots()).toHaveLength(0);
  });

  it('should auto-import via importFile', async () => {
    const csv = 'name,amount\nRevenue,1000';
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importFile(file);

    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(1);
  });

  it('should reject unsupported formats', async () => {
    const file = createMockFile('data', 'test.xyz', 'application/octet-stream');
    const { result } = await engine.importFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('Unsupported');
  });

  it('should track progress during import', async () => {
    const progressUpdates: string[] = [];
    engine.onProgress((p) => progressUpdates.push(p.status));

    const csv = 'name,amount\nRevenue,1000';
    const file = createMockFile(csv, 'data.csv');
    await engine.importCSV(file);

    expect(progressUpdates).toContain('reading');
    expect(progressUpdates).toContain('parsing');
    expect(progressUpdates).toContain('validating');
    expect(progressUpdates).toContain('complete');
  });

  it('should respect maxRows limit', async () => {
    const rows = Array.from({ length: 100 }, (_, i) => `Row${i},${i}`).join('\n');
    const csv = `name,amount\n${rows}`;
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importCSV(file, { maxRows: 10 });

    expect(result.rowCount).toBe(10);
    expect(result.warnings.some((w) => w.message.includes('exceeding limit'))).toBe(true);
  });

  it('should handle date column validation', async () => {
    const csv = 'name,date\nRevenue,2026-01-15\nExpense,not-a-date';
    const file = createMockFile(csv, 'data.csv');
    const { result } = await engine.importCSV(file, {
      dateColumns: ['date'],
    });

    expect(result.warnings.some((w) => w.message.includes('date format'))).toBe(true);
  });
});
