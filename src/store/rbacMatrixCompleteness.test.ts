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
import { dirname, extname, join, resolve } from 'node:path';
import * as ts from 'typescript';
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
// Tier A (AST census): discover every Zustand state-returning callback under
// src/store, identify mutating action-shaped properties, and require each one
// to have a direct permission guard or an exact action-level exception with a
// written reason. This is per-action (not per-file), so one guarded action
// cannot mask another unguarded action in the same store.
//
// Tier B (registry): selected high-risk actions must use the exact permission
// symbol in source. This pins the intended policy, not only guard presence.
// ---------------------------------------------------------------------------

/** Action names that look like state mutations and therefore require a guard. */
const MUTATING_ACTION_NAME =
  /^(set|add|update|remove|delete|create|import|approve|post|lock|close|reopen|rename|move|assign|archive|restore|submit|record|seed|toggle|write|bulk|connect|disconnect|sync|clear|reset|refresh|initialize|select|calculate|generate|switch|login|logout|register|revoke|rotate|upload|request|mark|resolve|cancel|run|apply|rebuild|load|save|transition|execute|complete|reject|revert|undo|redo|check|enter|exit|open|next|prev|attach|detach|flush)[A-Za-z0-9_]*$/;

const STORE_CREATOR_WRAPPERS = new Set([
  'create',
  'persist',
  'immer',
  'subscribeWithSelector',
  'devtools',
  'combine',
]);
const RBAC_ACTION_WRAPPERS = new Set(['enforce', 'withRBAC']);
const RBAC_ASSERTION_CALLS = new Set(['assertPermission', 'assertPermissions']);
const RBAC_GUARD_EXPORTS = new Set([...RBAC_ACTION_WRAPPERS, ...RBAC_ASSERTION_CALLS]);

function collectImportedRbacGuards(sourceFile: ts.SourceFile): Set<string> {
  const imported = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const modulePath = statement.moduleSpecifier.text;
    const isCanonicalRbacModule =
      modulePath === '@/utils/rbacEnforcer' ||
      (modulePath.startsWith('.') &&
        resolve(dirname(sourceFile.fileName), modulePath) ===
          resolve(SRC_ROOT, 'utils/rbacEnforcer'));
    if (!isCanonicalRbacModule) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      const exportedName = element.propertyName?.text ?? element.name.text;
      if (RBAC_GUARD_EXPORTS.has(exportedName)) imported.add(element.name.text);
    }
  }
  return imported;
}

interface StoreActionSource {
  readonly file: string;
  readonly action: string;
  readonly line: number;
  readonly guarded: boolean;
}

function unwrapParentheses(node: ts.Expression): ts.Expression {
  let current = node;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

function expressionName(node: ts.Expression): string | undefined {
  let current = unwrapParentheses(node);
  while (ts.isCallExpression(current)) current = unwrapParentheses(current.expression);
  if (ts.isIdentifier(current)) return current.text;
  if (ts.isPropertyAccessExpression(current)) return current.name.text;
  return undefined;
}

function bindingContainsName(bindingName: ts.BindingName, soughtName: string): boolean {
  if (ts.isIdentifier(bindingName)) return bindingName.text === soughtName;
  return bindingName.elements.some((element) => bindingContainsName(element.name, soughtName));
}

function hasDirectRbacGuard(actionNode: ts.Node, importedGuards: ReadonlySet<string>): boolean {
  const isImportedActionWrapper = (expression: ts.Expression): boolean => {
    const name = expressionName(expression);
    return Boolean(name && importedGuards.has(name) && RBAC_ACTION_WRAPPERS.has(name));
  };
  if (ts.isCallExpression(actionNode)) {
    return isImportedActionWrapper(actionNode.expression);
  }

  if (
    !ts.isArrowFunction(actionNode) &&
    !ts.isFunctionExpression(actionNode) &&
    !ts.isMethodDeclaration(actionNode)
  ) {
    return false;
  }

  const isImportedAssertion = (expression: ts.Expression): boolean => {
    const name = expressionName(expression);
    return Boolean(
      name &&
      importedGuards.has(name) &&
      RBAC_ASSERTION_CALLS.has(name) &&
      !actionNode.parameters.some((parameter) => bindingContainsName(parameter.name, name))
    );
  };

  const body = actionNode.body;
  if (!body) return false;
  if (!ts.isBlock(body)) {
    const root = unwrapParentheses(body);
    return ts.isCallExpression(root) && isImportedAssertion(root.expression);
  }

  const firstExecutable = body.statements.find(
    (statement) =>
      !ts.isEmptyStatement(statement) &&
      !(ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression))
  );
  if (!firstExecutable || !ts.isExpressionStatement(firstExecutable)) return false;
  const expression = unwrapParentheses(firstExecutable.expression);
  return ts.isCallExpression(expression) && isImportedAssertion(expression.expression);
}

