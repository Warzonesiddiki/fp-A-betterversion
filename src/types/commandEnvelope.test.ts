import { describe, expect, it } from 'vitest';
import { createCommandEnvelope, COMMAND_TYPES } from './commandEnvelope';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('createCommandEnvelope (F-04 client mirror)', () => {
  it('builds a complete envelope with generated ids', () => {
    const envelope = createCommandEnvelope('plan.upsert', 'ent-1', { amount: 100 });
    expect(UUID_PATTERN.test(envelope.commandId)).toBe(true);
    expect(UUID_PATTERN.test(envelope.correlationId)).toBe(true);
    expect(UUID_PATTERN.test(envelope.idempotencyKey)).toBe(true);
    expect(envelope.commandType).toBe('plan.upsert');
    expect(envelope.scope).toEqual({ entityId: 'ent-1' });
    expect(envelope.payload).toEqual({ amount: 100 });
    expect(envelope.baseRevision).toBeNull();
    expect(new Date(envelope.timestamp).getTime()).not.toBeNaN();
  });

  it('honours provided correlation and idempotency keys (replay support)', () => {
    const envelope = createCommandEnvelope(
      'close.certify',
      'ent-2',
      {},
      {
        correlationId: 'corr-abc',
        idempotencyKey: 'idem-xyz',
        baseRevision: 'r7',
      }
    );
    expect(envelope.correlationId).toBe('corr-abc');
    expect(envelope.idempotencyKey).toBe('idem-xyz');
    expect(envelope.baseRevision).toBe('r7');
  });

  it('generates unique ids per envelope', () => {
    const a = createCommandEnvelope('report.publish', 'ent-1', {});
    const b = createCommandEnvelope('report.publish', 'ent-1', {});
    expect(a.commandId).not.toBe(b.commandId);
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey);
  });

  it('exposes only supported command types', () => {
    expect(COMMAND_TYPES).toContain('plan.upsert');
    expect(COMMAND_TYPES).toContain('close.certify');
    expect(COMMAND_TYPES).toContain('report.publish');
    expect(COMMAND_TYPES).toContain('masterdata.update');
  });
});
