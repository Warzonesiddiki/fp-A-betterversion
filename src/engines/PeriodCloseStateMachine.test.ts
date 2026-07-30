/**
 * Period Close State Machine tests (F-0004).
 *
 * These tests verify the period close state machine enforces:
 *   - Valid state transitions: open → soft-close → hard-close → locked
 *   - Reopen requires approval
 *   - Force-reopen requires admin role
 *   - No posting to closed/locked periods
 *   - Reversal-only corrections in hard-close
 *   - No reversals in locked periods
 *   - Every transition produces an audit event
 */
import { describe, it, expect } from 'vitest';
import {
  PeriodCloseStateMachine,
  type PeriodCloseEntry,
  type PeriodCloseState,
  type PeriodCloseTransition,
} from './PeriodCloseStateMachine';

const BASE_ENTRY: PeriodCloseEntry = {
  periodId: '2026-Q2',
  entityId: 'entity-1',
  state: 'open',
  auditEvents: [],
};

describe('F-0004: Period Close State Machine', () => {
  // -------------------------------------------------------------------------
  // Valid transitions
  // -------------------------------------------------------------------------
  describe('valid transitions', () => {
    it('open → soft-close is valid', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'soft-close')).toBe(true);
    });

    it('soft-close → hard-close is valid', () => {
      expect(PeriodCloseStateMachine.canTransition('soft-close', 'hard-close')).toBe(true);
    });

    it('soft-close → reopen is valid', () => {
      expect(PeriodCloseStateMachine.canTransition('soft-close', 'reopen')).toBe(true);
    });

    it('hard-close → lock is valid', () => {
      expect(PeriodCloseStateMachine.canTransition('hard-close', 'lock')).toBe(true);
    });

    it('hard-close → reopen is valid', () => {
      expect(PeriodCloseStateMachine.canTransition('hard-close', 'reopen')).toBe(true);
    });

    it('locked → force-reopen is valid', () => {
      expect(PeriodCloseStateMachine.canTransition('locked', 'force-reopen')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Invalid transitions
  // -------------------------------------------------------------------------
  describe('invalid transitions', () => {
    it('open → hard-close is NOT valid (must go through soft-close)', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'hard-close')).toBe(false);
    });

    it('open → lock is NOT valid', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'lock')).toBe(false);
    });

    it('open → reopen is NOT valid (already open)', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'reopen')).toBe(false);
    });

    it('locked → soft-close is NOT valid', () => {
      expect(PeriodCloseStateMachine.canTransition('locked', 'soft-close')).toBe(false);
    });

    it('locked → hard-close is NOT valid', () => {
      expect(PeriodCloseStateMachine.canTransition('locked', 'hard-close')).toBe(false);
    });

    it('locked → reopen is NOT valid (must use force-reopen)', () => {
      expect(PeriodCloseStateMachine.canTransition('locked', 'reopen')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Transition execution
  // -------------------------------------------------------------------------
  describe('transition execution', () => {
    it('open → soft-close produces correct result', () => {
      const result = PeriodCloseStateMachine.transition(BASE_ENTRY, 'soft-close', 'user-1');
      expect(result.success).toBe(true);
      expect(result.newState).toBe('soft-close');
      expect(result.auditEvent).toBeDefined();
      expect(result.auditEvent!.fromState).toBe('open');
      expect(result.auditEvent!.toState).toBe('soft-close');
      expect(result.auditEvent!.actorId).toBe('user-1');
    });

    it('soft-close → hard-close produces correct result', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'soft-close' };
      const result = PeriodCloseStateMachine.transition(entry, 'hard-close', 'user-1');
      expect(result.success).toBe(true);
      expect(result.newState).toBe('hard-close');
    });

    it('hard-close → locked produces correct result', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'hard-close' };
      const result = PeriodCloseStateMachine.transition(entry, 'lock', 'user-1');
      expect(result.success).toBe(true);
      expect(result.newState).toBe('locked');
    });

    it('invalid transition returns error', () => {
      const result = PeriodCloseStateMachine.transition(BASE_ENTRY, 'hard-close', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.newState).toBe('open');
    });
  });

  // -------------------------------------------------------------------------
  // Reopen approval
  // -------------------------------------------------------------------------
  describe('reopen requires approval', () => {
    it('soft-close → reopen fails without approvalId', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'soft-close' };
      const result = PeriodCloseStateMachine.transition(entry, 'reopen', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('approval');
    });

    it('soft-close → reopen succeeds with approvalId', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'soft-close' };
      const result = PeriodCloseStateMachine.transition(entry, 'reopen', 'user-1', {
        approvalId: 'approval-123',
        reason: 'Correction needed',
      });
      expect(result.success).toBe(true);
      expect(result.newState).toBe('open');
      expect(result.auditEvent!.approvalId).toBe('approval-123');
      expect(result.auditEvent!.reason).toBe('Correction needed');
    });

    it('hard-close → reopen fails without approvalId', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'hard-close' };
      const result = PeriodCloseStateMachine.transition(entry, 'reopen', 'user-1');
      expect(result.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Force reopen
  // -------------------------------------------------------------------------
  describe('force-reopen requires admin', () => {
    it('locked → force-reopen fails without approvalId', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'locked' };
      const result = PeriodCloseStateMachine.transition(entry, 'force-reopen', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('approval');
    });

    it('locked → force-reopen fails without admin role', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'locked' };
      const result = PeriodCloseStateMachine.transition(entry, 'force-reopen', 'user-1', {
        approvalId: 'approval-456',
        actorRole: 'viewer',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('admin');
    });

    it('locked → force-reopen succeeds with admin role and approval', () => {
      const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: 'locked' };
      const result = PeriodCloseStateMachine.transition(entry, 'force-reopen', 'admin-1', {
        approvalId: 'approval-789',
        actorRole: 'admin',
        reason: 'Audit finding correction',
      });
      expect(result.success).toBe(true);
      expect(result.newState).toBe('open');
    });
  });

  // -------------------------------------------------------------------------
  // Posting rules
  // -------------------------------------------------------------------------
  describe('posting rules', () => {
    it('posting is allowed in open period', () => {
      const result = PeriodCloseStateMachine.canPost('open');
      expect(result.allowed).toBe(true);
    });

    it('posting is allowed in soft-close period (with warning)', () => {
      const result = PeriodCloseStateMachine.canPost('soft-close');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('posting is NOT allowed in hard-close period', () => {
      const result = PeriodCloseStateMachine.canPost('hard-close');
      expect(result.allowed).toBe(false);
    });

    it('posting is NOT allowed in locked period', () => {
      const result = PeriodCloseStateMachine.canPost('locked');
      expect(result.allowed).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Reversal rules
  // -------------------------------------------------------------------------
  describe('reversal-only corrections', () => {
    it('reversal is allowed in open period', () => {
      expect(PeriodCloseStateMachine.canReverse('open').allowed).toBe(true);
    });

    it('reversal is allowed in soft-close period', () => {
      expect(PeriodCloseStateMachine.canReverse('soft-close').allowed).toBe(true);
    });

    it('reversal is allowed in hard-close period (reversal-only correction)', () => {
      const result = PeriodCloseStateMachine.canReverse('hard-close');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Reversal-only');
    });

    it('reversal is NOT allowed in locked period', () => {
      expect(PeriodCloseStateMachine.canReverse('locked').allowed).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Audit events
  // -------------------------------------------------------------------------
  describe('audit events', () => {
    it('every successful transition produces an audit event', () => {
      const transitions: Array<{
        from: PeriodCloseState;
        transition: PeriodCloseTransition;
        options?: Parameters<typeof PeriodCloseStateMachine.transition>[3];
      }> = [
        { from: 'open', transition: 'soft-close' },
        { from: 'soft-close', transition: 'hard-close' },
        { from: 'hard-close', transition: 'lock' },
        { from: 'soft-close', transition: 'reopen', options: { approvalId: 'a1' } },
        { from: 'hard-close', transition: 'reopen', options: { approvalId: 'a2' } },
        {
          from: 'locked',
          transition: 'force-reopen',
          options: { approvalId: 'a3', actorRole: 'admin' },
        },
      ];

      for (const { from, transition, options } of transitions) {
        const entry: PeriodCloseEntry = { ...BASE_ENTRY, state: from };
        const result = PeriodCloseStateMachine.transition(entry, transition, 'user-1', options);
        expect(result.success, `Transition ${from} → ${transition} should succeed`).toBe(true);
        expect(
          result.auditEvent,
          `Transition ${from} → ${transition} should produce audit event`
        ).toBeDefined();
        expect(result.auditEvent!.fromState).toBe(from);
        expect(result.auditEvent!.toState).toBe(result.newState);
        expect(result.auditEvent!.periodId).toBe(BASE_ENTRY.periodId);
        expect(result.auditEvent!.timestamp).toBeTruthy();
        expect(result.auditEvent!.id).toBeTruthy();
      }
    });
  });

  // -------------------------------------------------------------------------
  // Helper methods
  // -------------------------------------------------------------------------
  describe('helper methods', () => {
    it('createEntry produces open state', () => {
      const entry = PeriodCloseStateMachine.createEntry('2026-Q3', 'entity-2');
      expect(entry.state).toBe('open');
      expect(entry.periodId).toBe('2026-Q3');
      expect(entry.entityId).toBe('entity-2');
      expect(entry.auditEvents).toEqual([]);
    });

    it('getValidTransitions returns correct transitions', () => {
      expect(PeriodCloseStateMachine.getValidTransitions('open')).toEqual(['soft-close']);
      expect(PeriodCloseStateMachine.getValidTransitions('soft-close')).toEqual([
        'hard-close',
        'reopen',
      ]);
      expect(PeriodCloseStateMachine.getValidTransitions('hard-close')).toEqual(['lock', 'reopen']);
      expect(PeriodCloseStateMachine.getValidTransitions('locked')).toEqual(['force-reopen']);
    });

    it('getStateLabel returns human-readable labels', () => {
      expect(PeriodCloseStateMachine.getStateLabel('open')).toBe('Open');
      expect(PeriodCloseStateMachine.getStateLabel('soft-close')).toBe('Soft Close');
      expect(PeriodCloseStateMachine.getStateLabel('hard-close')).toBe('Hard Close');
      expect(PeriodCloseStateMachine.getStateLabel('locked')).toBe('Locked');
    });

    it('requiresApproval is correct for each transition', () => {
      expect(PeriodCloseStateMachine.requiresApproval('soft-close')).toBe(false);
      expect(PeriodCloseStateMachine.requiresApproval('hard-close')).toBe(false);
      expect(PeriodCloseStateMachine.requiresApproval('lock')).toBe(false);
      expect(PeriodCloseStateMachine.requiresApproval('reopen')).toBe(true);
      expect(PeriodCloseStateMachine.requiresApproval('force-reopen')).toBe(true);
    });
  });
});
