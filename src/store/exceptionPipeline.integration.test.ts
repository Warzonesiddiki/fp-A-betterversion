/**
 * FR-008 & FR-009: End-to-end exception pipeline integration test.
 *
 * Verifies complete lifecycle across exception subsystem changes:
 * 1. Register exception rule in versioned catalogue (FR-008)
 * 2. Generate deterministic finding key & candidate finding
 * 3. Ingest candidate into ExceptionReviewList & ExceptionReviewCard
 * 4. Verify Rule 7 constraint: review candidate is not labeled confirmed error without human disposition
 * 5. Apply human disposition with rationale in exceptionDispositionStore (FR-009)
 * 6. Verify audit history sequence, timestamps, and attribution across disposition transitions
 * 7. Assert status and audit trail preservation across simulated reloads (persist rehydration)
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useExceptionRuleCatalogueStore,
  createFindingKey,
  parseFindingKey,
  createFinding,
  type ExceptionRule,
} from './exceptionRuleCatalogue';
import { useExceptionDispositionStore } from './exceptionDispositionStore';
import { ExceptionReviewList } from '@/components/exceptions/ExceptionReviewList';
import {
  ExceptionReviewCard,
  type ExceptionReviewCandidate,
} from '@/components/exceptions/ExceptionReviewCard';
import { setClock, resetClock } from '@/utils/clock';

describe('Exception Pipeline End-to-End Integration (FR-008 & FR-009)', () => {
  beforeEach(() => {
    resetClock();
    useExceptionRuleCatalogueStore.getState().resetToDefaults();
    useExceptionDispositionStore.getState().reset();
  });

  it('runs complete lifecycle: rule registration -> finding key -> UI ingestion -> human disposition -> audit history -> reload preservation', async () => {
    const user = userEvent.setup();
    const t0 = '2026-10-16T09:00:00.000Z';
    setClock(new Date(t0).getTime());

    // Step 1: Register new versioned exception rule in catalogue (FR-008)
    const catalogueStore = useExceptionRuleCatalogueStore.getState();
    const customRule: Omit<ExceptionRule, 'createdAt'> = {
      ruleId: 'RULE-D365-ROUND-SUSPICION',
      version: 1,
      name: 'Round Amount Suspicious Entry',
      type: 'variance',
      metric: 'amount',
      threshold: { min: 50_000, deviation: 0.25, operator: 'gte' },
      evidence: {
        description: 'Round integer journal entry exceeding threshold without purchase order',
        formula: 'amount >= 50000 && amount % 10000 === 0',
        sourceRows: true,
      },
      recommendedAction: 'Inspect voucher approval notes and request D365 vendor PO.',
      status: 'ACCEPTED',
      createdBy: 'compliance-team',
    };

    const registeredRule = catalogueStore.registerRule(customRule);
    expect(registeredRule.ruleId).toBe('RULE-D365-ROUND-SUSPICION');
    expect(registeredRule.version).toBe(1);
    expect(registeredRule.createdAt).toBe(t0);

    // Step 2: Generate canonical stable finding key & candidate finding
    const targetAccountId = '6100-CONSULTING';
    const periodKey = '2026-09';
    const findingKey = createFindingKey(registeredRule.ruleId, targetAccountId, periodKey);
    expect(findingKey).toBe('RULE-D365-ROUND-SUSPICION:6100-CONSULTING:2026-09');

    // Round-trip parse check
    const parsedKey = parseFindingKey(findingKey);
    expect(parsedKey).toEqual({
      ruleId: 'RULE-D365-ROUND-SUSPICION',
      targetId: '6100-CONSULTING',
      periodKey: '2026-09',
    });

    const finding = createFinding({
      rule: registeredRule,
      targetId: targetAccountId,
      periodKey,
      observedValue: 50000,
      expectedValue: 12500,
      deviation: 3.0,
      message: 'Suspicious round sum voucher posted with no PO attachment',
      evidenceRows: ['VOUCHER-98712', 'VOUCHER-98713'],
      qualifier: undefined,
    });
    expect(finding.findingKey).toBe(findingKey);
    expect(finding.detectedAt).toBe(t0);

    // Step 3: Ingest candidate into UI components (ExceptionReviewCandidate model)
    const candidate: ExceptionReviewCandidate = {
      id: finding.findingKey,
      ruleId: `${finding.ruleId}@v${finding.ruleVersion}`,
      ruleName: registeredRule.name,
      version: `${finding.ruleVersion}.0`,
      severity: 'high',
      evidence: {
        description: registeredRule.evidence.description,
        formula: registeredRule.evidence.formula,
        metric: registeredRule.metric,
        actualValue: '$50,000.00',
        expectedValue: '$12,500.00',
        sourceRowId: finding.evidenceRows?.[0],
      },
      recommendedAction: registeredRule.recommendedAction,
    };

    const { unmount } = render(
      React.createElement(ExceptionReviewCard, {
        candidate,
        currentUserId: 'senior-controller-1',
      })
    );

    // Step 4: Verify Rule 7 constraint: initial status is Review Candidate, never confirmed error
    expect(screen.getByTestId('exception-status-badge')).toHaveTextContent(
      /Review Candidate \(Pending\)/i
    );
    expect(screen.getByTestId('rule-7-banner')).toHaveTextContent(/Rule 7 Review Candidate/i);
    expect(screen.getByTestId('exception-rule-id')).toHaveTextContent(
      'RULE-D365-ROUND-SUSPICION@v1 (v1.0)'
    );
    expect(screen.getByTestId('exception-finding-key')).toHaveTextContent(`ID: ${findingKey}`);

    // Step 5: Apply human disposition with mandatory rationale in UI
    const t1 = '2026-10-16T10:15:00.000Z';
    setClock(new Date(t1).getTime());

    const rationaleInput = screen.getByTestId('disposition-rationale-input');
    await user.type(
      rationaleInput,
      'Confirmed unapproved manual accrual during month-end close; reclass entry required.'
    );

    const acceptBtn = screen.getByTestId('btn-disposition-accept');
    await user.click(acceptBtn);

    // Verify UI reflects human disposition
    expect(screen.getByTestId('exception-status-badge')).toHaveTextContent(/Confirmed Exception/i);

    // Step 6: Verify disposition store state and audit trail (FR-009)
    const dispStore = useExceptionDispositionStore.getState();
    const stored = dispStore.getDisposition(findingKey);
    expect(stored).toBeDefined();
    expect(stored?.disposition).toBe('ACCEPT');
    expect(stored?.rationale).toBe(
      'Confirmed unapproved manual accrual during month-end close; reclass entry required.'
    );
    expect(stored?.recordedBy).toBe('senior-controller-1');
    expect(stored?.recordedAt).toBe(t1);

    // Step 7: Transition disposition (e.g. escalated to CFO) and verify append-only audit trail
    const t2 = '2026-10-16T11:30:00.000Z';
    setClock(new Date(t2).getTime());

    dispStore.setDisposition({
      exceptionId: findingKey,
      ruleId: registeredRule.ruleId,
      disposition: 'ESCALATE',
      rationale: 'Escalated to Corporate Controller for policy exception approval.',
      recordedBy: 'audit-director-2',
    });

    const updatedStored = useExceptionDispositionStore.getState().getDisposition(findingKey);
    expect(updatedStored?.disposition).toBe('ESCALATE');
    expect(updatedStored?.recordedBy).toBe('audit-director-2');
    expect(updatedStored?.recordedAt).toBe(t2);

    const auditTrail = useExceptionDispositionStore.getState().getAuditTrail(findingKey);
    expect(auditTrail).toHaveLength(2);
    expect(auditTrail[0].sequenceNumber).toBe(1);
    expect(auditTrail[0].disposition).toBe('ACCEPT');
    expect(auditTrail[0].recordedBy).toBe('senior-controller-1');
    expect(auditTrail[0].recordedAt).toBe(t1);

    expect(auditTrail[1].sequenceNumber).toBe(2);
    expect(auditTrail[1].disposition).toBe('ESCALATE');
    expect(auditTrail[1].previousDisposition).toBe('ACCEPT');
    expect(auditTrail[1].recordedBy).toBe('audit-director-2');
    expect(auditTrail[1].recordedAt).toBe(t2);

    unmount();

    // Step 8: Assert status preservation across reloads (persist rehydrate simulation)
    await new Promise((resolve) => setTimeout(resolve, 50));
    await useExceptionDispositionStore.persist.rehydrate();
    await useExceptionRuleCatalogueStore.persist.rehydrate();

    const rehydratedDisp = useExceptionDispositionStore.getState().getDisposition(findingKey);
    expect(rehydratedDisp).toBeDefined();
    expect(rehydratedDisp?.disposition).toBe('ESCALATE');
    expect(rehydratedDisp?.recordedBy).toBe('audit-director-2');

    const rehydratedRule = useExceptionRuleCatalogueStore
      .getState()
      .getRule('RULE-D365-ROUND-SUSPICION');
    expect(rehydratedRule).toBeDefined();
    expect(rehydratedRule?.version).toBe(1);

    // Step 9: Render ExceptionReviewList with rehydrated state and verify summary stats
    render(
      React.createElement(ExceptionReviewList, {
        candidates: [candidate],
        currentUserId: 'senior-controller-1',
      })
    );

    expect(screen.getByTestId('stat-total')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-pending')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-escalated')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-accepted')).toHaveTextContent('0');
  });

  it('preserves catalogue supersession and finding key stability across rule revisions', () => {
    const t0 = '2026-10-16T08:00:00.000Z';
    const t1 = '2026-10-16T12:00:00.000Z';
    setClock(new Date(t0).getTime());

    const catalogue = useExceptionRuleCatalogueStore.getState();

    // Supersede built-in rule R-001 (version 1 -> version 2)
    setClock(new Date(t1).getTime());
    const v2 = catalogue.supersedeRule(
      'R-001',
      {
        threshold: { min: 15_000, deviation: 0.25, operator: 'gt' },
        notes: 'Tightened minimum threshold to 15,000 to reduce noise',
        status: 'ACCEPTED',
      },
      'risk-committee'
    );

    expect(v2.ruleId).toBe('R-001');
    expect(v2.version).toBe(2);
    expect(v2.createdAt).toBe(t1);
    expect(v2.createdBy).toBe('risk-committee');

    // Finding key generated with R-001 is stable across versions
    const keyV1 = createFindingKey('R-001', '4000-SALES', '2026-10');
    const keyV2 = createFindingKey(v2.ruleId, '4000-SALES', '2026-10');
    expect(keyV1).toBe(keyV2);
    expect(keyV1).toBe('R-001:4000-SALES:2026-10');

    // Former v1 rule is marked RETIRED and linked to v2
    const v1 = useExceptionRuleCatalogueStore.getState().getRule('R-001', 1);
    expect(v1?.status).toBe('RETIRED');
    expect(v1?.supersededBy).toBe('R-001:v2');

    // Latest active rules list contains v2 and excludes v1
    const active = useExceptionRuleCatalogueStore.getState().getActiveRules();
    const r1Active = active.filter((r) => r.ruleId === 'R-001');
    expect(r1Active).toHaveLength(1);
    expect(r1Active[0].version).toBe(2);
  });
});
