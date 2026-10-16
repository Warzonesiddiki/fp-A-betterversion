import { describe, it, expect, beforeEach } from 'vitest';
import {
  EXCEPTION_RULES,
  BUILT_IN_RULES,
  createFindingKey,
  parseFindingKey,
  createFinding,
  useExceptionRuleCatalogueStore,
  type ExceptionRule,
} from './exceptionRuleCatalogue';
import { setClock, resetClock } from '@/utils/clock';

describe('Exception Rule Catalogue (FR-008)', () => {
  beforeEach(() => {
    resetClock();
    useExceptionRuleCatalogueStore.getState().resetToDefaults();
  });

  describe('Built-in rules and static catalogue', () => {
    it('provides built-in rules with version 1 and valid metadata', () => {
      expect(EXCEPTION_RULES.length).toBeGreaterThan(0);
      expect(BUILT_IN_RULES).toEqual(EXCEPTION_RULES);

      for (const rule of EXCEPTION_RULES) {
        expect(rule.ruleId).toBeDefined();
        expect(rule.version).toBe(1);
        expect(rule.name).toBeTruthy();
        expect(rule.type).toBeDefined();
        expect(rule.metric).toBeTruthy();
        expect(rule.threshold).toBeDefined();
        expect(typeof rule.threshold.deviation).toBe('number');
        expect(rule.threshold.deviation).not.toBe(0);
        expect(rule.evidence.description).toBeTruthy();
        expect(rule.recommendedAction).toBeTruthy();
        expect(rule.status).toBeDefined();
        expect(rule.createdBy).toBeTruthy();
        expect(rule.createdAt).toBeTruthy();
      }
    });

    it('contains variance, spike, drop, outlier, and trend_break rules', () => {
      const types = EXCEPTION_RULES.map((r) => r.type);
      expect(types).toContain('variance');
      expect(types).toContain('spike');
      expect(types).toContain('drop');
      expect(types).toContain('outlier');
      expect(types).toContain('trend_break');
    });
  });

  describe('Finding key stability (canonical findingKey)', () => {
    it('produces stable canonical findingKey formatted as ruleId:targetId:periodKey', () => {
      const key1 = createFindingKey('R-001', '1010-CASH', '2026-09');
      const key2 = createFindingKey('R-001', '1010-CASH', '2026-09');
      expect(key1).toBe('R-001:1010-CASH:2026-09');
      expect(key1).toBe(key2);
    });

    it('trims whitespace and handles optional qualifier', () => {
      const key = createFindingKey('  R-002 ', ' 4000-REV ', ' 2026-Q3 ', ' batch-99 ');
      expect(key).toBe('R-002:4000-REV:2026-Q3:batch-99');
    });

    it('parses canonical findingKey back to components', () => {
      const parsed = parseFindingKey('R-001:1010-CASH:2026-09:extra-part');
      expect(parsed).toEqual({
        ruleId: 'R-001',
        targetId: '1010-CASH',
        periodKey: '2026-09',
        qualifier: 'extra-part',
      });

      const parsedNoQualifier = parseFindingKey('R-001:1010-CASH:2026-09');
      expect(parsedNoQualifier).toEqual({
        ruleId: 'R-001',
        targetId: '1010-CASH',
        periodKey: '2026-09',
      });

      expect(parseFindingKey('invalid-key')).toBeNull();
    });

    it('creates an ExceptionFinding with pinned clock timestamp and stable key', () => {
      const fixedIso = '2026-10-16T15:00:00.000Z';
      setClock(new Date(fixedIso).getTime());

      const rule = EXCEPTION_RULES[0];
      const finding = createFinding({
        rule,
        targetId: '1010-CASH',
        periodKey: '2026-09',
        observedValue: 125000,
        expectedValue: 100000,
        deviation: 0.25,
        message: 'Revenue exceeds baseline variance threshold',
        evidenceRows: ['entry-001', 'entry-002'],
      });

      expect(finding.findingKey).toBe(`${rule.ruleId}:1010-CASH:2026-09`);
      expect(finding.ruleId).toBe(rule.ruleId);
      expect(finding.ruleVersion).toBe(rule.version);
      expect(finding.targetId).toBe('1010-CASH');
      expect(finding.periodKey).toBe('2026-09');
      expect(finding.observedValue).toBe(125000);
      expect(finding.expectedValue).toBe(100000);
      expect(finding.deviation).toBe(0.25);
      expect(finding.evidenceRows).toEqual(['entry-001', 'entry-002']);
      expect(finding.detectedAt).toBe(fixedIso);
    });
  });

  describe('Versioned rule catalogue store', () => {
    it('retrieves default rules and gets rule by id', () => {
      const store = useExceptionRuleCatalogueStore.getState();
      const r1 = store.getRule('R-001');
      expect(r1).toBeDefined();
      expect(r1?.ruleId).toBe('R-001');
      expect(r1?.version).toBe(1);

      expect(store.getRule('NON_EXISTENT')).toBeUndefined();
    });

    it('allows registering a new rule with versioning and determinism', () => {
      const fixedIso = '2026-10-16T16:00:00.000Z';
      setClock(new Date(fixedIso).getTime());

      const newRule: Omit<ExceptionRule, 'createdAt'> = {
        ruleId: 'R-CUSTOM-001',
        version: 1,
        name: 'Custom Margin Anomaly',
        type: 'variance',
        metric: 'grossMargin',
        threshold: { deviation: 0.15, operator: 'gt' },
        evidence: { description: 'Margin dropped by >15%' },
        recommendedAction: 'Inspect supplier unit costs',
        status: 'PROPOSED',
        createdBy: 'analyst-1',
      };

      const registered = useExceptionRuleCatalogueStore.getState().registerRule(newRule);
      expect(registered.createdAt).toBe(fixedIso);

      const retrieved = useExceptionRuleCatalogueStore.getState().getRule('R-CUSTOM-001');
      expect(retrieved).toEqual(registered);
    });

    it('prevents registering duplicate ruleId and version', () => {
      const store = useExceptionRuleCatalogueStore.getState();
      expect(() =>
        store.registerRule({
          ruleId: 'R-001',
          version: 1,
          name: 'Duplicate',
          type: 'variance',
          metric: 'revenue',
          threshold: { deviation: 0.2, operator: 'gt' },
          evidence: { description: 'dup' },
          recommendedAction: 'check',
          status: 'PROPOSED',
          createdBy: 'user',
        })
      ).toThrowError(/already exists/i);
    });

    it('supersedes an existing rule, retiring old version and creating incremented version', () => {
      const fixedIso = '2026-10-16T16:30:00.000Z';
      setClock(new Date(fixedIso).getTime());

      const store = useExceptionRuleCatalogueStore.getState();
      const superseded = store.supersedeRule(
        'R-001',
        {
          threshold: { deviation: 0.3, operator: 'gt' },
          notes: 'Increased deviation threshold to reduce false positives',
          status: 'ACCEPTED',
        },
        'senior-auditor'
      );

      expect(superseded.ruleId).toBe('R-001');
      expect(superseded.version).toBe(2);
      expect(superseded.threshold.deviation).toBe(0.3);
      expect(superseded.status).toBe('ACCEPTED');
      expect(superseded.createdBy).toBe('senior-auditor');
      expect(superseded.createdAt).toBe(fixedIso);

      // Previous version is now RETIRED with supersededBy
      const v1 = useExceptionRuleCatalogueStore.getState().getRule('R-001', 1);
      expect(v1?.status).toBe('RETIRED');
      expect(v1?.supersededBy).toBe('R-001:v2');

      // Default getRule returns latest version (v2)
      const latest = useExceptionRuleCatalogueStore.getState().getRule('R-001');
      expect(latest?.version).toBe(2);
    });

    it('filters active rules to non-retired latest versions only', () => {
      const store = useExceptionRuleCatalogueStore.getState();
      store.supersedeRule('R-001', { status: 'ACCEPTED' });

      const active = store.getActiveRules();
      const r1s = active.filter((r) => r.ruleId === 'R-001');
      expect(r1s).toHaveLength(1);
      expect(r1s[0].version).toBe(2);

      // Retired rule is not in active rules
      expect(active.some((r) => r.status === 'RETIRED')).toBe(false);
    });

    it('updates rule status', () => {
      const store = useExceptionRuleCatalogueStore.getState();
      store.updateRuleStatus('R-001', 'ACCEPTED');
      expect(store.getRule('R-001')?.status).toBe('ACCEPTED');
    });

    it('resets catalogue to default initial rules', () => {
      const store = useExceptionRuleCatalogueStore.getState();
      store.supersedeRule('R-001', { status: 'ACCEPTED' });
      expect(store.getRule('R-001')?.version).toBe(2);

      store.resetToDefaults();
      expect(store.getRule('R-001')?.version).toBe(1);
    });
  });
});
