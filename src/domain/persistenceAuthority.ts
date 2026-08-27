/**
 * W0.8 persistence authority contract (Blueprint §18.2).
 *
 * THIS FILE IS THE SOURCE OF TRUTH for which Zustand persist keys exist,
 * whether they hold financial truth, and which copy is authoritative.
 *
 * - `financial-truth` + `local-draft`  → client replica only. Not official.
 * - `financial-truth` + `server`       → Control Plane is the system of record.
 * - `user-preference`                  → local is authoritative (layout, theme).
 * - `derived-cache`                    → rebuildable; never the system of record.
 * - `session`                          → tokens / ephemeral auth material.
 *
 * Drift against `persist({ name })` in `src/store` fails CI
 * (`npm run persistence:map`). Do not add a persisted store without a row here.
 */

export const STORE_CLASSIFICATIONS = [
  'financial-truth',
  'user-preference',
  'derived-cache',
  'session',
] as const;

export type StoreClassification = (typeof STORE_CLASSIFICATIONS)[number];

export const AUTHORITIES = ['server', 'local-draft', 'local'] as const;

export type Authority = (typeof AUTHORITIES)[number];

export interface PersistedStoreContract {
  /** Zustand persist `name` (the key written through masterStorage). */
  persistKey: string;
  /** Repo-relative module path. */
  module: string;
  classification: StoreClassification;
  /**
   * Who is the system of record.
   * `local-draft` means the client copy is a draft and MUST be labelled as
   * such in the UI (W0.8.5). `server` means official numbers come only from
   * the Control Plane. `local` is legitimate only for preferences/session.
   */
  authority: Authority;
  /** Server route that will own this data, or null if none is planned. */
  serverRoute: string | null;
  notes: string;
}

/**
 * Exhaustive register of every Zustand `persist()` store.
 * Count is asserted by `scripts/persistence-map-check.mjs`.
 */
