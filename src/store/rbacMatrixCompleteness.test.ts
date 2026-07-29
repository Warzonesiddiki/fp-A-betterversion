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
import { join, extname } from 'node:path';
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
