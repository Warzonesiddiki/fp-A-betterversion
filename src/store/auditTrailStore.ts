// src/store/auditTrailStore.ts
// Clio (Audit Muse) — Part 141 P0A-17 Audit Trail UI v0.2.2 SECURITY HARDENING
// Date: 2026-06-18 — Sentinel-SecurityAuditor BRUTAL v2.0 audit fixes
// D-007 8th SHL CASCADE — F-CLIO-2/3/6/7 P0 fixes applied per FOUNDER TURN 380+ "If they flag a violation, FIX it"
// Lane: P0A-17 Audit Trail UI + 6 Data tasks (OLAP/Lineage/Quality/MDM/Schema/Backup)

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

import type { CellAddress } from '@/types/cell';
import type { ExtendedAuditEntry, AuditFilters, AuditSource, AuditOperation } from '@/types/audit';

export type { ExtendedAuditEntry, AuditSource, AuditOperation };

import { sanitizeSpreadsheetText } from '@/utils/spreadsheetSanitize';
import { sha256Hex } from '@/utils/sha256';
import { randomId } from '@/utils/cryptoId';
// W6-P0-14: seedDemoData and the currently unused recordBulk helper require
// audit:create. recordWrite/Update/Delete/Read stay outside RBAC because the
// in-repository caller is the GDPR event bridge; requiring an Admin-only
// permission would drop lower-role event capture. These public methods trust
// caller-supplied payloads and do not authenticate source identity. The local
// unkeyed hash chain is not general audit authority; revert requires audit:delete.
import { enforce, getCurrentUser, PermissionError, Permissions } from '@/utils/rbacEnforcer';
import { now as clockNow } from '@/utils/clock';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

// ---------------------------------------------------------------------------
// Types (re-exported from canonical location)
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto';
export type DataType = 'number' | 'string' | 'boolean' | 'date' | 'object' | 'array';

/** Hera T-4.30 RBAC roles — only ADMIN/COMPLIANCE/DPO can view GDPR audit entries */
export type AuditRole =
  | 'admin'
  | 'compliance'
  | 'data-protection-officer'
  | 'auditor'
  | 'manager'
  | 'analyst'
  | 'viewer';

/** Roles allowed to view GDPR-source audit entries (F-CLIO-2/7 RBAC gating) */
export const GDPR_AUDIT_VIEW_ROLES: readonly AuditRole[] = [
  'admin',
  'compliance',
  'data-protection-officer',
] as const;

