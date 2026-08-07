import { describe, it, expect, beforeEach } from 'vitest';
import { ReportBookEngine } from './ReportBookEngine';

describe('ReportBookEngine', () => {
  let engine: ReportBookEngine;

  beforeEach(() => {
    engine = new ReportBookEngine();
  });

  it('should initialize with empty state', () => {
    expect(engine.listBooks()).toEqual([]);
  });

  it('should create a report book', () => {
    const book = engine.createBook('Monthly Board Pack', 'Monthly financial reports');
    expect(book.id).toBeDefined();
    expect(book.name).toBe('Monthly Board Pack');
    expect(book.description).toBe('Monthly financial reports');
    expect(book.entries).toEqual([]);
  });

  it('should get book by id', () => {
    const book = engine.createBook('Test', 'test');
    expect(engine.getBook(book.id)).toBeDefined();
  });

  it('should return undefined for non-existent book', () => {
    expect(engine.getBook('non-existent')).toBeUndefined();
  });

  it('should add entry to book', () => {
    const book = engine.createBook('Test', 'test');
    const entry = engine.addEntry(book.id, {
      reportName: 'P&L Report',
      templateId: 'tpl-pl',
      entityIds: ['E1'],
      variables: { period: 'Q1 2026' },
      enabled: true,
    });
    expect(entry).not.toBeNull();
    expect(entry!.reportName).toBe('P&L Report');
  });

  it('should remove entry from book', () => {
    const book = engine.createBook('Test', 'test');
    const entry = engine.addEntry(book.id, {
      reportName: 'Test',
      templateId: 'tpl',
      entityIds: ['E1'],
      variables: {},
      enabled: true,
    });
    // removeEntry returns void
    engine.removeEntry(book.id, entry!.id);
    // Verify the entry was removed
    const updated = engine.getBook(book.id);
    expect(updated!.entries).toHaveLength(0);
  });

  it('should delete a book', () => {
    const book = engine.createBook('To Delete', 'test');
    expect(engine.deleteBook(book.id)).toBe(true);
    expect(engine.getBook(book.id)).toBeUndefined();
  });

  it('should get available variables', () => {
    const vars = engine.getAvailableVariables();
    expect(vars.length).toBeGreaterThan(0);
    expect(vars.some((v) => v.key === 'entity_name')).toBe(true);
    expect(vars.some((v) => v.key === 'period')).toBe(true);
  });

  it('should get all books', () => {
    engine.createBook('Book 1', 'test');
    engine.createBook('Book 2', 'test');
    expect(engine.listBooks()).toHaveLength(2);
  });
});
