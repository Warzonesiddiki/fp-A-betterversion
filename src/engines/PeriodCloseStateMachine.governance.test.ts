import { describe, it, expect } from 'vitest';
import { PeriodCloseStateMachine } from './PeriodCloseStateMachine';
import type { TrialBalanceLine } from './PeriodCloseStateMachine';

/**
 * GOVERNANCE EVIDENCE for cap:close.period-close-state-machine
 *
 * The PeriodCloseStateMachine enforces the period close lifecycle:
 * open → soft-close → hard-close → locked. The governance dimension here
 * is CLOSE CONTROL — no posting to closed/locked periods, trial balance
 * must balance before hard-close/lock, reopening requires approval with
 * audit trail, and every transition emits an audit event. If a period can
 * be posted to after close, financial statements may contain unauthorized
 * adjustments.
 *
 * Tested dimensions:
 * 1. State transition validation
 * 2. Valid transitions per state
 * 3. Posting controls
 * 4. Reversal controls
 * 5. Trial balance checking
 * 6. Approval requirements
 * 7. Audit trail
 * 8. Determinism
 */

describe('PeriodCloseStateMachine — GOVERNANCE (close.period-close-state-machine)', () => {
  describe('1. State transition validation', () => {
    it('canTransition allows open → soft-close', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'soft-close')).toBe(true);
    });

    it('canTransition allows soft-close → hard-close', () => {
      expect(PeriodCloseStateMachine.canTransition('soft-close', 'hard-close')).toBe(true);
    });

    it('canTransition allows hard-close → lock', () => {
      expect(PeriodCloseStateMachine.canTransition('hard-close', 'lock')).toBe(true);
    });

    it('canTransition allows soft-close → reopen', () => {
      expect(PeriodCloseStateMachine.canTransition('soft-close', 'reopen')).toBe(true);
    });

    it('canTransition allows hard-close → reopen', () => {
      expect(PeriodCloseStateMachine.canTransition('hard-close', 'reopen')).toBe(true);
    });

    it('canTransition allows locked → force-reopen', () => {
      expect(PeriodCloseStateMachine.canTransition('locked', 'force-reopen')).toBe(true);
    });

    it('canTransition disallows open → hard-close (skipping soft-close)', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'hard-close')).toBe(false);
    });

    it('canTransition disallows open → lock', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'lock')).toBe(false);
    });

    it('canTransition disallows open → reopen', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'reopen')).toBe(false);
    });

    it('canTransition disallows locked → soft-close', () => {
      expect(PeriodCloseStateMachine.canTransition('locked', 'soft-close')).toBe(false);
    });
  });

  describe('2. Valid transitions per state', () => {
    it('getValidTransitions returns soft-close for open state', () => {
      const transitions = PeriodCloseStateMachine.getValidTransitions('open');
      expect(transitions).toContain('soft-close');
      expect(transitions).not.toContain('hard-close');
    });

    it('getValidTransitions returns hard-close and reopen for soft-close', () => {
      const transitions = PeriodCloseStateMachine.getValidTransitions('soft-close');
      expect(transitions).toContain('hard-close');
      expect(transitions).toContain('reopen');
    });

    it('getValidTransitions returns lock and reopen for hard-close', () => {
      const transitions = PeriodCloseStateMachine.getValidTransitions('hard-close');
      expect(transitions).toContain('lock');
      expect(transitions).toContain('reopen');
    });

    it('getValidTransitions returns force-reopen for locked', () => {
      const transitions = PeriodCloseStateMachine.getValidTransitions('locked');
      expect(transitions).toContain('force-reopen');
    });
  });

  describe('3. Posting controls', () => {
    it('canPost allows posting in open state', () => {
      const result = PeriodCloseStateMachine.canPost('open');
      expect(result.allowed).toBe(true);
    });

    it('canPost allows posting in soft-close state', () => {
      const result = PeriodCloseStateMachine.canPost('soft-close');
      expect(result.allowed).toBe(true);
    });

    it('canPost disallows posting in hard-close state', () => {
      const result = PeriodCloseStateMachine.canPost('hard-close');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('canPost disallows posting in locked state', () => {
      const result = PeriodCloseStateMachine.canPost('locked');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('4. Reversal controls', () => {
    it('canReverse allows reversal in open state', () => {
      const result = PeriodCloseStateMachine.canReverse('open');
      expect(result.allowed).toBe(true);
    });

    it('canReverse allows reversal in soft-close state', () => {
      const result = PeriodCloseStateMachine.canReverse('soft-close');
      expect(result.allowed).toBe(true);
    });

    it('canReverse allows reversal in hard-close state', () => {
      const result = PeriodCloseStateMachine.canReverse('hard-close');
      expect(result.allowed).toBe(true);
    });

    it('canReverse disallows reversal in locked state', () => {
      const result = PeriodCloseStateMachine.canReverse('locked');
      expect(result.allowed).toBe(false);
    });
  });

  describe('5. Trial balance checking', () => {
    it('checkTrialBalance returns balanced for equal debits and credits', () => {
      const lines: TrialBalanceLine[] = [
        { accountId: '1000', debit: 10000, credit: 0 },
        { accountId: '2000', debit: 0, credit: 10000 },
      ];
      const result = PeriodCloseStateMachine.checkTrialBalance(lines);
      expect(result.balanced).toBe(true);
      expect(result.difference).toBe('0.00');
    });

    it('checkTrialBalance returns unbalanced for unequal debits and credits', () => {
      const lines: TrialBalanceLine[] = [
        { accountId: '1000', debit: 10000, credit: 0 },
        { accountId: '2000', debit: 0, credit: 9000 },
      ];
      const result = PeriodCloseStateMachine.checkTrialBalance(lines);
      expect(result.balanced).toBe(false);
      expect(result.difference).not.toBe('0.00');
    });

    it('checkTrialBalance handles empty lines as balanced', () => {
      const result = PeriodCloseStateMachine.checkTrialBalance([]);
      expect(result.balanced).toBe(true);
    });

    it('checkTrialBalance uses decimal arithmetic for large amounts', () => {
      const lines: TrialBalanceLine[] = [
        { accountId: '1000', debit: 999999999999.99, credit: 0 },
        { accountId: '2000', debit: 0, credit: 999999999999.99 },
      ];
      const result = PeriodCloseStateMachine.checkTrialBalance(lines);
      expect(result.balanced).toBe(true);
    });
  });

  describe('6. Approval requirements', () => {
    it('requiresApproval returns true for reopen', () => {
      expect(PeriodCloseStateMachine.requiresApproval('reopen')).toBe(true);
    });

    it('requiresApproval returns true for force-reopen', () => {
      expect(PeriodCloseStateMachine.requiresApproval('force-reopen')).toBe(true);
    });

    it('requiresApproval returns false for soft-close', () => {
      expect(PeriodCloseStateMachine.requiresApproval('soft-close')).toBe(false);
    });

    it('requiresApproval returns false for hard-close', () => {
      expect(PeriodCloseStateMachine.requiresApproval('hard-close')).toBe(false);
    });

    it('requiresApproval returns false for lock', () => {
      expect(PeriodCloseStateMachine.requiresApproval('lock')).toBe(false);
    });

    it('getApprovalRoles returns admin and compliance for reopen', () => {
      const roles = PeriodCloseStateMachine.getApprovalRoles('reopen');
      expect(roles).toContain('admin');
      expect(roles).toContain('compliance');
    });

    it('getApprovalRoles returns admin only for force-reopen', () => {
      const roles = PeriodCloseStateMachine.getApprovalRoles('force-reopen');
      expect(roles).toContain('admin');
      expect(roles).not.toContain('compliance');
    });
  });

  describe('7. Audit trail', () => {
    it('transition creates an audit event', () => {
      const entry = PeriodCloseStateMachine.createEntry('period-1', 'entity-1');
      const result = PeriodCloseStateMachine.transition(entry, 'soft-close', 'user-1');
      expect(result.success).toBe(true);
      expect(result.auditEvent).toBeDefined();
      expect(result.auditEvent!.fromState).toBe('open');
      expect(result.auditEvent!.toState).toBe('soft-close');
    });

    it('transition fails without approval for reopen', () => {
      const entry = PeriodCloseStateMachine.createEntry('period-1', 'entity-1');
      // First soft-close, then try to reopen without approval
      const softClose = PeriodCloseStateMachine.transition(entry, 'soft-close', 'user-1');
      expect(softClose.success).toBe(true);
      const reopenResult = PeriodCloseStateMachine.transition(
        {
          ...entry,
          state: 'soft-close',
          auditEvents: softClose.auditEvent ? [softClose.auditEvent] : [],
        },
        'reopen',
        'user-1'
      );
      expect(reopenResult.success).toBe(false);
      expect(reopenResult.error).toContain('approval');
    });

    it('transition succeeds for reopen with approvalId', () => {
      const entry = PeriodCloseStateMachine.createEntry('period-1', 'entity-1');
      const softClose = PeriodCloseStateMachine.transition(entry, 'soft-close', 'user-1');
      const entryWithState = {
        ...entry,
        state: 'soft-close',
        auditEvents: softClose.auditEvent ? [softClose.auditEvent] : [],
      };
      const reopenResult = PeriodCloseStateMachine.transition(entryWithState, 'reopen', 'user-1', {
        approvalId: 'approval-1',
        actorRole: 'admin',
      });
      expect(reopenResult.success).toBe(true);
    });

    it('getTargetState returns correct target for each transition', () => {
      expect(PeriodCloseStateMachine.getTargetState('soft-close')).toBe('soft-close');
      expect(PeriodCloseStateMachine.getTargetState('hard-close')).toBe('hard-close');
      expect(PeriodCloseStateMachine.getTargetState('lock')).toBe('locked');
      expect(PeriodCloseStateMachine.getTargetState('reopen')).toBe('open');
      expect(PeriodCloseStateMachine.getTargetState('force-reopen')).toBe('open');
    });

    it('getStateLabel returns label for each state', () => {
      expect(PeriodCloseStateMachine.getStateLabel('open')).toBeDefined();
      expect(PeriodCloseStateMachine.getStateLabel('soft-close')).toBeDefined();
      expect(PeriodCloseStateMachine.getStateLabel('hard-close')).toBeDefined();
      expect(PeriodCloseStateMachine.getStateLabel('locked')).toBeDefined();
    });
  });

  describe('8. Determinism', () => {
    it('canTransition is deterministic', () => {
      expect(PeriodCloseStateMachine.canTransition('open', 'soft-close')).toBe(true);
      expect(PeriodCloseStateMachine.canTransition('open', 'soft-close')).toBe(true);
    });

    it('checkTrialBalance is deterministic', () => {
      const lines: TrialBalanceLine[] = [
        { accountId: '1000', debit: 10000, credit: 0 },
        { accountId: '2000', debit: 0, credit: 10000 },
      ];
      const r1 = PeriodCloseStateMachine.checkTrialBalance(lines);
      const r2 = PeriodCloseStateMachine.checkTrialBalance(lines);
      expect(r1).toEqual(r2);
    });

    it('createEntry is deterministic', () => {
      const e1 = PeriodCloseStateMachine.createEntry('period-1', 'entity-1');
      const e2 = PeriodCloseStateMachine.createEntry('period-1', 'entity-1');
      expect(e1.periodId).toBe(e2.periodId);
      expect(e1.entityId).toBe(e2.entityId);
      expect(e1.state).toBe(e2.state);
    });
  });
});
