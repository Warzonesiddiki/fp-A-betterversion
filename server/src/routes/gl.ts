import { Router, Response, Request } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { db } from '../db/connection.js';
import { resolveTenantId } from '../db/tenancy.js';
import {
  assertEntityLedgerIntegrity,
  ThreeStatementGateError,
} from '../gates/threeStatementGate.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireEntityWriteAccess, filterByEntityAccess } from '../middleware/entityAuth.js';
import { AppError } from '../types/errorCodes.js';

/**
 * MONEY MIGRATION (2026-08-04, GAP-1 / F-0006): trial-balance totals are
 * currency. Per-account SQL sums are treated as imported values — each is
 * cent-rounded with declared ROUND_HALF_UP semantics — then aggregated at
 * exact decimal precision via decimal.js (the same canonical engine behind
 * `src/utils/money.ts`; the server package cannot import across the repo's
 * package boundary, so the primitive is used directly with identical
 * semantics). Raw float `+=`/`-` over currency values are gone; the
 * `balanced` tolerance threshold (0.01) is unchanged policy.
 */

const router = Router();
router.use(authMiddleware);

/**
 * Trial-balance totals over per-account SQL rows (GAP-1 / F-0006).
 *
 * Each per-account `total_debit`/`total_credit` is an imported value from
 * SQLite (IEEE-754 REAL): cent-round with declared ROUND_HALF_UP, then
 * aggregate at exact decimal precision. Exported separately so the money
 * behavior is directly unit-testable.
 */
export interface TrialBalanceTotals {
  debit: number;
  credit: number;
  difference: number;
  balanced: boolean;
}

export function computeTrialBalanceTotals(
  rows: readonly Record<string, unknown>[]
): TrialBalanceTotals {
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);
  for (const row of rows) {
    // Imported per-account sums: cent-round with declared half-up.
    const debit = new Decimal(String(Number(row.total_debit) || 0)).toDecimalPlaces(
      2,
      Decimal.ROUND_HALF_UP
    );
    const credit = new Decimal(String(Number(row.total_credit) || 0)).toDecimalPlaces(
      2,
      Decimal.ROUND_HALF_UP
    );
    totalDebit = totalDebit.plus(debit);
    totalCredit = totalCredit.plus(credit);
  }

  const difference = totalDebit.minus(totalCredit);

  return {
    debit: totalDebit.toNumber(),
    credit: totalCredit.toNumber(),
    difference: difference.toNumber(),
    // Tolerance threshold is unchanged policy (a cent-level residual after
    // exact decimal aggregation is a rounding artefact, not an imbalance).
    balanced: difference.abs().lt('0.01'),
  };
}

// --- Zod schemas ---

const CreateGLEntrySchema = z
  .object({
    account_id: z.string().uuid('account_id is required'),
    entity_id: z.string().uuid('entity_id is required'),
    post_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    amount: z.number(),
    debit: z.number().min(0),
    credit: z.number().min(0),
    description: z.string().optional(),
    reference: z.string().optional(),
    department_id: z.string().uuid().optional(),
  })
  .refine((data) => data.debit > 0 || data.credit > 0, {
    message: 'Either debit or credit must be greater than 0',
  });

const BulkGLEntrySchema = z.object({
  entries: z.array(CreateGLEntrySchema).min(1, 'At least one entry is required'),
});

const CreateAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(50),
  name: z.string().min(1, 'Account name is required').max(255),
  // H-2 red-team fix: the vocabulary MUST match the schema CHECK constraint
  // ('Revenue','COGS','OpEx','CapEx','Asset','Liability','Equity') and the
  // three-statement gate's closed set. The old enum contained a nonexistent
  // 'Expense' (raw 500 on insert) and omitted COGS/OpEx/Capex entirely,
  // making real expense accounts uncreatable through the API.
  type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'COGS', 'OpEx', 'CapEx']),
  parent_id: z.string().uuid().optional(),
  entity_id: z.string().uuid().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

const UpdateAccountSchema = CreateAccountSchema.partial();

