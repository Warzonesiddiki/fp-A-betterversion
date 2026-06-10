import { describe, it, expect, beforeEach } from 'vitest';
import { DataCatalogEngine } from './DataCatalogEngine';

describe('DataCatalogEngine', () => {
  let engine: DataCatalogEngine;

  beforeEach(() => {
    engine = new DataCatalogEngine();
  });

  describe('addAsset', () => {
    it('should add a data asset', () => {
      engine.addAsset({
        id: 'asset1',
        name: 'Revenue Table',
        type: 'table',
        description: 'Monthly revenue data',
        owner: 'Finance',
        tags: ['revenue', 'monthly'],
        schema: [{ name: 'amount', type: 'number', nullable: false }],
        source: 'ERP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {},
      });
      const asset = engine.getAsset('asset1');
      expect(asset).toBeDefined();
      expect(asset!.name).toBe('Revenue Table');
    });
  });

  describe('search', () => {
    it('should find assets by name', () => {
      engine.addAsset({
        id: 'asset1',
        name: 'Revenue Table',
        type: 'table',
        description: 'Monthly revenue data',
        owner: 'Finance',
        tags: ['revenue'],
        schema: [],
        source: 'ERP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {},
      });
      const results = engine.search('Revenue');
      expect(results.length).toBeGreaterThan(0);
      expect(results![0]!.asset.name).toBe('Revenue Table');
    });
  });

  describe('removeAsset', () => {
    it('should remove an asset', () => {
      engine.addAsset({
        id: 'asset1',
        name: 'Test',
        type: 'table',
        description: '',
        owner: '',
        tags: [],
        schema: [],
        source: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {},
      });
      expect(engine.removeAsset('asset1')).toBe(true);
      expect(engine.getAsset('asset1')).toBeUndefined();
    });
  });
});
