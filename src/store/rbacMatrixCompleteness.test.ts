/**
 * F-0026 ROOT CAUSE — RBAC matrix completeness invariant.
 *
 * The store layer enforces permissions through `enforce()/withRBAC()` using the
 * `Permissions` catalogue in src/utils/rbacEnforcer.ts. Authorization is decided
 * exclusively by `hasPermission(user, p)`, which is a membership test against
 * `user.permissions` — the array populated from ROLE_PERMISSIONS in authStore.
 *
 * Therefore: any permission string that is enforced by shipped store code but
 * granted to NO role is a permanently-dead feature. Not a test problem — every
 * real user, including Admin, gets PermissionError forever. That was the actual
 * defect behind the audit's "store layer 35% red": 28 enforced permissions
 * (capex:*, driver:*, variance:*, dashboard:*, cube:*, workflow:*, notification:*,
 * inventory:*, collab:update, analytics:read, report:schedule, scenario:lock)
 * existed in the catalogue and in store code but in no role.
 *
 * These tests read the real source of truth (ROLE_PERMISSIONS via the exported
 * role catalogue) and the real enforcement sites, so they cannot drift.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { ROLE_PERMISSIONS, ALL_ROLES } from './authStore';
import { Permissions } from '@/utils/rbacEnforcer';

const SRC_ROOT = join(process.cwd(), 'src');

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(full, acc);
    } else if (
      ['.ts', '.tsx'].includes(extname(entry.name)) &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.bench.')
    ) {
      acc.push(full);
    }
  }
  return acc;
}

/** Permission strings actually enforced by non-test product code. */
function collectEnforcedPermissions(): Map<string, string[]> {
  const catalogue = new Map<string, string>(
    Object.entries(Permissions).map(([symbol, value]) => [symbol, value as string])
  );
  const enforced = new Map<string, string[]>();
  const record = (perm: string, file: string) => {
    const list = enforced.get(perm) ?? [];
    if (!list.includes(file)) list.push(file);
    enforced.set(perm, list);
  };

  for (const file of walkSourceFiles(SRC_ROOT)) {
    // rbacEnforcer.ts declares the catalogue; declaration alone is not enforcement.
    if (file.endsWith(join('utils', 'rbacEnforcer.ts'))) continue;
    const source = readFileSync(file, 'utf8');
    const rel = file.slice(SRC_ROOT.length + 1);
    for (const match of source.matchAll(/Permissions\.([A-Z0-9_]+)/g)) {
      const value = catalogue.get(match[1]!);
      if (value) record(value, rel);
    }
    // Literal form: enforce('capex:create', ...) / enforceMany(set, get, { a: 'x:y' })
    for (const match of source.matchAll(/enforce(?:Many)?\(\s*'([a-z_]+:[a-z-]+)'/g)) {
      record(match[1]!, rel);
    }
  }
  return enforced;
}

const grantedByAnyRole = new Set<string>(ALL_ROLES.flatMap((role) => [...ROLE_PERMISSIONS[role]]));

describe('F-0026 RBAC matrix completeness', () => {
  it('grants every enforced permission to at least one role', () => {
    const enforced = collectEnforcedPermissions();
    expect(enforced.size).toBeGreaterThan(40); // guard against a broken collector

    const ungrantable = [...enforced.entries()]
      .filter(([perm]) => !grantedByAnyRole.has(perm))
      .map(([perm, files]) => `${perm} (enforced in ${files.slice(0, 3).join(', ')})`)
      .sort();

    expect(
      ungrantable,
      `These permissions are enforced by shipped code but held by NO role, so the ` +
        `feature is dead for every user including Admin:\n${ungrantable.join('\n')}`
    ).toEqual([]);
  });

  it('gives Admin every permission in the enforcement catalogue', () => {
    const catalogueValues = [...new Set(Object.values(Permissions) as string[])].sort();
    const adminPerms = new Set(ROLE_PERMISSIONS.Admin);
    const missing = catalogueValues.filter((p) => !adminPerms.has(p));
    expect(missing, `Admin is missing catalogue permissions: ${missing.join(', ')}`).toEqual([]);
  });

  it('declares no role permission outside the catalogue (no typos, no orphans)', () => {
    const catalogueValues = new Set(Object.values(Permissions) as string[]);
    const strays: string[] = [];
    for (const role of ALL_ROLES) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        if (!catalogueValues.has(perm)) strays.push(`${role}: ${perm}`);
      }
    }
    expect(
      strays,
      `Role permissions absent from Permissions catalogue: ${strays.join(', ')}`
    ).toEqual([]);
  });

  it('never guards a mutating store action with a read-only permission', () => {
    // Privilege-escalation shape: `enforce(Permissions.X_READ, 'addThing', ...)`
    // lets anyone who can VIEW the data also CHANGE it. esgStore shipped exactly
    // this for all five of its mutators (analytics:read guarding setMetrics /
    // addMetric / updateMetric / removeMetric / setInitiatives), so any Viewer
    // could rewrite ESG disclosures.
    const mutatorPrefixes =
      '(?:set|add|update|delete|remove|clear|create|import|approve|post|lock|close|reopen|rename|move|assign|archive|restore|submit)';
    const offenders: string[] = [];

    for (const file of walkSourceFiles(join(SRC_ROOT, 'store'))) {
      const source = readFileSync(file, 'utf8');
      const rel = file.slice(SRC_ROOT.length + 1);
      const pattern = new RegExp(
        `enforce\\(\\s*Permissions\\.([A-Z0-9_]*_READ)\\s*,\\s*'(${mutatorPrefixes}[A-Za-z0-9]*)'`,
        'g'
      );
      for (const match of source.matchAll(pattern)) {
        offenders.push(`${rel}: ${match[2]} guarded by Permissions.${match[1]}`);
      }
    }

    expect(
      offenders,
      `Mutating actions guarded by a read permission (privilege escalation):\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('keeps least privilege: Viewer holds read-only permissions', () => {
    const writeVerbs = [
      'create',
      'update',
      'delete',
      'approve',
      'write',
      'admin',
      'lock',
      'rotate-keys',
      'assign-role',
      'upload',
      'snapshot',
      'undo',
    ];
    const viewerWrites = ROLE_PERMISSIONS.Viewer.filter((p) => {
      const verb = p.split(':')[1]!;
      return writeVerbs.includes(verb);
    });
    // ui:update is a UI-preference toggle (theme/sidebar), not financial data.
    const financialWrites = viewerWrites.filter((p) => !p.startsWith('ui:'));
    expect(financialWrites, `Viewer must not hold financial write permissions`).toEqual([]);
  });

  it('keeps least privilege: only Admin may delete financial records or manage users', () => {
    // `gl:delete` is deliberately absent from the catalogue — ledger destruction is
    // expressed as `import:delete` (drop an imported batch). Asserting a
    // non-existent permission would be a vacuous test, so the list below is
    // cross-checked against the catalogue first.
    const restricted = [
      'import:delete',
      'entity:delete',
      'user:create',
      'user:delete',
      'user:assign-role',
      'cube:admin',
      'cube:delete',
      'encryption:rotate-keys',
      'budget:delete',
      'audit:delete',
    ];
    const catalogueValues = new Set(Object.values(Permissions) as string[]);
    for (const perm of restricted) {
      expect(catalogueValues.has(perm), `${perm} must exist in the catalogue`).toBe(true);
      const holders = ALL_ROLES.filter((r) => ROLE_PERMISSIONS[r].includes(perm));
      expect(holders, `${perm} must be Admin-only`).toEqual(['Admin']);
    }
  });
});

// ---------------------------------------------------------------------------
// W6-P0-14 (+P1) — every mutating store action carries an enforce() guard.
//
// The Wave-6 audit found 13–14 of ~42 stores exposing mutating actions with
// ZERO RBAC checks (contrast periodCloseStore/budgetStore which wrap each
// mutator in `enforce(permission, 'action', fn)`). Two complementary tiers:
//
// Tier A (generic): ANY Zustand store file under src/store that exposes an
// action whose name matches the mutating-shape regex MUST contain at least
// one `enforce(` call, unless the file is on the reviewed exception list.
// A brand-new store shipping unguarded mutators fails this test.
//
// Tier B (registry): each specific (store file, action, permission) triple
// below MUST appear in source as `enforce(Permissions.X, 'action', ...`.
// Silently deleting or weakening one guard fails this test.
// ---------------------------------------------------------------------------

/** Action names that look like state mutations and therefore require a guard. */
const MUTATING_ACTION_NAME =
  /^(set|add|update|remove|delete|create|import|approve|post|lock|close|reopen|rename|move|assign|archive|restore|submit|record|seed|toggle|write|bulk|connect|disconnect|sync|clear)[A-Z0-9_]*$/;

/**
 * Reviewed exceptions to Tier A. Every entry states WHY enforcement does not
 * apply — entries without a real reason are regressions, not exceptions.
 */
const STORE_ENFORCE_EXCEPTIONS: Record<string, string> = {
  // The permission SOURCE cannot be guarded by permissions (circularity):
  // login/logout/mfa are the authentication boundary itself.
  'authStore.ts': 'Authentication boundary — login/logout/MFA issue the credentials RBAC consumes',
  // Transient (never persisted) DISPLAY context: reporting currency/locale used
  // by rendering hooks (useCurrencyFormatter) for every role including Viewer.
  // Holds no financial data; closest catalogue permission ui:update is held by
  // every role, so a guard would add zero security value while breaking
  // unauthenticated render paths.
  'financialContextStore.ts':
    'Transient display-only context (reporting currency/locale); no persisted or financial data',
  // Not Zustand stores — helper/class modules that merely live in src/store:
  'auditTrailGdprEvents.ts': 'GDPR→audit-trail event bridge module, not a store',
  'periodLockGuard.ts': 'Period-freeze assertion helpers, not a store',
  'eventLedger.ts': 'Event-sourcing ledger class library, not a store',
};

interface GuardedAction {
  /** Store file under src/store. */
  file: string;
  action: string;
  /** Permissions catalogue symbol, e.g. IMPORT_CREATE. */
  permission: keyof typeof Permissions;
}

/**
 * W6-P0-14 guard registry — every mutating action of the previously-unguarded
 * stores, mapped to the closest-fitting EXISTING catalogue permission.
 *
 * Deliberately NOT registered (documented decisions, not omissions):
 * - dataStore.setSelectedAccount / dashboardStore.setActiveDashboard /
 *   auditTrail filters/sort/page/selectEntry: selection & view state.
 * - *Store.setError/clearError/setLoading: transient flags.
 * - auditTrailStore.record{Write,Update,Delete,Read,Bulk}: append-only
 *   instrumentation invoked cross-store by the GDPR bridge
 *   (auditTrailGdprEvents.recordGdprEntry) on behalf of ANY acting user;
 *   gating with Admin-only audit:create would break non-admin event capture,
 *   and tampering is already blocked by revertToState's role gate + F-0015
 *   hash chain verification.
 * - auditTrailStore.revertToState: pre-existing internal AuditRole gate
 *   (admin/compliance/DPO), production caller AuditRow.tsx.
 * - auditTrailStore.setCurrentUserRole: ephemeral view-filter role (excluded
 *   from persistence via partialize).
 * - cubeStore.initialize: engine bootstrap (system dimensions/cubes);
 *   cubeStore.refreshCounts/resetUndoRedo: derived counters & session-local
 *   undo stacks.
 * - cellLineage rewindTo/verifyIntegrity/queryEntries: reads; verifyIntegrity
 *   writes only derived status flags.
 */
const GUARDED_ACTIONS: GuardedAction[] = [
  // dataStore — GL accounts & import jobs
  { file: 'dataStore.ts', action: 'setAccounts', permission: 'IMPORT_UPDATE' },
  { file: 'dataStore.ts', action: 'addAccount', permission: 'IMPORT_CREATE' },
  { file: 'dataStore.ts', action: 'updateAccount', permission: 'IMPORT_UPDATE' },
  { file: 'dataStore.ts', action: 'deleteAccount', permission: 'IMPORT_DELETE' },
  { file: 'dataStore.ts', action: 'toggleAccountActive', permission: 'IMPORT_UPDATE' },
  { file: 'dataStore.ts', action: 'addImportJob', permission: 'IMPORT_CREATE' },
  { file: 'dataStore.ts', action: 'updateImportStatus', permission: 'IMPORT_UPDATE' },
  // settingsStore — org config, users, roles, local prefs
  { file: 'settingsStore.ts', action: 'updateOrganization', permission: 'SETTINGS_UPDATE' },
  { file: 'settingsStore.ts', action: 'setUsers', permission: 'USER_UPDATE' },
  { file: 'settingsStore.ts', action: 'addUser', permission: 'USER_CREATE' },
  { file: 'settingsStore.ts', action: 'updateUser', permission: 'USER_UPDATE' },
  { file: 'settingsStore.ts', action: 'deleteUser', permission: 'USER_DELETE' },
  { file: 'settingsStore.ts', action: 'setRoles', permission: 'USER_ASSIGN_ROLE' },
  { file: 'settingsStore.ts', action: 'updateRolePermissions', permission: 'USER_ASSIGN_ROLE' },
  { file: 'settingsStore.ts', action: 'updatePreferences', permission: 'UI_UPDATE' },
  // auditTrailStore — demo seeding pollutes the persisted hash chain
  { file: 'auditTrailStore.ts', action: 'seedDemoData', permission: 'AUDIT_CREATE' },
  // cellLineageStore — immutable provenance chain appends
  { file: 'cellLineageStore.ts', action: 'recordChange', permission: 'AUDIT_CREATE' },
  // cubeStore — OLAP cube writes
  { file: 'cubeStore.ts', action: 'writeCell', permission: 'CUBE_WRITE' },
  { file: 'cubeStore.ts', action: 'bulkWriteCells', permission: 'CUBE_WRITE' },
  { file: 'cubeStore.ts', action: 'deleteCell', permission: 'CUBE_DELETE' },
  { file: 'cubeStore.ts', action: 'clearAll', permission: 'CUBE_DELETE' },
  { file: 'cubeStore.ts', action: 'createSnapshot', permission: 'CUBE_SNAPSHOT' },
  { file: 'cubeStore.ts', action: 'undo', permission: 'CUBE_UNDO' },
  { file: 'cubeStore.ts', action: 'redo', permission: 'CUBE_UNDO' },
  { file: 'cubeStore.ts', action: 'registerDimension', permission: 'CUBE_ADMIN' },
  { file: 'cubeStore.ts', action: 'registerCube', permission: 'CUBE_ADMIN' },
  { file: 'cubeStore.ts', action: 'addMember', permission: 'CUBE_ADMIN' },
  // dashboardStore — dashboards, widgets, dashboard filters
  { file: 'dashboardStore.ts', action: 'setDashboards', permission: 'DASHBOARD_UPDATE' },
  { file: 'dashboardStore.ts', action: 'addDashboard', permission: 'DASHBOARD_CREATE' },
  { file: 'dashboardStore.ts', action: 'updateDashboard', permission: 'DASHBOARD_UPDATE' },
  { file: 'dashboardStore.ts', action: 'deleteDashboard', permission: 'DASHBOARD_DELETE' },
  { file: 'dashboardStore.ts', action: 'addWidget', permission: 'DASHBOARD_CREATE' },
  { file: 'dashboardStore.ts', action: 'updateWidget', permission: 'DASHBOARD_UPDATE' },
  { file: 'dashboardStore.ts', action: 'removeWidget', permission: 'DASHBOARD_DELETE' },
  { file: 'dashboardStore.ts', action: 'moveWidget', permission: 'DASHBOARD_UPDATE' },
  { file: 'dashboardStore.ts', action: 'addFilter', permission: 'DASHBOARD_UPDATE' },
  { file: 'dashboardStore.ts', action: 'removeFilter', permission: 'DASHBOARD_UPDATE' },
  // governmentStore — public-fund allocations & budget lines (BUDGET_* family,
  // matching healthcareStore/insuranceStore sector-store precedent)
  { file: 'governmentStore.ts', action: 'setFunds', permission: 'BUDGET_UPDATE' },
  { file: 'governmentStore.ts', action: 'addFund', permission: 'BUDGET_CREATE' },
  { file: 'governmentStore.ts', action: 'updateFund', permission: 'BUDGET_UPDATE' },
  { file: 'governmentStore.ts', action: 'removeFund', permission: 'BUDGET_DELETE' },
  { file: 'governmentStore.ts', action: 'setCompliance', permission: 'BUDGET_UPDATE' },
  { file: 'governmentStore.ts', action: 'setBudgetLines', permission: 'BUDGET_UPDATE' },
  { file: 'governmentStore.ts', action: 'clearAll', permission: 'BUDGET_DELETE' },
  // integrationStore — connector lifecycle feeding GL imports
  { file: 'integrationStore.ts', action: 'connect', permission: 'IMPORT_CREATE' },
  { file: 'integrationStore.ts', action: 'disconnect', permission: 'IMPORT_UPDATE' },
  { file: 'integrationStore.ts', action: 'test', permission: 'IMPORT_UPDATE' },
  { file: 'integrationStore.ts', action: 'sync', permission: 'IMPORT_UPDATE' },
  { file: 'integrationStore.ts', action: 'importToLedger', permission: 'IMPORT_CREATE' },
  // logisticsStore — shipments + analytics datasets
  { file: 'logisticsStore.ts', action: 'setShipments', permission: 'INVENTORY_UPDATE' },
  { file: 'logisticsStore.ts', action: 'addShipment', permission: 'INVENTORY_CREATE' },
  { file: 'logisticsStore.ts', action: 'updateShipment', permission: 'INVENTORY_UPDATE' },
  { file: 'logisticsStore.ts', action: 'removeShipment', permission: 'INVENTORY_DELETE' },
  { file: 'logisticsStore.ts', action: 'setCarrierPerformance', permission: 'DASHBOARD_UPDATE' },
  { file: 'logisticsStore.ts', action: 'setRouteCosts', permission: 'DASHBOARD_UPDATE' },
  { file: 'logisticsStore.ts', action: 'clearAll', permission: 'INVENTORY_DELETE' },
  // telecomStore — subscriber base + analytics datasets
  { file: 'telecomStore.ts', action: 'setSubscribers', permission: 'INVENTORY_UPDATE' },
  { file: 'telecomStore.ts', action: 'addSubscriber', permission: 'INVENTORY_CREATE' },
  { file: 'telecomStore.ts', action: 'updateSubscriber', permission: 'INVENTORY_UPDATE' },
  { file: 'telecomStore.ts', action: 'removeSubscriber', permission: 'INVENTORY_DELETE' },
  { file: 'telecomStore.ts', action: 'setNetworkMetrics', permission: 'DASHBOARD_UPDATE' },
  { file: 'telecomStore.ts', action: 'setArpuTrends', permission: 'DASHBOARD_UPDATE' },
  { file: 'telecomStore.ts', action: 'clearAll', permission: 'INVENTORY_DELETE' },
  // workforceStore — employees/departments as org master data (ENTITY_*),
  // payroll periods as financial records (BUDGET_UPDATE)
  { file: 'workforceStore.ts', action: 'setEmployees', permission: 'ENTITY_UPDATE' },
  { file: 'workforceStore.ts', action: 'addEmployee', permission: 'ENTITY_CREATE' },
  { file: 'workforceStore.ts', action: 'updateEmployee', permission: 'ENTITY_UPDATE' },
  { file: 'workforceStore.ts', action: 'removeEmployee', permission: 'ENTITY_DELETE' },
  { file: 'workforceStore.ts', action: 'setDepartments', permission: 'ENTITY_UPDATE' },
  { file: 'workforceStore.ts', action: 'setPayrollPeriods', permission: 'BUDGET_UPDATE' },
  { file: 'workforceStore.ts', action: 'clearAll', permission: 'ENTITY_DELETE' },
];

describe('W6-P0-14 store RBAC guards', () => {
  it('Tier A: every store exposing mutating actions contains an enforce() call', () => {
    const offenders: string[] = [];
    for (const file of walkSourceFiles(join(SRC_ROOT, 'store'))) {
      const rel = file.slice(SRC_ROOT.length + 1);
      const name = basename(file);
      if (name in STORE_ENFORCE_EXCEPTIONS) {
        continue; // reviewed exception — reason recorded in the allowlist
      }
      const source = readFileSync(file, 'utf8');
      if (source.includes('enforce(')) continue;
      // Store-level action declarations appear as `    actionName: (` / `: async (` /
      // `: () =>` inside the create() body (2+ spaces of indent). Interface type
      // rows share the shape, which is fine: they mirror the same API surface.
      const exposesMutatingAction = [...source.matchAll(/(?:^|\n)\s{2,}(\w+)\s*:/g)].some((m) =>
        MUTATING_ACTION_NAME.test(m[1]!)
      );
      if (!exposesMutatingAction) continue;
      offenders.push(`${rel}: no enforce() call found`);
    }
    expect(
      offenders,
      `Stores exposing mutating actions without any RBAC enforce() call:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('Tier B: every registered mutating action is wrapped with its permission', () => {
    const missing: string[] = [];
    const byFile = new Map<string, GuardedAction[]>();
    for (const entry of GUARDED_ACTIONS) {
      const list = byFile.get(entry.file) ?? [];
      list.push(entry);
      byFile.set(entry.file, list);
    }
    for (const [file, entries] of byFile) {
      const source = readFileSync(join(SRC_ROOT, 'store', file), 'utf8');
      for (const { action, permission } of entries) {
        const pattern = new RegExp(
          `enforce\\(\\s*(?:Permissions\\.${permission}|'${Permissions[permission]}')\\s*,\\s*'${action}'`
        );
        if (!pattern.test(source)) {
          missing.push(`${file}: ${action} is not guarded by Permissions.${permission}`);
        }
      }
    }
    expect(
      missing,
      `Registered mutating actions missing their enforce() permission guard:\n${missing.join('\n')}`
    ).toEqual([]);
  });

  it('Tier B sanity: every registered permission exists in the catalogue and reaches a role', () => {
    for (const { file, action, permission } of GUARDED_ACTIONS) {
      const value = Permissions[permission];
      expect(value, `${file}.${action} uses unknown symbol ${String(permission)}`).toBeTruthy();
      expect(
        grantedByAnyRole.has(value),
        `${file}.${action}: ${value} is enforced but held by no role (dead feature)`
      ).toBe(true);
    }
  });
});
