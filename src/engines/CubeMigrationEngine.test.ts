import { describe, it, expect, beforeEach } from 'vitest';
import { CubeMigrationEngine, type MigrationConfig } from './CubeMigrationEngine';

// =============================================================================
// CubeMigrationEngine Tests
// =============================================================================

describe('CubeMigrationEngine', () => {
  let engine: CubeMigrationEngine;
  let csvConfig: MigrationConfig;
  let jsonConfig: MigrationConfig;
  let essbaseConfig: MigrationConfig;
  let tm1Config: MigrationConfig;
  let ssasConfig: MigrationConfig;

  beforeEach(() => {
    engine = new CubeMigrationEngine();

    csvConfig = {
      source: 'csv',
      cubeName: 'Finance',
      dimensionMapping: { Region: 'Geography', Product: 'Product' },
      measureMapping: { Revenue: 'Revenue', Cost: 'COGS' },
      options: { delimiter: ',' },
    };

    jsonConfig = {
      source: 'json',
      cubeName: 'Finance',
      dimensionMapping: { region: 'Geography', product: 'Product' },
      measureMapping: { revenue: 'Revenue' },
      options: {},
    };

    essbaseConfig = {
      source: 'essbase',
      cubeName: 'Finance',
      dimensionMapping: { D1: 'Account', D2: 'Period' },
      measureMapping: { Value: 'Revenue' },
      options: {},
    };

    tm1Config = {
      source: 'tm1',
      cubeName: 'Finance',
      dimensionMapping: { D1: 'Account', D2: 'Period', D3: 'Scenario' },
      measureMapping: { Value: 'Revenue' },
      options: {},
    };

    ssasConfig = {
      source: 'ssas',
      cubeName: 'Finance',
      dimensionMapping: { D1: 'Account', D2: 'Period' },
      measureMapping: { Value: 'Revenue' },
      options: {},
    };
  });

  describe('migrateFromCSV', () => {
    it('should import valid CSV data', () => {
      const csv = 'Region,Product,Revenue\nEast,Widget,1000\nWest,Gadget,2000';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.success).toBe(true);
      expect(result.sourceSystem).toBe('csv');
      expect(result.cubeName).toBe('Finance');
      expect(result.cellsImported).toBe(2);
      expect(result.membersAdded).toBeGreaterThan(0);
    });

    it('should fail when CSV has no data rows', () => {
      const csv = 'Region,Product,Revenue';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result!.errors[0]!.message).toContain('at least a header and one data row');
    });

    it('should report row column mismatch errors', () => {
      const csv = 'Region,Product,Revenue\nEast,Widget,1000\nWest';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.errors.some((e) => e.message.includes('columns'))).toBe(true);
    });

    it('should handle custom delimiter', () => {
      const tabConfig = { ...csvConfig, options: { delimiter: '\t' } };
      const tsv = 'Region\tProduct\tRevenue\nEast\tWidget\t1000';
      const result = engine.migrateFromCSV(tabConfig, tsv);
      expect(result.success).toBe(true);
      expect(result.cellsImported).toBe(1);
    });

    it('should warn on non-numeric measure values', () => {
      const csv = 'Region,Product,Revenue\nEast,Widget,notanumber';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.errors.some((e) => e.severity === 'warning')).toBe(true);
    });

    it('should strip quotes from values', () => {
      const csv = '"Region","Product","Revenue"\n"East","Widget","1000"';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.success).toBe(true);
      expect(result.cellsImported).toBe(1);
    });

    it('should skip unmapped columns', () => {
      const csv = 'Region,Product,Revenue,Notes\nEast,Widget,1000,hello';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.success).toBe(true);
    });

    it('should report durationMs >= 0', () => {
      const csv = 'Region,Product,Revenue\nEast,Widget,1000';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('migrateFromJSON', () => {
    it('should import valid JSON array', () => {
      const json = JSON.stringify([
        { region: 'East', product: 'Widget', revenue: 1000 },
        { region: 'West', product: 'Gadget', revenue: 2000 },
      ]);
      const result = engine.migrateFromJSON(jsonConfig, json);
      expect(result.success).toBe(true);
      expect(result.sourceSystem).toBe('json');
      expect(result.cellsImported).toBe(2);
    });

    it('should fail on invalid JSON', () => {
      const result = engine.migrateFromJSON(jsonConfig, 'not json{{{');
      expect(result.success).toBe(false);
      expect(result!.errors[0]!.message).toContain('Invalid JSON');
    });

    it('should fail when JSON is not an array', () => {
      const result = engine.migrateFromJSON(jsonConfig, '{"region":"East"}');
      expect(result.success).toBe(false);
      expect(result!.errors[0]!.message).toContain('must be an array');
    });

    it('should handle empty array', () => {
      const result = engine.migrateFromJSON(jsonConfig, '[]');
      expect(result.success).toBe(true);
      expect(result.cellsImported).toBe(0);
    });

    it('should skip non-string dimension values', () => {
      const json = JSON.stringify([{ region: 123, revenue: 1000 }]);
      const result = engine.migrateFromJSON(jsonConfig, json);
      expect(result.cellsImported).toBe(1);
    });

    it('should skip non-number measure values', () => {
      const json = JSON.stringify([{ region: 'East', revenue: 'notanum' }]);
      const result = engine.migrateFromJSON(jsonConfig, json);
      expect(result.cellsImported).toBe(0);
    });
  });

  describe('migrateFromEssbase', () => {
    it('should parse Essbase-style data', () => {
      const data = 'Account,Period,Value\nRevenue,2024,1000\nCOGS,2024,600';
      const result = engine.migrateFromEssbase(essbaseConfig, data);
      expect(result.success).toBe(true);
      expect(result.sourceSystem).toBe('essbase');
      // Header + 2 data lines all have 2+ parts
      expect(result.cellsImported).toBe(3);
    });

    it('should skip comment lines', () => {
      const data = '# This is a comment\nRevenue,2024,1000';
      const result = engine.migrateFromEssbase(essbaseConfig, data);
      expect(result.success).toBe(true);
      expect(result.cellsImported).toBe(1);
    });

    it('should handle empty data', () => {
      const result = engine.migrateFromEssbase(essbaseConfig, '');
      expect(result.success).toBe(true);
      expect(result.cellsImported).toBe(0);
    });
  });

  describe('migrateFromTM1', () => {
    it('should parse TM1-style data', () => {
      const data = 'Account,Period,Scenario,Value\nRevenue,2024,Actual,1000';
      const result = engine.migrateFromTM1(tm1Config, data);
      expect(result.success).toBe(true);
      expect(result.sourceSystem).toBe('tm1');
      // Header + data line both have 3+ parts
      expect(result.cellsImported).toBe(2);
    });

    it('should skip comment lines but count data lines', () => {
      const data = '# TM1 export\nAccount,Period,Scenario,Value\nRevenue,2024,Actual,1000';
      const result = engine.migrateFromTM1(tm1Config, data);
      expect(result.success).toBe(true);
      // Both the header and data line have 3+ parts, so both are counted
      expect(result.cellsImported).toBe(2);
    });
  });

  describe('migrateFromSSAS', () => {
    it('should parse tab-delimited SSAS data', () => {
      const data = 'Account\tPeriod\tValue\nRevenue\t2024\t1000';
      const result = engine.migrateFromSSAS(ssasConfig, data);
      expect(result.success).toBe(true);
      expect(result.sourceSystem).toBe('ssas');
      // Both header and data line have 2+ parts, so both are counted
      expect(result.cellsImported).toBe(2);
    });

    it('should handle empty data', () => {
      const result = engine.migrateFromSSAS(ssasConfig, '');
      expect(result.success).toBe(true);
      expect(result.cellsImported).toBe(0);
    });
  });

  describe('migration history', () => {
    it('should track migration history', () => {
      const csv = 'Region,Revenue\nEast,100';
      engine.migrateFromCSV(csvConfig, csv);
      engine.migrateFromCSV(csvConfig, csv);
      expect(engine.getMigrationHistory()).toHaveLength(2);
    });

    it('should return last migration', () => {
      const csv = 'Region,Revenue\nEast,100';
      engine.migrateFromCSV(csvConfig, csv);
      const last = engine.getLastMigration();
      expect(last).toBeDefined();
      expect(last!.sourceSystem).toBe('csv');
    });

    it('should clear history', () => {
      const csv = 'Region,Revenue\nEast,100';
      engine.migrateFromCSV(csvConfig, csv);
      engine.clearHistory();
      expect(engine.getMigrationHistory()).toHaveLength(0);
    });

    it('should return undefined when no migrations', () => {
      expect(engine.getLastMigration()).toBeUndefined();
    });
  });

  describe('dimensionsCreated', () => {
    it('should list mapped dimension names', () => {
      const csv = 'Region,Product,Revenue\nEast,Widget,1000';
      const result = engine.migrateFromCSV(csvConfig, csv);
      expect(result.dimensionsCreated).toContain('Geography');
      expect(result.dimensionsCreated).toContain('Product');
    });
  });
});
