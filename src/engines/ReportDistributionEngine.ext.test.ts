/**
 * ReportDistributionEngine.ext.test.ts — recipients, distribution lists,
 * delivery recording (MISSION D wave 2, 2026-08-07).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ReportDistributionEngine, type DeliveryConfig } from './ReportDistributionEngine';

const config: DeliveryConfig = {
  method: 'email',
  subject: 'Monthly Pack',
  attachFormats: ['pdf', 'excel'],
  priority: 'high',
  retryOnFailure: true,
  maxRetries: 3,
};

describe('ReportDistributionEngine — recipients', () => {
  let e: ReportDistributionEngine;
  beforeEach(() => {
    e = new ReportDistributionEngine();
  });

  it('recipient CRUD with roles and active flag', () => {
    const r = e.addRecipient('Alice', 'alice@corp.com', 'finance');
    expect(r.id).toMatch(/^rcpt-/);
    expect(r.active).toBe(true);
    expect(e.getRecipient(r.id)?.email).toBe('alice@corp.com');
    expect(e.listRecipients()).toHaveLength(1);
    expect(e.updateRecipient(r.id, { active: false, email: 'a@b.c' })!.active).toBe(false);
    expect(e.updateRecipient('nope', {})).toBeNull();
    expect(e.deleteRecipient(r.id)).toBe(true);
    expect(e.deleteRecipient(r.id)).toBe(false);
  });
});

describe('ReportDistributionEngine — lists & delivery', () => {
  let e: ReportDistributionEngine;
  let alice: string;
  let bob: string;
  let listId: string;

  beforeEach(() => {
    e = new ReportDistributionEngine();
    alice = e.addRecipient('Alice', 'a@x.com', 'finance').id;
    bob = e.addRecipient('Bob', 'b@x.com', 'viewer').id;
    const list = e.createDistributionList('Board', 'exec pack', [alice]);
    listId = list.id;
  });

  it('distribution list management', () => {
    expect(e.getDistributionList(listId)?.recipientIds).toEqual([alice]);
    expect(e.listDistributionLists()).toHaveLength(1);
    expect(e.addToDistributionList(listId, bob)).toBe(true);
    expect(e.addToDistributionList(listId, bob)).toBe(false); // duplicate
    expect(e.addToDistributionList('nope', alice)).toBe(false);
    expect(e.removeFromDistributionList(listId, bob)).toBe(true);
    expect(e.removeFromDistributionList(listId, bob)).toBe(false);
    expect(e.removeFromDistributionList('nope', alice)).toBe(false);
    expect(e.deleteDistributionList(listId)).toBe(true);
    expect(e.deleteDistributionList(listId)).toBe(false);
  });

  it('recordDelivery counts only active recipients', () => {
    const rec = e.recordDelivery('report-1', listId, config);
    expect(rec.status).toBe('sent');
    expect(rec.recipientCount).toBe(1);
    expect(rec.deliveredCount).toBe(1);
    expect(rec.failedCount).toBe(0);
    expect(rec.method).toBe('email');
    // deactivate alice → next delivery counts 0
    e.updateRecipient(alice, { active: false });
    const rec2 = e.recordDelivery('report-1', listId, config);
    expect(rec2.recipientCount).toBe(0);
    // unknown list → 0 recipients
    const rec3 = e.recordDelivery('report-1', 'nope', config);
    expect(rec3.recipientCount).toBe(0);
  });

  it('updateDeliveryStatus flips delivered/failed and stats', () => {
    const rec = e.recordDelivery('report-1', listId, config);
    expect(e.updateDeliveryStatus(rec.id, 'delivered')!.status).toBe('delivered');
    const rec2 = e.recordDelivery('report-1', listId, config);
    e.updateDeliveryStatus(rec2.id, 'failed', 'smtp down');
    expect(e.getDeliveryHistory('report-1')).toHaveLength(2);
    expect(e.getDeliveryHistory('nope')).toHaveLength(0);
    const stats = e.getDeliveryStats();
    expect(stats.totalSent).toBe(2);
    expect(stats.totalDelivered).toBe(1);
    expect(stats.totalFailed).toBe(1);
    expect(e.updateDeliveryStatus('nope', 'failed')).toBeNull();
  });

  it('serialize / deserialize round-trips', () => {
    e.recordDelivery('report-1', listId, config);
    const json = e.serialize();
    const e2 = new ReportDistributionEngine();
    e2.deserialize(json);
    expect(e2.listRecipients()).toHaveLength(2);
    expect(e2.listDistributionLists()).toHaveLength(1);
    expect(e2.getDeliveryHistory()).toHaveLength(1);
  });
});
