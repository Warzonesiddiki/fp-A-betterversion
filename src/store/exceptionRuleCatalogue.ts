/**
 * FR-008: Versioned anomaly rule catalogue.
 * Each rule identifies a pattern abnormality, has evidence/guidance, and a rule ID.
 * No flag is labeled a confirmed error without human disposition.
 *
 * Rule status: PROPOSED | REVIEW | ACCEPTED | RETIRED
 * Evidence: source-reference, calculation formula, data-requirements
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nowISO } from '@/utils/clock';
import { masterStorage } from '@/utils/masterStorage';

export interface ExceptionRule {
  readonly ruleId: string; // e.g. "R-001", "R-008"
  readonly version: number; // version sequence e.g. 1, 2
  readonly name: string;
  readonly type: 'variance' | 'spike' | 'drop' | 'trend_break' | 'outlier';
  readonly metric: string; // e.g. "revenue", "cost", "netChange"
  readonly threshold: {
    min?: number;
    max?: number;
    deviation: number;
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
  };
  readonly evidence: {
    description: string;
    formula?: string; // decimal.js formula string
    sourceRows?: boolean; // whether source-row evidence is required
    priorPeriodComparison?: boolean;
  };
  readonly rationale?: string;
  readonly knownLimits?: string;
  readonly requiredInputs?: string[];
  readonly recommendedAction: string;
  readonly status: 'PROPOSED' | 'REVIEW' | 'ACCEPTED' | 'RETIRED';
  readonly createdAt: string;
  readonly createdBy: string;
  readonly supersededBy?: string; // ruleId:v<version> if retired/superseded
  readonly notes?: string;
}

export interface ExceptionFinding {
  readonly findingKey: string; // Stable deterministic identifier: {ruleId}:{targetId}:{periodKey}[:qualifier]
  readonly ruleId: string;
  readonly ruleVersion: number;
  readonly targetId: string; // GL account, transaction ID, department, etc.
  readonly periodKey: string; // YYYY-MM or specific period
  readonly evidenceRows?: string[]; // IDs/provenance of evidence rows
  readonly observedValue: number | string;
  readonly expectedValue?: number | string;
  readonly deviation?: number;
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
  readonly detectedAt: string;
}

export const EXCEPTION_RULES: readonly ExceptionRule[] = [
  {
    ruleId: 'R-001',
    version: 1,
    name: 'High Variance in Revenue',
    type: 'variance',
    metric: 'revenue',
    threshold: { min: 10_000, deviation: 0.2, operator: 'gt' },
    evidence: {
      description: 'Monthly revenue variance exceeds 20% vs baseline average',
      formula: 'abs(actual - baseline) / baseline > 0.20',
      sourceRows: true,
      priorPeriodComparison: true,
    },
    rationale: 'Large unexplained deviations in revenue indicate mispostings or unaccrued sales.',
    recommendedAction:
      'Verify revenue recognition criteria and inspect supporting journal entries.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-002',
    version: 1,
    name: 'Abnormal Spike in Operating Expenses',
    type: 'spike',
    metric: 'cost',
    threshold: { min: 5_000, deviation: 0.5, operator: 'gt' },
    evidence: {
      description: 'OpEx spike exceeds 50% month-over-month increase',
      formula: '(actual - priorMonth) / priorMonth > 0.50',
      sourceRows: true,
      priorPeriodComparison: true,
    },
    rationale:
      'Sudden jumps in operating expenses can signify duplicate vendor invoices or misclassification.',
    recommendedAction: 'Review AP invoices for period and cross-check vendor payment logs.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-003',
    version: 1,
    name: 'Severe Drop in Revenue',
    type: 'drop',
    metric: 'revenue',
    threshold: { min: 10_000, deviation: -0.3, operator: 'lt' },
    evidence: {
      description: 'Monthly revenue drops by more than 30% against prior year',
      formula: '(actual - priorYear) / priorYear < -0.30',
      sourceRows: true,
      priorPeriodComparison: true,
    },
    rationale: 'Severe drops may indicate omitted invoicing batches or unposted credit memos.',
    recommendedAction:
      'Cross-reference unbilled order log and confirm batch posting status in D365.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-004',
    version: 1,
    name: 'Statistical Outlier in Cash Flow',
    type: 'outlier',
    metric: 'netChange',
    threshold: { deviation: 3.0, operator: 'gt' },
    evidence: {
      description: 'Account balance movement exceeds 3 standard deviations from rolling mean',
      formula: 'abs(actual - mean) / stdDev > 3.0',
      sourceRows: true,
      priorPeriodComparison: true,
    },
    rationale:
      'Z-score outliers in cash flow capture irregular capital transactions or abnormal disbursements.',
    recommendedAction: 'Confirm treasury wire confirmations and management approval signatures.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-005',
    version: 1,
    name: 'Trend Break in Gross Margin',
    type: 'trend_break',
    metric: 'margin',
    threshold: { deviation: 0.05, operator: 'gt' },
    evidence: {
      description: 'Gross margin trend breaks 6-month continuous slope trajectory',
      formula: 'abs(marginSlope - historicalSlope) > 0.05',
      sourceRows: false,
      priorPeriodComparison: true,
    },
    rationale:
      'Breaks in gross margin slope highlight cost-of-goods-sold mismatches or inventory revaluations.',
    recommendedAction: 'Inspect inventory valuation adjustments and standard-cost change logs.',
    status: 'PROPOSED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
];

export const BUILT_IN_RULES: readonly ExceptionRule[] = EXCEPTION_RULES;

/**
 * Generate a canonical stable finding key for deduplication and disposition tracking.
 * Format: {ruleId}:{targetId}:{periodKey} or {ruleId}:{targetId}:{periodKey}:{qualifier}
 */
