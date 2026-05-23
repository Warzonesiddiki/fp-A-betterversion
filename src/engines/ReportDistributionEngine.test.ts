/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ReportDistributionEngine } from './ReportDistributionEngine';

describe('ReportDistributionEngine', () => {
  let engine: ReportDistributionEngine;

  beforeEach(() => {
    engine = new ReportDistributionEngine();
  });

  describe('distribute', () => {
    it('distributes a report to recipients', () => {
      const result = engine.distribute({
        reportId: 'rpt-1',
        recipients: ['user1@test.com', 'user2@test.com'],
        format: 'pdf',
        subject: 'Monthly Report',
      });
      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
    });

    it('handles empty recipients', () => {
      const result = engine.distribute({
        reportId: 'rpt-1',
        recipients: [],
        format: 'pdf',
      });
      expect(result.success).toBe(true);
      expect(result.sent).toBe(0);
    });
  });

  describe('getDeliveryHistory', () => {
    it('returns distribution history', () => {
      engine.distribute({ reportId: 'rpt-1', recipients: ['a@b.com'], format: 'pdf' });
      const history = engine.getDeliveryHistory();
      expect(history.length).toBe(1);
    });
  });
});