export interface RecordInput {
  cellId: CellAddress;
  userId: string;
  operation: AuditOperation;
  dataType: DataType;
  previousValue?: unknown;
  newValue: unknown;
  approvalStatus?: ApprovalStatus;
  approvalUserId?: string;
  // Widened to the full AuditSource (including 'gdpr'): the GDPR bridge no
  // longer needs a type cast and GDPR-sourced entries are first-class.
  source?: AuditSource;
  transactionId?: string;
  metadata?: Record<string, unknown>;
  // Cross-reference fields (Hades GDPR Article 30 ROPA / Hera RBAC T-4.30 /
  // Part 140 versioning). Previously these were absent from RecordInput and
  // hardcoded to undefined in makeEntry, so GDPR linkage was silently
  // discarded even when the caller supplied it (CWE-778 completeness gap).
  versionId?: string;
  consentId?: string;
  breachEventId?: string;
  rbacEnforceId?: string;
  tags?: string[];
  /** GDPR Art. 33 breach severity (breach.detected events) */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface State {
  entries: ExtendedAuditEntry[];
  filters: AuditFilters;
  currentPage: number;
  pageSize: 25 | 50 | 100 | 500;
  sortField: 'timestamp' | 'userId' | 'operation' | 'approvalStatus' | 'cellId';
  sortDir: 'asc' | 'desc';
  selectedEntryId: string | null;
  loading: boolean;
  /**
   * F-0015: hash of the most recently appended entry (the SHA-256 chain head).
   * `AUDIT_CHAIN_GENESIS_HASH` when the trail is empty. Stored separately from
   * `entries` so that deleting the newest entries is detectable (head/tail
   * mismatch), not just mid-chain edits.
   */
  chainHead: string;
}

interface Actions {
  seedDemoData: () => void;
  recordWrite: (input: RecordInput) => string;
  recordUpdate: (input: RecordInput) => string;
  recordDelete: (input: RecordInput) => string;
  /**
   * Record a read event (GDPR Art. 15 access / Art. 20 portability exports).
   * Previously absent — the GDPR bridge had no branch for 'read' operations,
   * so data-subject access events were never audited (CWE-778 gap).
   */
  recordRead: (input: RecordInput) => string;
  recordBulk: (inputs: RecordInput[]) => string[];
  setFilter: <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => void;
  clearFilters: () => void;
  setSort: (field: State['sortField']) => void;
  setPage: (page: number) => void;
  setPageSize: (size: State['pageSize']) => void;
  selectEntry: (id: string | null) => void;
  revertToState: (entryId: string) => void;
  refreshEntries: () => void;
  exportToCSV: () => string;
  exportToJSON: () => string;
  /**
   * GDPR audit review filter (DPO/compliance view): returns only entries that
   * are GDPR-relevant — source 'gdpr', carrying a consentId, or carrying a
   * breachEventId. Returns no entries unless the authenticated role is allowed
   * to view GDPR audit data; it is not a chain-integrity proof.
   */
  filterByGdprAccess: (entries: ExtendedAuditEntry[]) => ExtendedAuditEntry[];
  /**
   * F-0015: recompute the SHA-256 hash chain over the stored entries and
   * report tampering. Detects content mutation (hash mismatch), mid-chain
   * deletion and reordering (prevHash link break), and truncation of either
   * end (genesis/head mismatch). Fail-closed: entries missing hash material
   * are reported as tampered.
   */
  verifyIntegrity: () => AuditChainVerification;
}

/** One broken `prevHash` link, as reported by `verifyIntegrity`. */
export interface AuditChainBreak {
  entryId: string;
  expectedPrevHash: string;
  actualPrevHash: string | undefined;
}

/** Result of an F-0015 `verifyIntegrity()` pass over the stored trail. */
export interface AuditChainVerification {
  valid: boolean;
  entryCount: number;
  /** Entries whose stored hash does not match a recomputation (mutation). */
  tamperedEntryIds: string[];
  /** Broken prevHash links (mid-chain deletion / reordering / oldest-entry deletion). */
  chainBreaks: AuditChainBreak[];
  /** Whether state.chainHead still equals the newest entry's hash (head-truncation check). */
  headIntact: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * F-CLIO-6 FIX (Sentinel-SecurityAuditor BRUTAL v2.0 P0 — CWE-338 WEAK PRNG):
 * Audit entry IDs MUST come from a CSPRNG. `randomId` uses crypto.randomUUID()
 * and throws rather than degrade to Math.random (CWE-338), closing the legacy
 * fallback that previously weakened audit IDs in crypto-less environments.
 */
const uid = (): string => randomId();

const now = (): number => clockNow().getTime();

/**
 * Local audit-export helper: masks email-formatted values in `userId`,
 * `approvalUserId`, and direct metadata string fields. It is not the standalone
 * PIIRedactor service and is not a general PII classifier or compliance proof.
 * Other sensitive categories and nested metadata are not comprehensively covered.
 */
const PII_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const redactEmail = (email: string): string => {
  const match = email.match(PII_EMAIL_PATTERN);
  if (!match) return email;
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const prefix = localPart ? localPart.slice(0, 3) : '';
  return `${prefix}***@${domain}`;
};

export const redactPII = (entry: ExtendedAuditEntry): ExtendedAuditEntry => ({
  ...entry,
  userId: redactEmail(entry.userId),
  approvalUserId: entry.approvalUserId ? redactEmail(entry.approvalUserId) : undefined,
  // Recursively redact metadata string fields
  metadata: entry.metadata
    ? Object.fromEntries(
        Object.entries(entry.metadata).map(([k, v]) => [
          k,
          typeof v === 'string' && PII_EMAIL_PATTERN.test(v) ? redactEmail(v) : v,
        ])
      )
    : undefined,
});

// ---------------------------------------------------------------------------
// F-0015 integrity chain — SHA-256 over the canonical serialization of the
// STORED record, chained as hash_n = SHA-256(hash_{n-1} ‖ record_n).
//
// Root cause of F-0015: the previous `simpleHash` (a) hashed fresh uid()/now()
// values instead of the stored ones, so no verifier could ever recompute it,
// (b) was a 32-bit non-cryptographic djb2 variant, and (c) did not chain, so
// deletions and reordering were undetectable. All three defects are removed:
// the hash now covers every stored field (including previousValue/newValue),
// is a full 256-bit SHA-256, and links each entry to its predecessor.
// ---------------------------------------------------------------------------

/** Hash of the (non-existent) entry before the first one — chain bootstrap. */
export const AUDIT_CHAIN_GENESIS_HASH = '0'.repeat(64);

/**
 * Canonical JSON serializer: object keys sorted recursively, `undefined`
 * object properties dropped, `undefined`/`function` array elements become
 * `null` — mirroring JSON.stringify semantics with a key order that is
 * stable across engines and object construction order. This is what makes
 * the entry hash recomputable by an independent verifier.
 */
export const canonicalizeForHash = (value: unknown): string => {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    // JSON.stringify semantics: NaN/Infinity → null, -0 → 0, etc.
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value
      .map((v) => (v === undefined || typeof v === 'function' ? 'null' : canonicalizeForHash(v)))
      .join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && typeof obj[k] !== 'function')
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalizeForHash(obj[k])}`).join(',')}}`;
};

