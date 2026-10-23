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
import { assertPermission, Permissions } from '@/utils/rbacEnforcer';
import { masterStorage } from '@/utils/masterStorage';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export interface ExceptionRule {
  readonly ruleId: string; // e.g. "R-001", "R-008"
  readonly version: number; // version sequence e.g. 1, 2
  readonly name: string;
  readonly type:
    | 'variance'
    | 'spike'
    | 'drop'
    | 'trend_break'
    | 'outlier'
    | 'structural'
    | 'pattern'
    | 'movement';
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
  /** Phase catalogue tier (plan §7): 1 structural · 2 pattern · 3 movement. */
  readonly tier?: 1 | 2 | 3;
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
  // ---------------------------------------------------------------------
  // Catalogue v2 (Phase 3) — entry-level rules over the GL. Every rule runs
  // over every entry (DEC-017); thresholds rank/tier, they never suppress.
  // ---------------------------------------------------------------------
  {
    ruleId: 'R-006',
    version: 1,
    name: 'Unbalanced journal',
    type: 'structural',
    tier: 1,
    metric: 'journal',
    threshold: { deviation: 0, operator: 'neq' },
    evidence: {
      description: 'Journal debits do not equal journal credits, to the cent',
      formula: 'sum(debit) - sum(credit) != 0 per journal',
      sourceRows: true,
    },
    rationale:
      'A journal that does not balance cannot have posted cleanly in D365; a partial or transformed export is the usual cause.',
    knownLimits:
      'Entries with neither journal id nor reference cannot be grouped and are skipped; the skip is stated on the run.',
    recommendedAction:
      'Compare the journal against the D365 posting, then re-export or correct the missing side.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-007',
    version: 1,
    name: 'Possible duplicate entry',
    type: 'structural',
    tier: 1,
    metric: 'entry',
    threshold: { deviation: 0, operator: 'gt' },
    evidence: {
      description: 'Two or more entries share account, date, debit, credit and reference',
      formula: 'count(group by accountCode|date|debit|credit|reference) > 1',
      sourceRows: true,
    },
    rationale:
      'Duplicate postings double-count revenue or cost; legitimate repeats (recurring charges) are for the reviewer to accept, not the rule to hide.',
    knownLimits:
      'Flags candidates only — identical recurring entries are expected to be dispositioned ACCEPT with rationale.',
    recommendedAction:
      'Check the source documents; if duplicated, ask the accounts team to reverse one posting.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-008',
    version: 1,
    name: 'One-sided journal',
    type: 'structural',
    tier: 1,
    metric: 'journal',
    threshold: { deviation: 0, operator: 'eq' },
    evidence: {
      description: 'A journal of 2+ lines posts only debits or only credits',
      formula: 'sum(credit) == 0 or sum(debit) == 0 (lines >= 2)',
      sourceRows: true,
    },
    rationale: 'One-sided journals are how incomplete exports and interface failures present.',
    knownLimits: 'Single-line journals are covered by R-006 instead.',
    recommendedAction: 'Trace the journal in D365 and confirm the missing side exists there.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-009',
    version: 1,
    name: 'Debit and credit on the same line',
    type: 'structural',
    tier: 1,
    metric: 'entry',
    threshold: { deviation: 0, operator: 'gt' },
    evidence: {
      description: 'A single entry carries both a debit and a credit amount',
      formula: 'debit > 0 and credit > 0',
      sourceRows: true,
    },
    rationale:
      'GL lines post one side; both-sides lines usually mean a netted export column or a mapping error.',
    recommendedAction: 'Inspect the source row and the column mapping that produced it.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-010',
    version: 1,
    name: 'Zero-amount line',
    type: 'structural',
    tier: 1,
    metric: 'entry',
    threshold: { deviation: 0, operator: 'eq' },
    evidence: {
      description: 'An entry with debit = credit = 0',
      formula: 'debit == 0 and credit == 0',
      sourceRows: true,
    },
    rationale:
      'Zero lines add noise to counts and often mark rows the export should not have carried.',
    recommendedAction: 'Confirm the row belongs in the export; otherwise fix the export selection.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-011',
    version: 1,
    name: 'Large round amount',
    type: 'pattern',
    tier: 2,
    metric: 'entry',
    threshold: { min: 10_000, deviation: 1_000, operator: 'gte' },
    evidence: {
      description: 'Amount at or above the configured size is an exact multiple of the round unit',
      formula: 'max(|debit|,|credit|) >= min and amount mod roundUnit == 0',
      sourceRows: true,
    },
    rationale: 'Large round figures are where estimates, plugs and manual journals concentrate.',
    knownLimits:
      'Size and round unit are run options (defaults 10,000 / 1,000); the options used are recorded on the run.',
    recommendedAction: 'Ask for the supporting calculation or document behind the figure.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-012',
    version: 1,
    name: 'Weekend posting',
    type: 'pattern',
    tier: 2,
    metric: 'entry',
    threshold: { deviation: 0, operator: 'gte' },
    evidence: {
      description: 'Entry date falls on a Saturday or Sunday',
      formula: 'dayOfWeek(date) in {Sat, Sun}',
      sourceRows: true,
    },
    rationale:
      'Out-of-hours postings can be legitimate period-end work or a sign of backdating; only a human can tell.',
    knownLimits: 'Uses the entry date; no holiday calendar is applied.',
    recommendedAction: 'Confirm the posting was expected (period-end close) or query the poster.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-013',
    version: 1,
    name: 'Posting period differs from entry-date month',
    type: 'pattern',
    tier: 2,
    metric: 'entry',
    threshold: { deviation: 0, operator: 'neq' },
    evidence: {
      description: 'The entry period (YYYY-MM) is not the month of the entry date',
      formula: 'period != month(date)',
      sourceRows: true,
    },
    rationale:
      'Period/date mismatches distort month-by-month comparison (J4) even when the journal balances.',
    recommendedAction: 'Confirm the intended period in D365; correct the posting period if wrong.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-014',
    version: 1,
    name: 'Missing description or reference',
    type: 'pattern',
    tier: 2,
    metric: 'entry',
    threshold: { deviation: 0, operator: 'eq' },
    evidence: {
      description: 'Description or reference is blank',
      formula: 'trim(description) == "" or trim(reference) == ""',
      sourceRows: true,
    },
    rationale: 'Blank evidence fields make an entry untraceable for the accounts team.',
    knownLimits:
      'Some D365 flavours legitimately omit references on certain journals; disposition those ACCEPT once, with rationale.',
    recommendedAction: 'Ask the poster to complete the missing field in D365.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-015',
    version: 1,
    name: 'Posting resumes after dormancy',
    type: 'pattern',
    tier: 2,
    metric: 'account',
    threshold: { deviation: 180, operator: 'gt' },
    evidence: {
      description: 'An account silent for longer than the dormancy window posts again',
      formula: 'gap between consecutive posting dates > dormancyDays (default 180)',
      sourceRows: true,
    },
    rationale:
      'Revived dormant accounts are a classic misposting target (wrong code picked from an old list).',
    knownLimits:
      'Dormancy window is a run option; the first posting ever is R-016 territory, not dormancy.',
    recommendedAction: 'Confirm the account is still the right one for this posting.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-016',
    version: 1,
    name: 'New account in the latest period',
    type: 'movement',
    tier: 3,
    metric: 'account',
    threshold: { deviation: 0, operator: 'gte' },
    evidence: {
      description: "An account's first posting falls in the ledger's latest period",
      formula: 'min(period over account) == max(period over ledger) and ledger spans >= 2 periods',
      sourceRows: true,
    },
    rationale:
      'New accounts change every comparison; the reviewer should know each one exists and why.',
    knownLimits:
      'On a single-period ledger every account is "new"; the rule stays silent until two periods exist.',
    recommendedAction:
      'Confirm the account was created deliberately and mapped to the right statement class.',
    status: 'ACCEPTED',
    createdAt: nowISO(),
    createdBy: 'system',
  },
  {
    ruleId: 'R-017',
    version: 1,
    name: 'Amount outlier vs account history',
    type: 'movement',
    tier: 3,
    metric: 'entry',
    threshold: { deviation: 5, operator: 'gt' },
    evidence: {
      description: "An entry's amount is far from the account's own median (median/MAD)",
      formula:
        '|x - median| > 5 * MAD over |debit - credit| per account (accounts with >= 5 entries)',
      sourceRows: true,
    },
    rationale:
      'Outliers against an account’s own history catch wrong-amount and wrong-account postings that totals hide.',
    knownLimits:
      'Needs >= 5 entries per account (run option). When MAD is 0, any amount different from the median is flagged; both facts are stated on the finding.',
    recommendedAction:
      'Compare with the source document; check for extra zeros or a wrong account.',
    status: 'ACCEPTED',
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
          assertPermission(Permissions.EXCEPTION_CONFIGURE, 'registerRule');
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
          assertPermission(Permissions.EXCEPTION_CONFIGURE, 'supersedeRule');
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
          assertPermission(Permissions.EXCEPTION_CONFIGURE, 'updateRuleStatus');
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
          assertPermission(Permissions.EXCEPTION_CONFIGURE, 'resetToDefaults');
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
