/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { XBRLEngine } from './XBRLEngine';

describe('XBRLEngine', () => {
  beforeEach(() => {
    XBRLEngine.reset();
  });

  describe('mapAccount and update', () => {
    it('maps account to XBRL tag and updates existing mapping', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      let mappings = XBRLEngine.getMappings();
      expect(mappings.length).toBe(1);
      expect(mappings[0]!.accountId).toBe('acc-1');

      // Update mapping
      XBRLEngine.mapAccount('acc-1', 'cogs', 'ifrs');
      mappings = XBRLEngine.getMappings();
      expect(mappings.length).toBe(1);
      expect(mappings[0]!.tagName).toBe('cogs');
      expect(mappings[0]!.taxonomy).toBe('ifrs');
    });
  });

  describe('autoMap', () => {
    it('auto-maps accounts based on name keywords', () => {
      const accounts = [
        { id: '1000', type: 'asset', name: 'Cash and Cash Equivalents' },
        { id: '1500', type: 'asset', name: 'Total Asset Base' },
        { id: '2000', type: 'liability', name: 'Total Liabilities & Provisions' },
        { id: '2500', type: 'liability', name: 'Long Term Loan / Debt' },
        { id: '3000', type: 'equity', name: 'Common Equity & Retained Earnings' },
        { id: '4000', type: 'revenue', name: 'Gross Product Sales / Revenue' },
        { id: '5000', type: 'expense', name: 'Cost of Goods Sold (COGS)' },
        { id: '5100', type: 'expense', name: 'Gross Profit Marker' },
        { id: '6000', type: 'expense', name: 'General Operating Expense' },
        { id: '7000', type: 'income', name: 'Consolidated Net Income' },
        { id: '9999', type: 'other', name: 'Uncategorized Suspense' },
      ];

      const mappedCount = XBRLEngine.autoMap(accounts);
      expect(mappedCount).toBe(10);
      expect(XBRLEngine.getMappings().length).toBe(10);
    });
  });

  describe('generateFacts and exportXML', () => {
    it('generates XBRL facts from mapped data and handles unmapped accounts gracefully', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      XBRLEngine.mapAccount('acc-2', 'totalAssets', 'us-gaap');

      const facts = XBRLEngine.generateFacts([
        { accountId: 'acc-1', value: 100000, period: '2026-01', entity: 'entity-1' },
        { accountId: 'acc-2', value: 500000, period: '2026-01', entity: 'entity-1' },
        { accountId: 'acc-unmapped', value: 50, period: '2026-01', entity: 'entity-1' },
      ]);
      expect(facts.length).toBe(2);
      expect(facts[0]!.value).toBe(100000);

      const xml = XBRLEngine.exportXML(facts);
      expect(xml).toContain('<?xml');
      expect(xml).toContain('xbrli:xbrl');
      expect(xml).toContain('us-gaap:Revenues');
      expect(xml).toContain('us-gaap:Total Assets');
      expect(xml).toContain('contextRef="entity-1_2026-01"');
      expect(xml).toContain('iso4217:USD');
    });
  });

  describe('validateMappings', () => {
    it('validates mapping completeness', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      const result = XBRLEngine.validateMappings([{ id: 'acc-1' }, { id: 'acc-2' }]);
      expect(result.mapped).toBe(1);
      expect(result.unmapped).toContain('acc-2');
    });
  });

  describe('reset', () => {
    it('clears all data', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      XBRLEngine.reset();
      expect(XBRLEngine.getMappings().length).toBe(0);
    });
  });
});