export function createFindingKey(
  ruleId: string,
  targetId: string,
  periodKey: string,
  qualifier?: string
): string {
  const base = `${ruleId.trim()}:${targetId.trim()}:${periodKey.trim()}`;
  return qualifier && qualifier.trim().length > 0 ? `${base}:${qualifier.trim()}` : base;
}

/**
 * Parse a canonical finding key back into its constituent parts.
 */
export function parseFindingKey(
  findingKey: string
): { ruleId: string; targetId: string; periodKey: string; qualifier?: string } | null {
  const parts = findingKey.split(':');
  if (parts.length < 3) return null;
  const ruleId = parts[0];
  const targetId = parts[1];
  const periodKey = parts[2];
  if (!ruleId || !targetId || !periodKey) return null;
  const rest = parts.slice(3);
  return {
    ruleId,
    targetId,
    periodKey,
    ...(rest.length > 0 ? { qualifier: rest.join(':') } : {}),
  };
}

/**
 * Construct an ExceptionFinding with canonical findingKey and deterministic timestamp.
 */
export function createFinding(params: {
  rule: ExceptionRule;
  targetId: string;
  periodKey: string;
  observedValue: number | string;
  expectedValue?: number | string;
  deviation?: number;
  message: string;
  evidenceRows?: string[];
  metadata?: Record<string, unknown>;
  qualifier?: string;
}): ExceptionFinding {
  return {
    findingKey: createFindingKey(
      params.rule.ruleId,
      params.targetId,
      params.periodKey,
      params.qualifier
    ),
    ruleId: params.rule.ruleId,
    ruleVersion: params.rule.version,
    targetId: params.targetId.trim(),
    periodKey: params.periodKey.trim(),
    evidenceRows: params.evidenceRows,
    observedValue: params.observedValue,
    expectedValue: params.expectedValue,
    deviation: params.deviation,
    message: params.message,
    metadata: params.metadata,
    detectedAt: nowISO(),
  };
}

export interface ExceptionRuleCatalogueState {
  rules: ExceptionRule[];
}