/**
 * W0.2c (duplicate-code surfacing): the schema-level UNIQUE(accounts.code) is
 * DB-wide while the route pre-check is deliberately tenant-scoped (H-1 — a
 * tenant-scoped check avoids blocking tenants whose codes merely collide
 * cross-tenant at check time). A collision outside the caller's tenant scope,
 * or a same-tenant race between check and insert, therefore surfaces here as
 * a raw constraint throw. Detect it so it becomes a typed 409 (FP-0402)
 * instead of an untyped 500.
 */
function isUniqueConstraintViolation(err: unknown): boolean {
  if (err instanceof Error) {
    const sqliteCode = (err as Error & { code?: unknown }).code;
    if (typeof sqliteCode === 'string' && sqliteCode.startsWith('SQLITE_CONSTRAINT_UNIQUE')) {
      return true;
    }
    return /UNIQUE constraint failed/i.test(err.message);
  }
  return false;
}

/** Uniform typed 409 payload for account-code collisions (W0.2c). */
function duplicateAccountCodePayload() {
  const conflict = new AppError('FP-0402', 'Account code already exists');
  return { status: conflict.httpStatus, body: conflict.toPayload({ field: 'code' }) };
}

// --- Helpers ---

function audit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  tenantId?: string,
  details?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO audit_trail (id, tenant_id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    uuidv4(),
    tenantId ?? 'default',
    action,
    entityType,
    entityId,
    userId,
    JSON.stringify(details ?? {})
  );
}

// --- GL Entry Routes ---

// GET /entries — list GL entries with filters
router.get('/entries', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const {
      account_id,
      entity_id,
      date_from,
      date_to,
      limit = '50',
      offset = '0',
      environment_id,
    } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant scope (W0.2): a request only ever sees its own tenant's rows.
    conditions.push('ge.tenant_id = ?');
    params.push(resolveTenantId(req.user));

    // W0.8.6: tombstoned (soft-deleted) rows are retained for K25 audit but
    // never appear in listings or pagination totals.
    conditions.push('ge.deleted_at IS NULL');

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`ge.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }

    // W0.2 environment scoping (wave-3 lane R11): EXACT match when the caller
    // supplies environment_id — mirroring how writes scope it (the bulk/single
    // INSERTs leave the column to its NOT NULL DEFAULT 'dev', so a defaulted
    // row stores plain 'dev' and must satisfy ONLY a 'dev' request, never a
    // 'uat'/'prod' one; there is deliberately no DEFAULT-coalescing here).
    // Absent param stays tenant-wide across environments: tenant_id remains
    // the W0.2 security boundary (resolveTenantId), while environment_id is
    // the Dev/UAT/Prod promotion dimension — so hydration callers that do not
    // pass the param keep their current superset view instead of failing
    // closed to an empty ledger.
    if (environment_id && typeof environment_id === 'string') {
      conditions.push('ge.environment_id = ?');
      params.push(environment_id);
    }

    if (account_id && typeof account_id === 'string') {
      conditions.push('ge.account_id = ?');
      params.push(account_id);
    }
    if (entity_id && typeof entity_id === 'string') {
      conditions.push('ge.entity_id = ?');
      params.push(entity_id);
    }
    if (date_from && typeof date_from === 'string') {
      conditions.push('ge.post_date >= ?');
      params.push(date_from);
    }
    if (date_to && typeof date_to === 'string') {
      conditions.push('ge.post_date <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS count FROM gl_entries ge ${whereClause}`)
      .get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db
      .prepare(
        `SELECT ge.*, a.name AS account_name, a.code AS account_code,
              e.name AS entity_name, d.name AS department_name
       FROM gl_entries ge
       LEFT JOIN accounts a ON a.id = ge.account_id
       LEFT JOIN entities e ON e.id = ge.entity_id
       LEFT JOIN departments d ON d.id = ge.department_id
       ${whereClause}
       ORDER BY ge.post_date DESC, ge.created_at DESC
       LIMIT ? OFFSET ?`
      )
      .all(...params);

    res.json({
      data: rows,
      total: countRow?.count ?? 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error('GET /gl/entries error:', err);
    res.status(500).json({ error: 'Failed to fetch GL entries' });
  }
});