function storeObjectFromCallback(
  callback: ts.ArrowFunction
): ts.ObjectLiteralExpression | undefined {
  const body = callback.body;
  if (!ts.isBlock(body)) {
    const expressionBody = unwrapParentheses(body);
    return ts.isObjectLiteralExpression(expressionBody) ? expressionBody : undefined;
  }
  for (const statement of body.statements) {
    if (
      ts.isReturnStatement(statement) &&
      statement.expression &&
      ts.isObjectLiteralExpression(unwrapParentheses(statement.expression))
    ) {
      return unwrapParentheses(statement.expression) as ts.ObjectLiteralExpression;
    }
  }
  return undefined;
}

/** AST inventory of the state-returning callbacks supplied to Zustand creators. */
function collectMutatingStoreActions(): StoreActionSource[] {
  const rows: StoreActionSource[] = [];
  const seenObjects = new Set<ts.ObjectLiteralExpression>();

  for (const file of walkSourceFiles(join(SRC_ROOT, 'store'))) {
    const source = readFileSync(file, 'utf8');
    const relativeFile = file.slice(join(SRC_ROOT, 'store').length + 1);
    const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
    const importedRbacGuards = collectImportedRbacGuards(sourceFile);

    const visit = (node: ts.Node): void => {
      if (ts.isArrowFunction(node)) {
        const stateObject = storeObjectFromCallback(node);
        const callbackCall = node.parent;
        if (stateObject && ts.isCallExpression(callbackCall)) {
          const wrapperName = expressionName(callbackCall.expression);
          let hasCreateAncestor = false;
          for (
            let ancestor: ts.Node | undefined = callbackCall;
            ancestor;
            ancestor = ancestor.parent
          ) {
            if (ts.isCallExpression(ancestor) && expressionName(ancestor.expression) === 'create') {
              hasCreateAncestor = true;
              break;
            }
          }

          if (
            hasCreateAncestor &&
            wrapperName &&
            STORE_CREATOR_WRAPPERS.has(wrapperName) &&
            !seenObjects.has(stateObject)
          ) {
            seenObjects.add(stateObject);
            for (const property of stateObject.properties) {
              let actionName: string | undefined;
              let actionNode: ts.Node | undefined;
              if (ts.isPropertyAssignment(property)) {
                actionName =
                  ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
                    ? property.name.text
                    : undefined;
                actionNode = property.initializer;
              } else if (ts.isMethodDeclaration(property)) {
                actionName =
                  ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
                    ? property.name.text
                    : undefined;
                actionNode = property;
              }
              if (!actionName || !actionNode) continue;
              if (
                !ts.isArrowFunction(actionNode) &&
                !ts.isFunctionExpression(actionNode) &&
                !ts.isMethodDeclaration(actionNode) &&
                !ts.isCallExpression(actionNode)
              ) {
                continue;
              }

              const guarded = hasDirectRbacGuard(actionNode, importedRbacGuards);
              let writesStoreState = false;
              const inspectWrites = (child: ts.Node): void => {
                if (
                  ts.isCallExpression(child) &&
                  ts.isIdentifier(child.expression) &&
                  child.expression.text === 'set'
                ) {
                  writesStoreState = true;
                }
                ts.forEachChild(child, inspectWrites);
              };
              inspectWrites(actionNode);
              if (!MUTATING_ACTION_NAME.test(actionName) && !writesStoreState) continue;
              rows.push({
                file: relativeFile,
                action: actionName,
                line: sourceFile.getLineAndCharacterOfPosition(property.getStart()).line + 1,
                guarded,
              });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return rows;
}

/** Find production code that calls Zustand's public setState API on an imported store. */
function collectExternalStoreSetStateAccesses(): string[] {
  const writes: string[] = [];
  const storeRoot = resolve(SRC_ROOT, 'store');

  for (const file of walkSourceFiles(SRC_ROOT)) {
    const relativeFile = file.slice(SRC_ROOT.length + 1);
    if (relativeFile.startsWith('test/') || relativeFile.startsWith('__tests__/')) continue;

    const source = readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const storeBindings = new Set<string>();

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
        continue;
      const modulePath = statement.moduleSpecifier.text;
      const resolvedModule = modulePath.startsWith('@/')
        ? resolve(SRC_ROOT, modulePath.slice(2))
        : modulePath.startsWith('.')
          ? resolve(dirname(file), modulePath)
          : undefined;
      if (
        !resolvedModule ||
        (resolvedModule !== storeRoot && !resolvedModule.startsWith(`${storeRoot}/`))
      ) {
        continue;
      }

      if (statement.importClause?.name) storeBindings.add(statement.importClause.name.text);
      const bindings = statement.importClause?.namedBindings;
      if (!bindings) continue;
      if (ts.isNamespaceImport(bindings)) {
        storeBindings.add(bindings.name.text);
      } else {
        for (const element of bindings.elements) storeBindings.add(element.name.text);
      }
    }

    const rootIdentifier = (expression: ts.Expression): ts.Identifier | undefined => {
      let current = expression;
      while (ts.isPropertyAccessExpression(current)) current = current.expression;
      return ts.isIdentifier(current) ? current : undefined;
    };
    const visit = (node: ts.Node): void => {
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'setState') {
        const receiver = rootIdentifier(node.expression);
        if (receiver && storeBindings.has(receiver.text)) {
          writes.push(
            `${relativeFile}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return writes.sort();
}

/**
 * Exact action-level exceptions to RBAC enforcement. The AST census below
 * applies these only to the named store methods; a new method in the same file
 * is still required to have a guard or an explicit exception.
 */
interface UnguardedActionException {
  readonly file: string;
  readonly actions: readonly string[];
  readonly reason: string;
}

const UNGUARDED_ACTION_EXCEPTIONS: readonly UnguardedActionException[] = [
  {
    file: '*',
    actions: ['setError', 'clearError', 'setLoading'],
    reason: 'Transient error/loading UI status only; does not mutate business records.',
  },
  {
    file: 'analyticsStore.ts',
    actions: [
      'setSelectedChart',
      'setDateRange',
      'setSelectedMetrics',
      'setFilter',
      'clearFilters',
      'enterDrillDown',
      'exitDrillDown',
    ],
    reason:
      'Local analytics-view configuration; data mutation is performed by separately guarded stores.',
  },
  {
    file: 'auditTrailStore.ts',
    actions: ['recordWrite', 'recordUpdate', 'recordDelete', 'recordRead'],
    reason:
      'The in-repository caller is the GDPR event bridge; do not require Admin-only audit:create for lower-role event capture. These public methods trust caller-supplied payloads and do not authenticate the source; the local unkeyed chain is not general audit authority.',
  },
  {
    file: 'auditTrailStore.ts',
    actions: ['setFilter', 'clearFilters', 'setSort', 'setPage', 'setPageSize', 'selectEntry'],
    reason: 'Local audit-trail view state only; no audit records are changed.',
  },
  {
    file: 'auditTrailStore.ts',
    actions: ['refreshEntries'],
    reason: 'Refreshes only the transient loading indicator; source audit entries are unchanged.',
  },
  {
    file: 'cellLineageStore.ts',
    actions: ['verifyIntegrity'],
    reason:
      'Recomputes derived integrity-valid flags and timestamp only; immutable lineage entries and their hashes are not rewritten.',
  },
  {
    file: 'authStore.ts',
    actions: [
      'login',
      'loginMock',
      'loginReal',
      'logout',
      'restoreCachedSession',
      'revokeCachedSession',
      'refreshAccessToken',
    ],
    reason:
      'Authentication/session lifecycle boundary; these establish, refresh, or revoke the identity consumed by RBAC rather than acting under it.',
  },
  {
    file: 'authStore.ts',
    actions: ['register'],
    reason:
      'Unauthenticated registration is a separate identity-establishment boundary, not RBAC-authorized work. No verified backend registration flow exists, so production builds and builds without mock auth reject this local/mock-user path; it is available only in explicitly mock-auth non-production builds.',
  },
  {
    file: 'authStore.ts',
    actions: ['setUser'],
    reason:
      'Compatibility setter is disabled in production builds and has no product call site; in development/test it still derives permissions from role and discards caller-supplied permissions.',
  },
  {
    file: 'authStore.ts',
    actions: ['switchEntity'],
    reason:
      'Auth context selector used by the entity-switching flow; unresolved owner/product decision because the User model does not define the authorized entity set. Entity-scoped authorization must be specified before this action can be guarded safely; do not infer access from the activeEntityId.',
  },
  {
    file: 'budgetStore.ts',
    actions: ['setActiveBudget'],
    reason:
      'Current-budget UI selection only; budget records and line items are changed by guarded actions.',
  },
  {
    file: 'cubeStore.ts',
    actions: ['initialize'],
    reason:
      'System bootstrap registers engine dimensions/cubes; it does not write cube cell values.',
  },
  {
    file: 'cubeStore.ts',
    actions: ['refreshCounts', 'resetUndoRedo'],
    reason:
      'Derived counters and session-local undo/redo bookkeeping only; financial cube writes remain guarded.',
  },
  {
    file: 'dashboardStore.ts',
    actions: ['setActiveDashboard'],
    reason:
      'Current-dashboard UI selection only; dashboard records and widgets are changed by guarded actions.',
  },
  {
    file: 'dataStore.ts',
    actions: ['setSelectedAccount'],
    reason: 'Current-account UI selection only; account master data is changed by guarded actions.',
  },
  {
    file: 'driverStore.ts',
    actions: ['selectDriver'],
    reason:
      'Driver selection only; driver records and applied cascades are changed by guarded actions.',
  },
  {
    file: 'driverStore.ts',
    actions: ['calculateCascade'],
    reason:
      'Computes and stores a preview result only; applying the preview to financial cells requires driver:update.',
  },
  {
    file: 'driverStore.ts',
    actions: ['createSnapshot'],
    reason:
      'Creates a read-only engine snapshot for preview/undo; restoring or applying changes is separately guarded.',
  },
  {
    file: 'financialContextStore.ts',
    actions: ['setContext', 'resetContext'],
    reason:
      'Display-only reporting currency/locale context; no persisted or financial data is held here.',
  },
  {
    file: 'glStore.ts',
    actions: ['generateTrialBalance'],
    reason:
      'Derives a read-only trial-balance view from existing ledger entries; it does not create or edit ledger records.',
  },
  {
    file: 'glStore.ts',
    actions: ['checkDuplicates'],
    reason:
      'Read-only duplicate-candidate analysis; it returns findings without changing ledger state.',
  },
  {
    file: 'glStore.ts',
    actions: ['analyzeAccount'],
    reason:
      'Builds the selected account analysis view from existing ledger entries; it writes only derived presentation state, not financial records.',
  },
  {
    file: 'uiStore.ts',
    actions: [
      'toggleSidebar',
      'openMobileSidebar',
      'closeMobileSidebar',
      'toggleCommandPalette',
      'toggleHelpPanel',
      'setHelpPanelOpen',
      'removeToast',
      'setOnline',
    ],
    reason:
      'Transient presentation, notification, or connectivity state only; no business records are changed.',
  },
  {
    file: 'tourStore.ts',
    actions: ['nextStep', 'prevStep'],
    reason:
      'Advances or reverses the currently displayed onboarding step; tour setup/completion uses the guarded UI update actions.',
  },
  {
    file: 'workflowStore.ts',
    actions: ['refreshState'],
    reason:
      'Refreshes workflow-derived state; approval and workflow transitions are guarded separately.',
  },
  {
    file: 'exceptionDispositionStore.ts',
    actions: ['recordDisposition', 'updateDisposition'],
    reason:
      'Delegates disposition changes to the store action that applies exception:disposition; delegated authorization is covered by the permission-denial tests.',
  },
];

function unguardedActionReason(file: string, action: string): string | undefined {
  return UNGUARDED_ACTION_EXCEPTIONS.find(
    (entry) => (entry.file === file || entry.file === '*') && entry.actions.includes(action)
  )?.reason;
}

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
 * - auditTrailStore.record{Write,Update,Delete,Read}: append-only calls
 *   currently originate in the GDPR event bridge; requiring Admin-only
 *   audit:create would drop lower-role event capture. These public methods
 *   trust caller payloads and do not authenticate source; the client chain is
 *   not general audit authority. recordBulk is guarded with audit:create.
 * - auditTrailStore.revertToState is registered below with audit:delete.
 * - Audit-trail filtering/pagination state is ephemeral view state; GDPR
 *   visibility derives from the authenticated session, never a mutable role.
 * - cubeStore.initialize: engine bootstrap (system dimensions/cubes);
 *   cubeStore.refreshCounts/resetUndoRedo: derived counters & session-local
 *   undo stacks.
 * - cellLineage rewindTo/verifyIntegrity/queryEntries: reads; verifyIntegrity
 *   writes only derived status flags.
 */
const GUARDED_ACTIONS: GuardedAction[] = [
  // periodCloseStore — fiscal calendar initialization is a period-close write
  { file: 'periodCloseStore.ts', action: 'initialize', permission: 'PERIOD_CLOSE' },
  // workflowStore — timeout escalation advances approval requests
  { file: 'workflowStore.ts', action: 'checkEscalations', permission: 'WORKFLOW_UPDATE' },
  // budgetStore — direct financial-data mutation paths
  { file: 'budgetStore.ts', action: 'setBudgets', permission: 'BUDGET_UPDATE' },
  { file: 'budgetStore.ts', action: 'setLineItems', permission: 'BUDGET_UPDATE' },
  { file: 'budgetStore.ts', action: 'updateLineItem', permission: 'BUDGET_UPDATE' },
  { file: 'budgetStore.ts', action: 'undo', permission: 'BUDGET_UPDATE' },
  { file: 'budgetStore.ts', action: 'redo', permission: 'BUDGET_UPDATE' },
  { file: 'budgetStore.ts', action: 'duplicateBudget', permission: 'BUDGET_CREATE' },
  { file: 'budgetStore.ts', action: 'unlockBudget', permission: 'BUDGET_UPDATE' },
  { file: 'documentStore.ts', action: 'tagDocument', permission: 'IMPORT_UPDATE' },
  { file: 'documentStore.ts', action: 'linkDocumentToEntity', permission: 'IMPORT_UPDATE' },
  { file: 'driverStore.ts', action: 'batchUpdate', permission: 'DRIVER_UPDATE' },
  { file: 'glStore.ts', action: 'commitDraftsToServer', permission: 'IMPORT_CREATE' },
  { file: 'glStore.ts', action: 'hydrateCommittedFromServer', permission: 'IMPORT_CREATE' },
  { file: 'glStore.ts', action: 'filterByDate', permission: 'UI_UPDATE' },
  { file: 'glStore.ts', action: 'filterByAccount', permission: 'UI_UPDATE' },
  { file: 'integrationStore.ts', action: 'test', permission: 'IMPORT_UPDATE' },
  { file: 'scenarioStore.ts', action: 'unlockScenario', permission: 'SCENARIO_LOCK' },
  { file: 'scenarioStore.ts', action: 'mergeScenarios', permission: 'SCENARIO_CREATE' },
  { file: 'tourStore.ts', action: 'startTour', permission: 'UI_UPDATE' },
  { file: 'tourStore.ts', action: 'stopTour', permission: 'UI_UPDATE' },
  { file: 'workflowStore.ts', action: 'delegateRequest', permission: 'WORKFLOW_UPDATE' },
  // collaborationStore — bulk setters must match the guarded single-record actions
  { file: 'collaborationStore.ts', action: 'setComments', permission: 'COLLAB_UPDATE' },
  { file: 'collaborationStore.ts', action: 'setTasks', permission: 'COLLAB_UPDATE' },
  { file: 'collaborationStore.ts', action: 'setApprovals', permission: 'WORKFLOW_APPROVE' },
  { file: 'collaborationStore.ts', action: 'setActivityLog', permission: 'COLLAB_UPDATE' },
  // esgStore — clearing all records is the delete operation
  { file: 'esgStore.ts', action: 'clearAll', permission: 'ANALYTICS_DELETE' },
  // fxRateStore — exchange rates are forecast inputs
  { file: 'fxRateStore.ts', action: 'deleteRate', permission: 'FORECAST_DELETE' },
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
  // auditTrailStore — demo seed, bulk append and revert mutate the persisted hash chain
  { file: 'auditTrailStore.ts', action: 'seedDemoData', permission: 'AUDIT_CREATE' },
  { file: 'auditTrailStore.ts', action: 'recordBulk', permission: 'AUDIT_CREATE' },
  { file: 'auditTrailStore.ts', action: 'revertToState', permission: 'AUDIT_DELETE' },
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

describe('W6-P0-14 AST guard classification', () => {
  function parseAction(expression: string, includeRbacImport = true) {
    const importLine = includeRbacImport
      ? "import { enforce, assertPermission } from '@/utils/rbacEnforcer';\n"
      : '';
    const sourceFile = ts.createSourceFile(
      'rbac-guard-fixture.ts',
      `${importLine}const action = ${expression};`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const declarationStatement = sourceFile.statements.find(ts.isVariableStatement);
    const declaration = declarationStatement?.declarationList.declarations[0];
    return {
      action: declaration!.initializer!,
      importedGuards: collectImportedRbacGuards(sourceFile),
    };
  }

  function isGuarded(expression: string, includeRbacImport = true): boolean {
    const parsed = parseAction(expression, includeRbacImport);
    return hasDirectRbacGuard(parsed.action, parsed.importedGuards);
  }

  it('recognizes imported direct wrappers and first-statement permission assertions', () => {
    expect(isGuarded("enforce('audit:create', 'write', () => {})")).toBe(true);
    expect(
      isGuarded("() => { assertPermission('audit:create', 'write'); set({ value: 1 }); }")
    ).toBe(true);
  });

  it('does not count nested, unused, or unimported lookalike checks as a guard', () => {
    expect(
      isGuarded(
        "() => { if (ready) enforce('audit:create', 'write', () => {}); set({ value: 1 }); }"
      )
    ).toBe(false);
    expect(
      isGuarded(
        "() => { const unused = enforce('audit:create', 'write', () => {}); set({ value: 1 }); }"
      )
    ).toBe(false);
    expect(
      isGuarded("() => { enforce('audit:create', 'write', () => {}); set({ value: 1 }); }")
    ).toBe(false);
    expect(isGuarded("enforce('audit:create', 'write', () => {})", false)).toBe(false);
    expect(
      isGuarded("() => { assertPermission('audit:create', 'write'); set({ value: 1 }); }", false)
    ).toBe(false);
    expect(
      isGuarded(
        "(assertPermission) => { assertPermission('audit:create', 'write'); set({ value: 1 }); }"
      )
    ).toBe(false);
  });
});

describe('W6-P0-14 store RBAC guards', () => {
  it('prevents production callers from bypassing store actions with Zustand setState', () => {
    const bypasses = collectExternalStoreSetStateAccesses();
    expect(
      bypasses,
      `Use store actions rather than public Zustand setState outside test helpers:\n${bypasses.join('\n')}`
    ).toEqual([]);
  });

  it('Tier A: every AST-discovered mutating store action is guarded or explicitly justified', () => {
    const actions = collectMutatingStoreActions();
    expect(
      actions.length,
      'AST census should discover a substantial action surface'
    ).toBeGreaterThan(350);
    const discoveredFiles = new Set(actions.map((entry) => entry.file));
    const storeCreatorFiles = walkSourceFiles(join(SRC_ROOT, 'store')).filter((file) => {
      const source = readFileSync(file, 'utf8');
      return (
        /from\s*['"]zustand['"]/.test(source) &&
        /\bcreate(?:Store|WithEqualityFn)?\s*[<(]/.test(source)
      );
    });
    const unscannedCreators = storeCreatorFiles
      .map((file) => file.slice(join(SRC_ROOT, 'store').length + 1))
      .filter((file) => !discoveredFiles.has(file));
    expect(
      storeCreatorFiles.length,
      'creator census should match the repository store surface'
    ).toBeGreaterThan(40);
    expect(
      unscannedCreators,
      `Zustand creator files missing from the AST inventory:\\n${unscannedCreators.join('\\n')}`
    ).toEqual([]);

    const unexplained = actions
      .filter((entry) => !entry.guarded)
      .filter((entry) => !unguardedActionReason(entry.file, entry.action))
      .map((entry) => `${entry.file}:${entry.line} ${entry.action} (no guard or exception reason)`)
      .sort();
    expect(
      unexplained,
      `Mutating store actions need a direct RBAC guard or an exact, reasoned exception:\n${unexplained.join('\n')}`
    ).toEqual([]);

    const pinnedInventory = actions
      .map((entry) => {
        const disposition = entry.guarded
          ? 'GUARDED'
          : `EXCEPTION: ${unguardedActionReason(entry.file, entry.action)}`;
        return `${entry.file}.${entry.action} — ${disposition}`;
      })
      .sort();
    expect(pinnedInventory).toMatchSnapshot('store mutator authorization inventory');

    const unusedExceptions = UNGUARDED_ACTION_EXCEPTIONS.flatMap((entry) =>
      entry.actions
        .filter(
          (action) =>
            !actions.some(
              (candidate) =>
                !candidate.guarded &&
                candidate.action === action &&
                (entry.file === '*' || candidate.file === entry.file)
            )
        )
        .map((action) => `${entry.file}.${action} (no unguarded AST action found)`)
    );
    expect(
      unusedExceptions,
      `Remove stale unguarded-action exceptions or update the AST census:\n${unusedExceptions.join('\n')}`
    ).toEqual([]);

    const exceptionKeys = UNGUARDED_ACTION_EXCEPTIONS.flatMap((entry) =>
      entry.actions.map((action) => `${entry.file}.${action}`)
    );
    const duplicateExceptions = [...new Set(exceptionKeys)].filter(
      (key) => exceptionKeys.filter((candidate) => candidate === key).length > 1
    );
    expect(duplicateExceptions, 'Each unguarded action should have one review reason').toEqual([]);
    const emptyReasons = UNGUARDED_ACTION_EXCEPTIONS.filter(
      (entry) => entry.reason.trim().length < 30
    ).map((entry) => entry.file);
    expect(emptyReasons, 'Every unguarded-action exception needs a substantive reason').toEqual([]);
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
