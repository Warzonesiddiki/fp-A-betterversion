/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { XBRLEngine } from './XBRLEngine';

describe('XBRLEngine', () => {
  beforeEach(() => {
    XBRLEngine.reset();
  });

  describe('mapAccount', () => {
    it('maps account to XBRL tag', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      const mappings = XBRLEngine.getMappings();
      expect(mappings.length).toBe(1);
      expect(mappings![0]!.accountId).toBe('acc-1');
    });
  });

  describe('generateFacts', () => {
    it('generates XBRL facts from mapped data', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      const facts = XBRLEngine.generateFacts([
        { accountId: 'acc-1', value: 100000, period: '2026-01', entity: 'entity-1' },
      ]);
      expect(facts.length).toBe(1);
      expect(facts![0]!.value).toBe(100000);
    });
  });

  describe('exportXML', () => {
    it('exports facts as XBRL XML', () => {
      XBRLEngine.mapAccount('acc-1', 'revenue', 'us-gaap');
      const facts = XBRLEngine.generateFacts([
        { accountId: 'acc-1', value: 100000, period: '2026-01', entity: 'entity-1' },
      ]);
      const xml = XBRLEngine.exportXML(facts);
      expect(xml).toContain('<?xml');
      expect(xml).toContain('xbrli:xbrl');
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