export interface ExceptionRuleCatalogueActions {
  getRule: (ruleId: string, version?: number) => ExceptionRule | undefined;
  getRules: () => ExceptionRule[];
  getActiveRules: () => ExceptionRule[];
  registerRule: (rule: Omit<ExceptionRule, 'createdAt'> & { createdAt?: string }) => ExceptionRule;
  supersedeRule: (
    ruleId: string,
    updates: Partial<Omit<ExceptionRule, 'ruleId' | 'version' | 'createdAt'>>,
    author?: string
  ) => ExceptionRule;
  updateRuleStatus: (ruleId: string, status: ExceptionRule['status'], version?: number) => void;
  resetToDefaults: () => void;
}

export type ExceptionRuleCatalogueStore = ExceptionRuleCatalogueState &
  ExceptionRuleCatalogueActions;

const initialRules = (): ExceptionRule[] => EXCEPTION_RULES.map((r) => ({ ...r }));

export const useExceptionRuleCatalogueStore = create<ExceptionRuleCatalogueStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        rules: initialRules(),

        getRule: (ruleId: string, version?: number) => {
          const rules = get().rules;
          if (version !== undefined) {
            return rules.find((r) => r.ruleId === ruleId && r.version === version);
          }
          const matches = rules.filter((r) => r.ruleId === ruleId);
          if (matches.length === 0) return undefined;
          return matches.reduce((latest, current) =>
            current.version > latest.version ? current : latest
          );
        },

        getRules: () => get().rules,

        getActiveRules: () => {
          const rules = get().rules.filter((r) => r.status !== 'RETIRED');
          const byId = new Map<string, ExceptionRule>();
          for (const rule of rules) {
            const existing = byId.get(rule.ruleId);
            if (!existing || rule.version > existing.version) {
              byId.set(rule.ruleId, rule);
            }
          }
          return Array.from(byId.values());
        },

        registerRule: (newRule) => {
          const existing = get().rules.find(
            (r) => r.ruleId === newRule.ruleId && r.version === newRule.version
          );
          if (existing) {
            throw new Error(
              `Rule ${newRule.ruleId} v${newRule.version} already exists in catalogue`
            );
          }
          const rule: ExceptionRule = {
            ...newRule,
            createdAt: newRule.createdAt ?? nowISO(),
          };
          set((state) => {
            state.rules.push(rule);
          });
          return rule;
        },

        supersedeRule: (ruleId, updates, author) => {
          const rules = get().rules.filter((r) => r.ruleId === ruleId);
          if (rules.length === 0) {
            throw new Error(`Rule ${ruleId} not found in catalogue`);
          }
          const current = rules.reduce((latest, curr) =>
            curr.version > latest.version ? curr : latest
          );
          const nextVersion = current.version + 1;
          const nextSupersededRef = `${ruleId}:v${nextVersion}`;
          const nextRule: ExceptionRule = {
            ...current,
            ...updates,
            ruleId,
            version: nextVersion,
            createdAt: nowISO(),
            createdBy: author ?? current.createdBy,
            status: updates.status ?? 'PROPOSED',
            supersededBy: undefined,
          };
          set((state) => {
            const target = state.rules.find(
              (r) => r.ruleId === ruleId && r.version === current.version
            );
            if (target) {
              target.status = 'RETIRED';
              target.supersededBy = nextSupersededRef;
            }
            state.rules.push(nextRule);
          });
          return nextRule;
        },

        updateRuleStatus: (ruleId, status, version) => {
          set((state) => {
            const target =
              version !== undefined
                ? state.rules.find((r) => r.ruleId === ruleId && r.version === version)
                : state.rules
                    .filter((r) => r.ruleId === ruleId)
                    .sort((a, b) => b.version - a.version)[0];
            if (target) {
              target.status = status;
            }
          });
        },

        resetToDefaults: () => {
          set((state) => {
            state.rules = initialRules();
          });
        },
      })),
      {
        name: 'finplan:exception-rules',
        storage: masterStorage,
        version: 1,
      }
    )
  )
);