export const PERSISTED_STORES = [
  {
    persistKey: 'analytics-store',
    module: 'src/store/analyticsStore.ts',
    classification: 'derived-cache',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Derived analytics views. Rebuildable from GL/facts; not a system of record.',
  },
  {
    persistKey: 'audit-trail-store',
    module: 'src/store/auditTrailStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/audit',
    notes: 'Client-side audit chain. Official trail is server audit_log (F-AUDIT-001).',
  },
  {
    persistKey: 'auth-store',
    module: 'src/store/authStore.ts',
    classification: 'session',
    authority: 'local',
    serverRoute: '/api/auth',
    notes: 'Access/refresh tokens. Not financial truth. Never a durability claim.',
  },
  {
    persistKey: 'budget-store',
    module: 'src/store/budgetStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/budgets',
    notes: 'Budget lines. Server route exists; the workspace store is not wired to it.',
  },
  {
    persistKey: 'capex-store',
    module: 'src/store/capexStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'CapEx register and depreciation inputs. Local-draft until a server resource exists.',
  },
  {
    persistKey: 'cell-lineage-store',
    module: 'src/store/cellLineageStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Client lineage. Governed lineage graph is F-PLAT-005 (Phase 1).',
  },
  {
    persistKey: 'collaboration-store',
    module: 'src/store/collaborationStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'Presence/comments cache. Not financial truth.',
  },
  {
    persistKey: 'construction-store',
    module: 'src/store/constructionStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Vertical pack inputs (projects, change orders). Must not seed demo quotes.',
  },
  {
    persistKey: 'cube-store',
    module: 'src/store/cubeStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'OLAP cells. Derived stores are never the system of record (ST2).',
  },
  {
    persistKey: 'dashboard-store',
    module: 'src/store/dashboardStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'Dashboard layout/widgets. Preference, not ledger.',
  },
  {
    persistKey: 'data-store',
    module: 'src/store/dataStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Imported datasets. Local-draft until inbox/outbox (F-INTEGRATE-000).',
  },
  {
    persistKey: 'debt-store',
    module: 'src/store/debtStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Debt facilities and schedules.',
  },
  {
    persistKey: 'document-store',
    module: 'src/store/documentStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes:
      'Document library metadata (uploads, tags, entity links). Not financial truth; content lives outside masterStorage.',
  },
  {
    persistKey: 'driver-store',
    module: 'src/store/driverStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Driver-based planning inputs.',
  },
  {
    persistKey: 'education-store',
    module: 'src/store/educationStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Education-pack operational inputs (enrolment). Not a GL.',
  },
  {
    persistKey: 'energy-store',
    module: 'src/store/energyStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Energy-pack generation inputs.',
  },
  {
    persistKey: 'entity-store',
    module: 'src/store/entityStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/entities',
    notes: 'Legal-entity tree. Server route exists; store is not the authority.',
  },
  {
    persistKey: 'esg-store',
    module: 'src/store/esgStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'ESG/carbon facts. Same control plane as money once governed.',
  },
  {
    persistKey: 'forecast-store',
    module: 'src/store/forecastStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/forecasts',
    notes: 'Forecast versions. Server route exists; workspace store is unwired.',
  },
  {
    persistKey: 'fx-rate-store',
    module: 'src/store/fxRateStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'FX rates stored with facts (D5). Local-draft until rate table is authoritative.',
  },
  {
    persistKey: 'gl-store',
    module: 'src/store/glStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/gl',
    notes:
      'THE ledger. W0.8.6-G6 landed: entries carry server UUIDs after publish (entryVersions persisted for If-Match); drafts drain via commitDraftsToServer. Budgets/forecasts remain local-draft.',
  },
  {
    persistKey: 'gl-trialbalance-store',
    module: 'src/store/glTrialBalanceStore.ts',
    classification: 'derived-cache',
    authority: 'local-draft',
    serverRoute: '/api/gl/trial-balance',
    notes: 'Trial-balance cache. Rebuildable from gl-store / server TB.',
  },
  {
    persistKey: 'gl-upload-store',
    module: 'src/store/glUploadStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/gl/entries/bulk',
    notes: 'GL import wizard mapping and staging.',
  },
  {
    persistKey: 'government-store',
    module: 'src/store/governmentStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Public-sector appropriations. Must not fall back to demo fixtures.',
  },
  {
    persistKey: 'healthcare-store',
    module: 'src/store/healthcareStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Healthcare-pack operational inputs (trials, quality).',
  },
  {
    persistKey: 'insurance-store',
    module: 'src/store/insuranceStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Insurance-pack operational inputs.',
  },
  {
    persistKey: 'integration-store',
    module: 'src/store/integrationStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'Connector configuration (no credentials). Not ledger.',
  },
  {
    persistKey: 'lease-store',
    module: 'src/store/leaseStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Lease abstracts and schedules (ASC 842 / IFRS 16).',
  },
  {
    persistKey: 'logistics-store',
    module: 'src/store/logisticsStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Logistics-pack operational inputs (shipments).',
  },
  {
    persistKey: 'notification-store',
    module: 'src/store/notificationStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'In-app notification inbox. Preference/UX, not ledger.',
  },
  {
    persistKey: 'period-close-store',
    module: 'src/store/periodCloseStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/periods',
    notes: 'Close-task UI state. Period lock itself must be DB-level (F-CLOSE-002).',
  },
  {
    persistKey: 'realestate-store',
    module: 'src/store/realEstateStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Real-estate pack (properties, REIT inputs).',
  },
  {
    persistKey: 'report-store',
    module: 'src/store/reportStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/reports',
    notes: 'Saved report definitions. Snapshots must be server-side (Phase 2).',
  },
  {
    persistKey: 'retail-store',
    module: 'src/store/retailStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Retail-pack operational inputs (promotions).',
  },
  {
    persistKey: 'scenario-store',
    module: 'src/store/scenarioStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: '/api/scenarios',
    notes: 'Scenario versions. Server route exists; store is unwired.',
  },
  {
    persistKey: 'settings-store',
    module: 'src/store/settingsStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'User/tenant display settings. Local is legitimate.',
  },
  {
    persistKey: 'telecom-store',
    module: 'src/store/telecomStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Telecom-pack operational inputs (subscribers, ARPU).',
  },
  {
    persistKey: 'tour-store',
    module: 'src/store/tourStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'Onboarding tour progress.',
  },
  {
    persistKey: 'ui-store',
    module: 'src/store/uiStore.ts',
    classification: 'user-preference',
    authority: 'local',
    serverRoute: null,
    notes: 'Sidebar, density, toasts. Not financial truth.',
  },
  {
    persistKey: 'variance-store',
    module: 'src/store/varianceStore.ts',
    classification: 'derived-cache',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Variance working set. Rebuildable from budget + actuals.',
  },
  {
    persistKey: 'workflow-store',
    module: 'src/store/workflowStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Approval workflow UI state. Declarative machines are F-WORKFLOW-008.',
  },
  {
    persistKey: 'workforce-store',
    module: 'src/store/workforceStore.ts',
    classification: 'financial-truth',
    authority: 'local-draft',
    serverRoute: null,
    notes: 'Headcount / compensation planning inputs. Masking is F-SEC-003.',
  },
] as const satisfies readonly PersistedStoreContract[];

export type PersistKey = (typeof PERSISTED_STORES)[number]['persistKey'];

const byKey: ReadonlyMap<string, PersistedStoreContract> = new Map(
  PERSISTED_STORES.map((row) => [row.persistKey, row])
);

export function getStoreContract(persistKey: string): PersistedStoreContract | undefined {
  return byKey.get(persistKey);
}

/** True when any financial-truth store is still a local draft (W0.8.5). */
export function hasLocalDraftFinancialTruth(): boolean {
  return PERSISTED_STORES.some(
    (row) => row.classification === 'financial-truth' && row.authority === 'local-draft'
  );
}

export function financialTruthStores(): PersistedStoreContract[] {
  return PERSISTED_STORES.filter((row) => row.classification === 'financial-truth');
}

export const PERSISTED_STORE_COUNT = PERSISTED_STORES.length;