// POST /entries — create GL entry
router.post(
  '/entries',
  requireEntityWriteAccess('gl_entries', { entityIdSource: 'body' }),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateGLEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const {
        account_id,
        entity_id,
        post_date,
        amount,
        debit,
        credit,
        description,
        reference,
        department_id,
      } = parsed.data;

      // Check if fiscal period is closed (H-3: tenant-scoped)
      const closedPeriod = db
        .prepare(
          `SELECT id, name FROM fiscal_periods WHERE is_closed = 1 AND tenant_id = ? AND ? BETWEEN start_date AND end_date`
        )
        .get(resolveTenantId(req.user), post_date) as { id: string; name: string } | undefined;

      if (closedPeriod) {
        res.status(403).json({
          error: 'Period closed',
          message: `Cannot post entry to closed period: ${closedPeriod.name}`,
        });
        return;
      }

      const id = uuidv4();

      // W0.3 runtime three-statement gate: the insert and the integrity check
      // share one transaction, so a violating write rolls back entirely.
      // The gate is non-disableable — there is no flag to consult.
      const tenantId = resolveTenantId(req.user);
      db.transaction(() => {
        db.prepare(
          `INSERT INTO gl_entries (id, tenant_id, account_id, entity_id, post_date, amount, debit, credit, description, reference, department_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).run(
          id,
          tenantId,
          account_id,
          entity_id,
          post_date,
          amount,
          debit,
          credit,
          description ?? null,
          reference ?? null,
          department_id ?? null,
          req.user!.id
        );

        assertEntityLedgerIntegrity(tenantId, entity_id);
      })();

      audit('CREATE', 'gl_entry', id, req.user!.id, resolveTenantId(req.user), {
        account_id,
        entity_id,
        post_date,
        amount,
        debit,
        credit,
      });

      const entry = db.prepare('SELECT * FROM gl_entries WHERE id = ?').get(id);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof ThreeStatementGateError) {
        res.status(422).json({
          error: 'Three-statement gate violation',
          code: err.violations[0]?.errorCode,
          violations: err.toPayload(),
        });
        return;
      }
      console.error('POST /gl/entries error:', err);
      res.status(500).json({ error: 'Failed to create GL entry' });
    }
  }
);

// POST /entries/bulk — bulk insert GL entries
router.post(
  '/entries/bulk',
  requireEntityWriteAccess('gl_entries', { entityIdSource: 'body' }),
  (req: Request, res: Response) => {
    try {
      const parsed = BulkGLEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const tenantId = resolveTenantId(req.user);

      // W0.8.6 (K13/K27): idempotent journal replay. A retried commit with
      // the same Idempotency-Key returns the ORIGINAL rows (never a second
      // posting); the same key with a DIFFERENT payload is the caller's bug
      // and surfaces as FP-0401. Tombstones keep their key consumed so a
      // replay finds them instead of minting duplicates.
      const idemKey = req.header('idempotency-key')?.trim() || null;
      const idemHash =
        idemKey && parsed.success
          ? createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex')
          : null;
      if (idemKey) {
        const prior = db
          .prepare(
            'SELECT id, version, idempotency_hash FROM gl_entries WHERE tenant_id = ? AND idempotency_key = ?'
          )
          .all(tenantId, idemKey) as {
          id: string;
          version: number;
          idempotency_hash: string | null;
        }[];
        if (prior.length > 0) {
          if (prior.some((r) => r.idempotency_hash !== idemHash)) {
            res.status(409).json({
              error: 'Idempotency key conflict',
              code: 'FP-0401',
              message: 'Idempotency-Key was already used with a different payload',
            });
            return;
          }
          res.status(200).json({
            message: 'Replayed original commit for Idempotency-Key',
            ids: prior.map((r) => r.id),
            entries: prior.map((r) => ({ id: r.id, version: r.version })),
            replayed: true,
          });
          return;
        }
      }

      for (const entry of parsed.data.entries) {
        // H-3 red-team fix: another tenant's hard-close must never block
        // posting into THIS tenant's open period.
        const closedPeriod = db
          .prepare(
            `SELECT id, name FROM fiscal_periods WHERE is_closed = 1 AND tenant_id = ? AND ? BETWEEN start_date AND end_date`
          )
          .get(tenantId, entry.post_date) as { id: string; name: string } | undefined;

        if (closedPeriod) {
          res.status(403).json({
            error: 'Period closed',
            message: `Cannot post entry to closed period: ${closedPeriod.name}`,
          });
          return;
        }
      }

      const insertStmt = db.prepare(
        `INSERT INTO gl_entries (id, tenant_id, account_id, entity_id, post_date, amount, debit, credit, description, reference, department_id, created_by, journal_id, idempotency_key, idempotency_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      );

      const ids: string[] = [];
      const entriesOut: { id: string; version: number }[] = [];
      const entityIds = new Set(parsed.data.entries.map((e) => e.entity_id));
      const insertMany = db.transaction((entries: z.infer<typeof BulkGLEntrySchema>['entries']) => {
        for (const entry of entries) {
          const id = uuidv4();
          ids.push(id);
          entriesOut.push({ id, version: 1 });
          insertStmt.run(
            id,
            tenantId,
            entry.account_id,
            entry.entity_id,
            entry.post_date,
            entry.amount,
            entry.debit,
            entry.credit,
            entry.description ?? null,
            entry.reference ?? null,
            entry.department_id ?? null,
            req.user!.id,
            (entry as { journal_id?: string }).journal_id ?? null,
            idemKey,
            idemHash
          );
        }

        // W0.3 runtime three-statement gate (non-disableable): every touched
        // entity's ledger must still satisfy A = L + E (+ open-period NI),
        // checked INSIDE the transaction so a violation rolls the batch back.
        for (const entityId of entityIds) {
          assertEntityLedgerIntegrity(tenantId, entityId);
        }
      });

      insertMany(parsed.data.entries);

      audit('BULK_CREATE', 'gl_entry', ids.join(','), req.user!.id, resolveTenantId(req.user), {
        count: ids.length,
      });

      res.status(201).json({
        message: `Created ${ids.length} entries`,
        ids,
        entries: entriesOut,
        replayed: false,
      });
    } catch (err) {
      if (err instanceof ThreeStatementGateError) {
        res.status(422).json({
          error: 'Three-statement gate violation',
          code: err.violations[0]?.errorCode,
          violations: err.toPayload(),
        });
        return;
      }
      console.error('POST /gl/entries/bulk error:', err);
      res.status(500).json({ error: 'Failed to bulk create GL entries' });
    }
  }
);

// DELETE /entries/:id — soft-delete (tombstone) a GL entry
router.delete(
  '/entries/:id',
  requireEntityWriteAccess('gl_entries'),
  (req: Request, res: Response) => {
    try {
      const tenantId = resolveTenantId(req.user);
      // W0.8.6: deleted_at IS NULL in the pre-check means re-deleting an
      // already-tombstoned row is a clean 404 instead of re-running the
      // gate and re-emitting audit noise (budgets.ts precedent).
      const existing = db
        .prepare(
          'SELECT id, entity_id FROM gl_entries WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL'
        )
        .get(String(req.params.id), tenantId) as { id: string; entity_id: string } | undefined;

      if (!existing) {
        res.status(404).json({ error: 'GL entry not found' });
        return;
      }

      // W0.3-fix (HIGH) + W0.8.6: the tombstone and the integrity check
      // share one transaction. The UPDATE must precede the gate call so the
      // removed leg stops counting BEFORE Assets=L+E is evaluated — the
      // inverse order would reject every legal soft delete with FP-0300.
      // K25: rows are retained (deleted_at), never physically erased; SOX
      // 7-year retention is declared policy.
      db.transaction(() => {
        db.prepare(
          "UPDATE gl_entries SET deleted_at = datetime('now'), version = version + 1 WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL"
        ).run(String(req.params.id), tenantId);

        assertEntityLedgerIntegrity(tenantId, existing.entity_id);
      })();

      audit('DELETE', 'gl_entry', String(req.params.id), req.user!.id, tenantId);

      res.status(204).send();
    } catch (err) {
      if (err instanceof ThreeStatementGateError) {
        res.status(422).json({
          error: 'Three-statement gate violation',
          code: err.violations[0]?.errorCode,
          violations: err.toPayload(),
        });
        return;
      }
      console.error('DELETE /gl/entries/:id error:', err);
      res.status(500).json({ error: 'Failed to delete GL entry' });
    }
  }
);

// --- Chart of Accounts Routes ---

// GET /accounts — list chart of accounts, optional entity_id filter, hierarchical
router.get('/accounts', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;
    // H-1 red-team fix: the chart of accounts is tenant data. Without this
    // predicate any authenticated user could enumerate every tenant's COA.
    const conditions: string[] = ['a.tenant_id = ?'];
    const params: unknown[] = [resolveTenantId(req.user)];

    // W0.2c fix (empty-entityFilter fallthrough): visibility comes from the
    // JWT-resolved permission set attached by filterByEntityAccess — never
    // from trusting the query param alone. null filter = global Admin (whole
    // tenant); [] = no permitted entities → empty COA; populated → intersect.
    // Accounts without an entity binding follow requireEntityAccess's
    // documented fallback (unbound resource stays readable within tenant).
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(
        `(a.entity_id IS NULL OR a.entity_id IN (${entityFilter.map(() => '?').join(', ')}))`
      );
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json([]);
      return;
    }

    // The query param may only NARROW the permitted scope; it can never widen it.
    if (entity_id && typeof entity_id === 'string') {
      conditions.push('a.entity_id = ?');
      params.push(entity_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db
      .prepare(
        `SELECT a.*, pa.code AS parent_code, pa.name AS parent_name
       FROM accounts a
       LEFT JOIN accounts pa ON pa.id = a.parent_id
       ${whereClause}
       ORDER BY a.code`
      )
      .all(...params) as (Record<string, unknown> & { id: string; children: AccountTreeRow[] })[];

    type AccountTreeRow = Record<string, unknown> & { id: string; children: AccountTreeRow[] };

    // Build hierarchical tree
    const accountMap = new Map<string, AccountTreeRow>();
    const roots: AccountTreeRow[] = [];

    for (const row of rows) {
      const acct: AccountTreeRow = { ...row, children: [] };
      accountMap.set(acct.id, acct);
    }

    for (const acct of accountMap.values()) {
      const parentId = acct.parent_id as string | null;
      if (parentId && accountMap.has(parentId)) {
        accountMap.get(parentId)!.children.push(acct);
      } else {
        roots.push(acct);
      }
    }

    res.json(roots);
  } catch (err) {
    console.error('GET /gl/accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /accounts — create account
router.post('/accounts', (req: Request, res: Response) => {
  try {
    const parsed = CreateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // W0.2c leftover fix: creating a COA account is structural, so gate it
    // exactly like PUT /accounts/:id (previously any authenticated user
    // could mint accounts in any permitted entity).
    if (req.user!.role !== 'Admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { code, name, type, parent_id, entity_id, description, is_active } = parsed.data;
    const tenantId = resolveTenantId(req.user);

    // H-1 red-team fix: duplicate-code check scoped per tenant. The old
    // global check let tenant A's code block tenant B (existence oracle).
    // W0.2c: the collision response is a typed 409 (FP-0402), aligned with
    // the schema/gate expectation of tenant-wide account-code uniqueness.
    const duplicate = db
      .prepare('SELECT id FROM accounts WHERE code = ? AND tenant_id = ?')
      .get(code, tenantId);

    if (duplicate) {
      const conflict = duplicateAccountCodePayload();
      res.status(conflict.status).json(conflict.body);
      return;
    }

    const id = uuidv4();

    db.prepare(
      `INSERT INTO accounts (id, tenant_id, code, name, type, parent_id, entity_id, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      tenantId,
      code,
      name,
      type,
      parent_id ?? null,
      entity_id ?? null,
      description ?? null,
      (is_active ?? true) ? 1 : 0
    );

    audit('CREATE', 'account', id, req.user!.id, resolveTenantId(req.user), { code, name, type });

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    res.status(201).json(account);
  } catch (err) {
    if (isUniqueConstraintViolation(err)) {
      const conflict = duplicateAccountCodePayload();
      res.status(conflict.status).json(conflict.body);
      return;
    }
    console.error('POST /gl/accounts error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT /accounts/:id — update account
router.put('/accounts/:id', (req: Request, res: Response) => {
  try {
    const parsed = UpdateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // H-1 red-team fix: account mutation is tenant-scoped AND admin-gated.
    // Previously ANY authenticated user could rename/retype/deactivate ANY
    // tenant's accounts; retyping flips gate identity sides retroactively.
    if (req.user!.role !== 'Admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const tenantId = resolveTenantId(req.user);
    const existing = db
      .prepare('SELECT id FROM accounts WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), tenantId);

    if (!existing) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // W0.2c fix (entity binding immutable post-create): an update may never
    // re-bind an account to another entity — that would move realized
    // financial rows across entity boundaries retroactively and silently
    // flip which entity-scoped users can see them. Rebinding requires an
    // explicit migration path (admin + tenancy validation) which does not
    // exist yet, so any attempt is rejected with a typed conflict.
    if (parsed.data.entity_id !== undefined) {
      const conflict = new AppError('FP-0410', 'Entity binding is immutable after creation');
      res.status(conflict.httpStatus).json(conflict.toPayload({ field: 'entity_id' }));
      return;
    }

    // Check unique code if code is being changed (tenant-scoped; typed 409
    // per W0.2c alignment with tenant-wide uniqueness).
    if (parsed.data.code) {
      const duplicate = db
        .prepare('SELECT id FROM accounts WHERE code = ? AND tenant_id = ? AND id != ?')
        .get(parsed.data.code, tenantId, String(req.params.id));

      if (duplicate) {
        const conflict = duplicateAccountCodePayload();
        res.status(conflict.status).json(conflict.body);
        return;
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(String(req.params.id));
    values.push(tenantId);

    db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`).run(
      ...values
    );

    audit(
      'UPDATE',
      'account',
      String(req.params.id),
      req.user!.id,
      resolveTenantId(req.user),
      parsed.data
    );

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(String(req.params.id));
    res.json(account);
  } catch (err) {
    if (isUniqueConstraintViolation(err)) {
      const conflict = duplicateAccountCodePayload();
      res.status(conflict.status).json(conflict.body);
      return;
    }
    console.error('PUT /gl/accounts/:id error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// GET /trial-balance — compute trial balance
router.get('/trial-balance', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { entity_id, date_from, date_to } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant scope (W0.2): the aggregate joins gl_entries — constrain the
    // fact side even when no other filter is present.
    conditions.push('ge.tenant_id = ?');
    params.push(resolveTenantId(req.user));

    // W0.8.6: tombstones are retained but never contribute to balances.
    // This stays in the ON-clause (joinCondition), preserving LEFT-JOIN
    // semantics for accounts whose only entries are deleted.
    conditions.push('ge.deleted_at IS NULL');

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`ge.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      // Contract consistency: the no-visible-entities branch returns the same
      // totals shape as the populated path (previously `debits/credits/balance`
      // vs `debit/credit/difference/balanced` — flagged in GAP_LEDGER 2026-08-04).
      res.json({ accounts: [], totals: computeTrialBalanceTotals([]) });
      return;
    }

    if (entity_id && typeof entity_id === 'string') {
      conditions.push('ge.entity_id = ?');
      params.push(entity_id);
    }
    if (date_from && typeof date_from === 'string') {
      conditions.push('ge.post_date >= ?');
      params.push(date_from);
    }
    if (date_to && typeof date_to === 'string') {
      conditions.push('ge.post_date <= ?');
      params.push(date_to);
    }

    const joinCondition = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const rows = db
      .prepare(
        `SELECT
         a.id AS account_id,
         a.code AS account_code,
         a.name AS account_name,
         a.type AS account_type,
         COALESCE(SUM(ge.debit), 0) AS total_debit,
         COALESCE(SUM(ge.credit), 0) AS total_credit,
         COALESCE(SUM(ge.debit), 0) - COALESCE(SUM(ge.credit), 0) AS balance
       FROM accounts a
       LEFT JOIN gl_entries ge ON ge.account_id = a.id ${joinCondition}
       GROUP BY a.id, a.code, a.name, a.type
       ORDER BY a.code`
      )
      .all(...params) as Record<string, unknown>[];

    res.json({
      accounts: rows,
      totals: computeTrialBalanceTotals(rows),
    });
  } catch (err) {
    console.error('GET /gl/trial-balance error:', err);
    res.status(500).json({ error: 'Failed to compute trial balance' });
  }
});

export default router;
