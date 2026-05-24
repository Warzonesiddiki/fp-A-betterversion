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
      const r1 = engine.addRecipient('Alice', 'alice@test.com');
      const r2 = engine.addRecipient('Bob', 'bob@test.com');
      const list = engine.createDistributionList('Monthly', 'Monthly report', [r1.id, r2.id]);
      const result = engine.recordDelivery('rpt-1', list.id, {
        method: 'email',
        subject: 'Monthly Report',
        attachFormats: ['pdf'],
        priority: 'normal',
        retryOnFailure: false,
        maxRetries: 0,
      });
      expect(result.status).toBe('sent');
      expect(result.recipientCount).toBe(2);
    });

    it('handles empty recipients', () => {
      const list = engine.createDistributionList('Empty', 'No recipients', []);
      const result = engine.recordDelivery('rpt-1', list.id, {
        method: 'email',
        attachFormats: ['pdf'],
        priority: 'normal',
        retryOnFailure: false,
        maxRetries: 0,
      });
      expect(result.status).toBe('sent');
      expect(result.recipientCount).toBe(0);
    });
  });

  describe('getDeliveryHistory', () => {
    it('returns distribution history', () => {
      const r1 = engine.addRecipient('Alice', 'a@b.com');
      const list = engine.createDistributionList('Test', '', [r1.id]);
      engine.recordDelivery('rpt-1', list.id, {
        method: 'email',
        attachFormats: ['pdf'],
        priority: 'normal',
        retryOnFailure: false,
        maxRetries: 0,
      });
      const history = engine.getDeliveryHistory();
      expect(history.length).toBe(1);
    });
  });
});
