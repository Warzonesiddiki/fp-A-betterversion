/**
 * Write-Back Service — Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createTransaction,
  createOperation,
  createMetadata,
  validateOperations,
  chunkOperations,
  buildBudgetWriteBack,
  buildJournalEntryWriteBack,
} from '../writeback';
import type { WriteBackOperation, WriteBackRecordType } from '@/types/writeback';

describe('writeback service', () => {
  const mockMetadata = createMetadata('user-1', 'budget-store', 'bgt-001', 1);

  describe('createTransaction', () => {
    it('creates a transaction with correct status', () => {
      const op = createOperation('budget', 'create', {
        recordType: 'budget',
        fields: { name: 'Test Budget' },
        metadata: mockMetadata,
      });
      const txn = createTransaction('quickbooks', [op]);

      expect(txn.id).toBeTruthy();
      expect(txn.connectorId).toBe('quickbooks');
      expect(txn.status).toBe('pending');
      expect(txn.operations).toHaveLength(1);
      expect(txn.error).toBeNull();
    });
  });

  describe('createOperation', () => {
    it('creates a create operation', () => {
      const op = createOperation('budget', 'create', {
        recordType: 'budget',
        fields: { name: 'FY2026 Budget' },
        metadata: mockMetadata,
      });

      expect(op.id).toBeTruthy();
      expect(op.recordType).toBe('budget');
      expect(op.action).toBe('create');
      expect(op.externalId).toBeNull();
      expect(op.retryCount).toBe(0);
      expect(op.maxRetries).toBe(3);
    });

    it('creates an update operation with external ID', () => {
      const op = createOperation(
        'journal-entry',
        'update',
        {
          recordType: 'journal-entry',
          fields: { amount: 1000 },
          metadata: mockMetadata,
        },
        'ext-123'
      );

      expect(op.action).toBe('update');
      expect(op.externalId).toBe('ext-123');
    });
  });

  describe('validateOperations', () => {
    const supportedTypes: WriteBackRecordType[] = ['budget', 'journal-entry', 'invoice'];

    it('returns no errors for valid operations', () => {
      const ops: WriteBackOperation[] = [
        createOperation('budget', 'create', {
          recordType: 'budget',
          fields: { name: 'Test' },
          metadata: mockMetadata,
        }),
      ];
      const errors = validateOperations(ops, supportedTypes);
      expect(errors).toHaveLength(0);
    });

    it('returns error for unsupported record type', () => {
      const ops: WriteBackOperation[] = [
        createOperation('forecast' as WriteBackRecordType, 'create', {
          recordType: 'forecast' as WriteBackRecordType,
          fields: {},
          metadata: mockMetadata,
        }),
      ];
      const errors = validateOperations(ops, supportedTypes);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('UNSUPPORTED_RECORD_TYPE');
    });

    it('returns error for update without external ID', () => {
      const ops: WriteBackOperation[] = [
        createOperation('budget', 'update', {
          recordType: 'budget',
          fields: { name: 'Updated' },
          metadata: mockMetadata,
        }),
      ];
      const errors = validateOperations(ops, supportedTypes);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('MISSING_EXTERNAL_ID');
    });

    it('returns error for missing user ID in metadata', () => {
      const ops: WriteBackOperation[] = [
        createOperation('budget', 'create', {
          recordType: 'budget',
          fields: { name: 'Test' },
          metadata: { ...mockMetadata, userId: '' },
        }),
      ];
      const errors = validateOperations(ops, supportedTypes);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('MISSING_USER_ID');
    });
  });

  describe('chunkOperations', () => {
    it('splits operations into chunks', () => {
      const ops = Array.from({ length: 125 }, (_, i) =>
        createOperation('budget', 'create', {
          recordType: 'budget',
          fields: { name: `Budget ${i}` },
          metadata: mockMetadata,
        })
      );
      const chunks = chunkOperations(ops, 50);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(50);
      expect(chunks[1]).toHaveLength(50);
      expect(chunks[2]).toHaveLength(25);
    });
  });

  describe('buildBudgetWriteBack', () => {
    it('creates a budget write-back operation', () => {
      const lineItems = [
        { accountCode: '4000', period: '2026-01', amount: 100000 },
        { accountCode: '5000', period: '2026-01', amount: -50000 },
      ];
      const op = buildBudgetWriteBack('bgt-001', lineItems, mockMetadata);

      expect(op.recordType).toBe('budget');
      expect(op.action).toBe('create');
      expect(op.payload.fields.budgetId).toBe('bgt-001');
    });
  });

  describe('buildJournalEntryWriteBack', () => {
    it('creates a balanced journal entry', () => {
      const entries = [
        { accountCode: '1000', debit: 1000, credit: 0, description: 'Cash receipt' },
        { accountCode: '4000', debit: 0, credit: 1000, description: 'Revenue' },
      ];
      const op = buildJournalEntryWriteBack(entries, mockMetadata);

      expect(op.recordType).toBe('journal-entry');
      expect(op.payload.fields.totalDebit).toBe(1000);
      expect(op.payload.fields.totalCredit).toBe(1000);
    });
  });
});
