import { describe, it, expect, beforeEach } from 'vitest';
import { NamedRangeEngine } from './NamedRangeEngine';

describe('NamedRangeEngine', () => {
  beforeEach(() => {
    NamedRangeEngine.reset();
  });

  describe('create', () => {
    it('should create a named range', () => {
      const range = NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 0, endRow: 11, endCol: 0 },
        createdBy: 'test',
      });
      expect(range.name).toBe('Revenue');
    });

    it('should prevent duplicate names', () => {
      NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 0, endRow: 11, endCol: 0 },
        createdBy: 'test',
      });
      const range = NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 1, endRow: 11, endCol: 1 },
        createdBy: 'test',
      });
      expect(range.range.startCol).toBe(1);
    });
  });

  describe('getRange', () => {
    it('should get named range by name', () => {
      NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 0, endRow: 11, endCol: 0 },
        createdBy: 'test',
      });
      const range = NamedRangeEngine.getRange('Revenue');
      expect(range).toBeDefined();
      expect(range?.name).toBe('Revenue');
    });

    it('should return undefined for non-existent range', () => {
      expect(NamedRangeEngine.getRange('nonexistent')).toBeUndefined();
    });
  });

  describe('resolve', () => {
    it('should resolve range to cell addresses', () => {
      NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
        createdBy: 'test',
      });
      const cells = NamedRangeEngine.resolve('Revenue');
      expect(cells).toHaveLength(3);
      expect(cells![0]).toBe('A0');
    });

    it('should return null for non-existent range', () => {
      expect(NamedRangeEngine.resolve('nonexistent')).toBeNull();
    });
  });

  describe('getValues', () => {
    it('should get values for a named range', () => {
      NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
        createdBy: 'test',
      });
      const grid = [
        ['100', '200', '300'],
        ['400', '500', '600'],
        ['700', '800', '900'],
      ];
      const values = NamedRangeEngine.getValues('Revenue', grid);
      expect(values).toEqual(['100', '400', '700']);
    });
  });

  describe('reset', () => {
    it('should clear all named ranges', () => {
      NamedRangeEngine.create({
        name: 'Revenue',
        scope: 'global',
        range: { startRow: 0, startCol: 0, endRow: 11, endCol: 0 },
        createdBy: 'test',
      });
      NamedRangeEngine.reset();
      expect(NamedRangeEngine.getRange('Revenue')).toBeUndefined();
    });
  });
});