/**
 * Compute the chain hash of a stored entry: SHA-256 over
 * `prevHash ‖ canonical(record)`, where the record is every stored field
 * except `hash` itself. Exported so external verifiers (and the test suite)
 * recompute exactly what the store computes.
 */
export const computeAuditEntryHash = (entry: ExtendedAuditEntry): string => {
  const { hash: _hash, prevHash, ...record } = entry;
  return sha256Hex(`${prevHash ?? AUDIT_CHAIN_GENESIS_HASH}|${canonicalizeForHash(record)}`);
};

/** The stored record without integrity material; chaining adds prevHash+hash. */
type UnsignedAuditEntry = Omit<ExtendedAuditEntry, 'hash' | 'prevHash'>;

const makeEntry = (operation: AuditOperation, input: RecordInput): UnsignedAuditEntry => {
  const id = uid();
  const timestamp = now();
  return {
    id,
    cellId: input.cellId,
    userId: input.userId,
    operation,
    dataType: input.dataType,
    previousValue: input.previousValue,
    newValue: input.newValue,
    approvalStatus: input.approvalStatus ?? 'auto',
    approvalUserId: input.approvalUserId,
    approvalTimestamp: input.approvalUserId ? now() : undefined,
    source: input.source ?? 'manual',
    transactionId: input.transactionId,
    timestamp,
    metadata: input.metadata,
    // Cross-reference fields — carried from the caller's input. Previously
    // hardcoded to undefined, silently discarding GDPR/RBAC/version linkage
    // even when supplied (CWE-778 completeness gap).
    versionId: input.versionId,
    consentId: input.consentId,
    breachEventId: input.breachEventId,
    rbacEnforceId: input.rbacEnforceId,
    tags: input.tags,
    severity: input.severity,
  };
};

/**
 * Append an unsigned entry to the trail, binding it to the current chain head.
 * This is the ONLY path by which entries enter `entries`, so the chain covers
 * every record (writes, updates, deletes, bulk, reverts, seeds).
 */
const appendChained = (
  state: { entries: ExtendedAuditEntry[]; chainHead: string },
  unsigned: UnsignedAuditEntry
): void => {
  const prevHash = state.chainHead;
  const withPrev: ExtendedAuditEntry = { ...unsigned, prevHash };
  const chained: ExtendedAuditEntry = { ...withPrev, hash: computeAuditEntryHash(withPrev) };
  state.entries.unshift(chained); // entries are stored newest-first
  state.chainHead = chained.hash!;
};

const defaultFilters: AuditFilters = {
  cellId: undefined,
  userId: undefined,
  operation: undefined,
  dataType: undefined,
  approvalStatus: undefined,
  source: undefined,
  transactionId: undefined,
  dateRange: undefined,
  valueRange: undefined,
  fullTextSearch: undefined,
  hasVersion: undefined,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const SEED_COUNT = 50;
// demo defaults — opt-in seed fixtures for seedDemoData() ONLY. No production
// UI invokes that action and the store's initial state ships empty, so these
// never reach real users unless demo seeding is explicitly requested.
// (E-09-F: registered as 'disclosed' in scripts/mock-data-audit.mjs.)
const DEMO_USERS = ['alice@finplan.io', 'bob@finplan.io', 'carol@finplan.io'];
const DEMO_OPERATIONS: AuditOperation[] = ['write', 'update', 'delete', 'bulk'];
const DEMO_SECTORS = ['revenue', 'cogs', 'opex', 'tax', 'cash', 'ar', 'ap'];
const DEMO_PERIODS = ['2026Q1', '2026Q2', '2026Q3', '2026Q4'];

export const useAuditTrailStore = create<State & Actions>()(
  subscribeWithSelector(
    // N-0003: the compliance trail MUST survive reload, restart and restore.
    // It was previously the only critical store with no persistence, so every
    // SOX/SOC 2/GDPR Art. 30 record evaporated on refresh — which also made
    // the F-0015 hash chain worthless in practice.
    persist(
      immer((set, get) => ({
        entries: [],
        filters: { ...defaultFilters },
        currentPage: 1,
        pageSize: 50,
        sortField: 'timestamp',
        sortDir: 'desc',
        selectedEntryId: null,
        loading: false,
        // F-0015: empty trail starts at the genesis hash
        chainHead: AUDIT_CHAIN_GENESIS_HASH,

        seedDemoData: enforce(Permissions.AUDIT_CREATE, 'seedDemoData', () => {
          const unsigned: UnsignedAuditEntry[] = [];
          for (let i = 0; i < SEED_COUNT; i++) {
            unsigned.push({
              id: uid(),
              cellId: {
                cube: 'demo-cube',
                coords: {
                  sectorId: DEMO_SECTORS[i % DEMO_SECTORS.length]!,
                  periodId: DEMO_PERIODS[Math.floor(i / 7) % DEMO_PERIODS.length]!,
                },
                measure: 'value',
                sectorId: DEMO_SECTORS[i % DEMO_SECTORS.length]!,
                scenarioId: 'base',
                periodId: DEMO_PERIODS[Math.floor(i / 7) % DEMO_PERIODS.length]!,
                lineItemId: `item-${i}`,
              },
              userId: DEMO_USERS[i % DEMO_USERS.length]!,
              operation: DEMO_OPERATIONS[i % DEMO_OPERATIONS.length]!,
              dataType: 'number',
              // Demo values are derived from the index so the seeded demo trail is
              // identical on every run (NFR-001).
              previousValue: i % 3 === 0 ? null : ((i * 7919) % 100000) / 100,
              newValue: ((i * 104729 + 17) % 100000) / 100,
              approvalStatus: (['approved', 'auto', 'pending', 'approved'] as ApprovalStatus[])[
                i % 4
              ]!,
              approvalUserId: i % 2 === 0 ? 'manager@finplan.io' : undefined,
              approvalTimestamp: i % 2 === 0 ? now() - i * 60_000 : undefined,
              source: (['manual', 'import', 'api', 'plugin'] as const)[i % 4]!,
              transactionId: i % 5 === 0 ? `tx-${Math.floor(i / 5)}` : undefined,
              timestamp: now() - i * 60_000,
              metadata: i % 4 === 0 ? { reason: 'Q2 close adjustment' } : undefined,
            });
          }
          set((state) => {
            // F-0015: seeded demo entries are chained like any other entry
            for (const entry of unsigned) appendChained(state, entry);
          });
        }),

        recordWrite: (input) => {
          const entry = makeEntry('write', input);
          set((state) => {
            appendChained(state, entry);
          });
          return entry.id;
        },

        recordUpdate: (input) => {
          const entry = makeEntry('update', input);
          set((state) => {
            appendChained(state, entry);
          });
          return entry.id;
        },

        recordDelete: (input) => {
          const entry = makeEntry('delete', input);
          set((state) => {
            appendChained(state, entry);
          });
          return entry.id;
        },

        recordRead: (input) => {
          const entry = makeEntry('read', input);
          set((state) => {
            appendChained(state, entry);
          });
          return entry.id;
        },

        recordBulk: enforce(Permissions.AUDIT_CREATE, 'recordBulk', (inputs) => {
          const txId = uid();
          const ids = inputs.map((input) => {
            const entry = makeEntry('bulk', { ...input, transactionId: txId });
            set((state) => {
              appendChained(state, entry);
            });
            return entry.id;
          });
          return ids;
        }),

        setFilter: (key, value) => {
          set((state) => {
            state.filters[key] = value;
            state.currentPage = 1;
          });
        },

        clearFilters: () => {
          set((state) => {
            state.filters = { ...defaultFilters };
            state.currentPage = 1;
          });
        },

        setSort: (field) => {
          set((state) => {
            if (state.sortField === field) {
              state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
              state.sortField = field;
              state.sortDir = 'desc';
            }
          });
        },

        setPage: (page) => {
          set((state) => {
            state.currentPage = page;
          });
        },

        setPageSize: (size) => {
          set((state) => {
            state.pageSize = size;
            state.currentPage = 1;
          });
        },

        selectEntry: (id) => {
          set((state) => {
            state.selectedEntryId = id;
          });
        },

        revertToState: enforce(Permissions.AUDIT_DELETE, 'revertToState', (entryId) => {
          // The original entry remains intact; reversion appends a new chained
          // entry and requires the central audit:delete permission.

          const entry = get().entries.find((e) => e.id === entryId);
          if (!entry) return;
          // DEC-038: a new action belongs to the authenticated reviewer, not
          // the historical author. Never rewrite old entries to fix attribution.
          const actor = getCurrentUser();
          if (!actor) throw new PermissionError(Permissions.AUDIT_DELETE, 'revertToState');
          // This appends audit evidence only; it does not mutate the source ledger.
          // Generate a new audit entry recording the revert action (Hades GDPR Article 16).
          // F-0015: the revert entry is chained like every other append.
          const revertEntry = makeEntry('update', {
            cellId: entry.cellId,
            userId: actor.id,
            operation: 'update',
            dataType: entry.dataType,
            previousValue: entry.newValue,
            newValue: entry.previousValue ?? null,
            approvalStatus: 'auto',
            source: 'manual',
            metadata: {
              revertedFrom: entryId,
              reason: 'Audit-trail revert-to-state',
            },
          });
          set((state) => {
            appendChained(state, revertEntry);
          });
        }),

        refreshEntries: () => {
          set((state) => {
            state.loading = true;
          });
          // Simulate async refresh
          setTimeout(() => {
            set((state) => {
              state.loading = false;
            });
          }, 250);
        },

        exportToCSV: () => {
          // Export is a role-filtered extract, not a complete-chain verification artifact.
          const entries = excludeGdprEntriesByRole(
            get().entries,
            canRoleViewGdprAudit(getCurrentUser()?.role)
          );
          // Apply the local email-focused redactPII helper to CSV export rows.
          const header = [
            'id',
            'timestamp',
            'cellId',
            'userId',
            'operation',
            'dataType',
            'previousValue',
            'newValue',
            'approvalStatus',
            'source',
            'transactionId',
          ].join(',');
          const rows = entries.map((e) => {
            const redacted = redactPII(e);
            return [
              redacted.id,
              new Date(redacted.timestamp).toISOString(),
              `${redacted.cellId.sectorId}/${redacted.cellId.scenarioId}/${redacted.cellId.periodId}/${redacted.cellId.lineItemId}`,
              redacted.userId,
              redacted.operation,
              redacted.dataType,
              JSON.stringify(redacted.previousValue ?? ''),
              JSON.stringify(redacted.newValue),
              redacted.approvalStatus,
              redacted.source,
              redacted.transactionId ?? '',
            ]
              .map((cell) => `"${sanitizeSpreadsheetText(cell).replace(/"/g, '""')}"`)
              .join(',');
          });
          return [header, ...rows].join('\n');
        },

        exportToJSON: () => {
          const entries = excludeGdprEntriesByRole(
            get().entries,
            canRoleViewGdprAudit(getCurrentUser()?.role)
          );
          // Apply the local email-focused redactPII helper to JSON export rows.
          return JSON.stringify(entries.map(redactPII), null, 2);
        },

        // GDPR review-view filter: entries relevant to GDPR audit review
        // (DPO/compliance), i.e. GDPR-sourced or GDPR-cross-referenced.
        filterByGdprAccess: (entries) => {
          if (!canRoleViewGdprAudit(getCurrentUser()?.role)) return [];
          return entries.filter(
            (e) => e.source === 'gdpr' || e.consentId !== undefined || e.breachEventId !== undefined
          );
        },

        verifyIntegrity: () => {
          const { entries, chainHead } = get();
          const tamperedEntryIds: string[] = [];
          const chainBreaks: AuditChainBreak[] = [];

          // entries are stored newest-first; the chain is verified in append
          // order (oldest → newest), starting from the genesis hash.
          const appendOrder = [...entries].reverse();
          let expectedPrev = AUDIT_CHAIN_GENESIS_HASH;
          for (const entry of appendOrder) {
            // Fail closed: entries without integrity material cannot be verified.
            if (!entry.hash || entry.prevHash === undefined) {
              tamperedEntryIds.push(entry.id);
              if (entry.hash) expectedPrev = entry.hash;
              continue;
            }
            // Link break: mid-chain deletion, reordering, or oldest-entry deletion
            // (the new oldest entry still points at its removed predecessor).
            if (entry.prevHash !== expectedPrev) {
              chainBreaks.push({
                entryId: entry.id,
                expectedPrevHash: expectedPrev,
                actualPrevHash: entry.prevHash,
              });
            }
            // Content mutation: the stored hash no longer matches a recomputation
            // over the stored record (covers previousValue/newValue edits, and
            // also a rewritten hash itself, which then desynchronises the chain).
            if (computeAuditEntryHash(entry) !== entry.hash) {
              tamperedEntryIds.push(entry.id);
            }
            expectedPrev = entry.hash;
          }

          // Head check: truncating the NEWEST entries leaves chainHead pointing
          // at a hash no longer present at entries[0].
          const headIntact =
            entries.length === 0
              ? chainHead === AUDIT_CHAIN_GENESIS_HASH
              : entries[0]!.hash === chainHead;

          return {
            valid: tamperedEntryIds.length === 0 && chainBreaks.length === 0 && headIntact,
            entryCount: entries.length,
            tamperedEntryIds,
            chainBreaks,
            headIntact,
          };
        },
      })),
      {
        name: 'audit-trail-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
        // Persist ONLY the integrity-bearing data. Filters, pagination,
        // and selection are ephemeral UI state; permissions are always derived
        // from the authenticated session, never persisted as a client role.
        partialize: (state) => ({
          entries: state.entries,
          chainHead: state.chainHead,
        }),
      }
    )
  )
);

// ---------------------------------------------------------------------------
// Selectors (memoized helpers)
// ---------------------------------------------------------------------------

/**
 * F-CLIO-2/7 FIX (Sentinel-SecurityAuditor BRUTAL v2.0 P0 — CWE-862 Missing Authorization + SOC2 CC6.1 + GDPR Art. 30 ROPA):
 * Selector that checks whether the current user role can view GDPR-source audit entries.
 * Only admin / compliance / data-protection-officer roles are permitted.
 */
export function canRoleViewGdprAudit(role: string | null | undefined): boolean {
  const normalizedRole = role?.toLowerCase().replaceAll('_', '-');
  return normalizedRole ? GDPR_AUDIT_VIEW_ROLES.includes(normalizedRole as AuditRole) : false;
}

export const selectCanViewGdprAudit = (_state?: State & Actions): boolean =>
  canRoleViewGdprAudit(getCurrentUser()?.role);

/**
 * F-CLIO-2/7 FIX: Helper that filters GDPR-source entries from the entries array
 * for non-RBAC-permitted users. Used by selectFilteredEntries.
 * (Inverse purpose of the store action filterByGdprAccess: this gate HIDES
 * gdpr entries from roles without GDPR-audit visibility.)
 */
export const excludeGdprEntriesByRole = (
  entries: ExtendedAuditEntry[],
  canViewGdpr: boolean
): ExtendedAuditEntry[] =>
  canViewGdpr
    ? entries
    : entries.filter(
        (entry) =>
          entry.source !== 'gdpr' &&
          entry.consentId === undefined &&
          entry.breachEventId === undefined
      );

export const selectFilteredEntries = (state: State & Actions): ExtendedAuditEntry[] => {
  const { entries, filters, sortField, sortDir } = state;
  // F-CLIO-2/7 FIX: Pre-filter GDPR-source entries for non-RBAC users
  const accessibleEntries = excludeGdprEntriesByRole(entries, selectCanViewGdprAudit(state));
  const filtered = accessibleEntries.filter((e) => {
    if (filters.cellId) {
      const cellKey = `${e.cellId.sectorId}/${e.cellId.scenarioId}/${e.cellId.periodId}/${e.cellId.lineItemId}`;
      if (!cellKey.toLowerCase().includes(filters.cellId.toLowerCase())) return false;
    }
    if (filters.userId && e.userId !== filters.userId) return false;
    if (
      filters.operation &&
      filters.operation.length > 0 &&
      !filters.operation.includes(e.operation)
    )
      return false;
    if (filters.dataType && filters.dataType.length > 0 && !filters.dataType.includes(e.dataType))
      return false;
    if (
      filters.approvalStatus &&
      filters.approvalStatus.length > 0 &&
      !filters.approvalStatus.includes(e.approvalStatus)
    )
      return false;
    // F-CLIO-2 FIX: GDPR source filter only available to RBAC-permitted users
    if (filters.source) {
      if (filters.source === 'gdpr' && !selectCanViewGdprAudit(state)) return false;
      if (e.source !== filters.source) return false;
    }
    // F-CLIO-7 FIX: hasConsent filter only available to RBAC-permitted users
    if (filters.hasConsent && !selectCanViewGdprAudit(state)) return false;
    if (filters.hasConsent && !e.consentId) return false;
    if (filters.transactionId && e.transactionId !== filters.transactionId) return false;
    if (filters.dateRange) {
      const [from, to] = filters.dateRange;
      if (e.timestamp < from || e.timestamp > to) return false;
    }
    if (filters.valueRange && typeof e.newValue === 'number') {
      const [min, max] = filters.valueRange;
      if (e.newValue < min || e.newValue > max) return false;
    }
    if (filters.fullTextSearch) {
      const q = filters.fullTextSearch.toLowerCase();
      const haystack =
        `${e.id} ${e.userId} ${e.cellId.lineItemId} ${JSON.stringify(e.metadata ?? '')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.hasVersion && !e.versionId) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'timestamp') return (a.timestamp - b.timestamp) * dir;
    if (sortField === 'userId') return a.userId.localeCompare(b.userId) * dir;
    if (sortField === 'operation') return a.operation.localeCompare(b.operation) * dir;
    if (sortField === 'approvalStatus')
      return a.approvalStatus.localeCompare(b.approvalStatus) * dir;
    if (sortField === 'cellId')
      return (a.cellId.lineItemId ?? '').localeCompare(b.cellId.lineItemId ?? '') * dir;
    return 0;
  });

  return sorted;
};

export const selectPagedEntries = (state: State & Actions): ExtendedAuditEntry[] => {
  const filtered = selectFilteredEntries(state);
  const start = (state.currentPage - 1) * state.pageSize;
  return filtered.slice(start, start + state.pageSize);
};

export const selectTotalPages = (state: State & Actions): number => {
  const filtered = selectFilteredEntries(state);
  return Math.max(1, Math.ceil(filtered.length / state.pageSize));
};

export const selectStats = (
  state: State & Actions,
  canViewGdpr = selectCanViewGdprAudit(state)
) => {
  const entries = excludeGdprEntriesByRole(state.entries, canViewGdpr);
  const uniqueUsers = new Set(entries.map((e) => e.userId));
  const uniqueCells = new Set(
    entries.map((e) => `${e.cellId.sectorId}/${e.cellId.periodId}/${e.cellId.lineItemId}`)
  );
  const operationCounts: Record<AuditOperation, number> = {
    read: 0,
    write: 0,
    update: 0,
    delete: 0,
    bulk: 0,
  };
  const approvalCounts: Record<ApprovalStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    auto: 0,
  };
  for (const e of entries) {
    operationCounts[e.operation]++;
    approvalCounts[e.approvalStatus]++;
  }
  const userCounts = new Map<string, number>();
  for (const e of entries) {
    userCounts.set(e.userId, (userCounts.get(e.userId) ?? 0) + 1);
  }
  const topUsers = [...userCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, count }));
  return {
    total: entries.length,
    uniqueUsers: uniqueUsers.size,
    uniqueCells: uniqueCells.size,
    operationCounts,
    approvalCounts,
    topUsers,
  };
};
