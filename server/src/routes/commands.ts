import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { commandEnvelopeSchema, type CommandResult } from '../types/commandEnvelope.js';
import { CommandRegistry } from '../services/CommandRegistry.js';

const router = Router();
router.use(authMiddleware);

/**
 * Entity-scope authorization for commands.
 *
 * Mirrors requireEntityAccess semantics without coupling the middleware to the
 * envelope body shape: global Admin bypasses; otherwise the user needs an
 * explicit user_entity_access row for the entity or a matching global
 * entity_id. The trusted server identity (JWT), never the client payload,
 * determines actor and scope.
 *
 * Queries are written as single-column equality lookups with the entity
 * comparison in JS so the semantics are identical on real SQLite and the
 * sandbox mock database.
 */
function entityAccessForUser(userId: string, role: string | undefined, entityId: string): boolean {
  if (role === 'Admin') return true;

  const accessRows = db
    .prepare('SELECT entity_id FROM user_entity_access WHERE user_id = ?')
    .all(userId) as ({ entity_id: string } & Record<number, string>)[];
  if (accessRows.some((row) => (row.entity_id ?? row[1]) === entityId)) return true;

  const user = db.prepare('SELECT entity_id FROM users WHERE id = ?').get(userId) as
    | { entity_id: string | null }
    | undefined;
  return user?.entity_id === entityId;
}

function audit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  details?: Record<string, unknown>
): void {
  db.prepare(
    `INSERT INTO audit_trail (id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(uuidv4(), action, entityType, entityId, userId, JSON.stringify(details ?? {}));
}

/**
 * POST /api/v1/commands — authoritative command boundary (F-04 spike).
 *
 * Outcomes (typed CommandResult):
 *   - 202 completed  — validated, authorized, applied (new revision)
 *   - 200 replay     — idempotent replay of an already-processed key
 *   - 409 conflict   — base revision mismatch
 *   - 403 rejected   — entity scope not permitted for the actor
 *   - 400 rejected   — envelope validation failure
 */
router.post('/commands', (req: Request, res: Response) => {
  const parsed = commandEnvelopeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: 'rejected',
      commandId: null,
      correlationId: null,
      revision: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid command envelope',
        details: parsed.error.flatten(),
      },
    } satisfies CommandResult);
    return;
  }

  const envelope = parsed.data;
  const userId = req.user!.id;
  const registry = CommandRegistry.getInstance();

  // Trusted server identity determines scope permission — never client claims.
  if (!entityAccessForUser(userId, req.user!.role, envelope.scope.entityId)) {
    res.status(403).json({
      status: 'rejected',
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      revision: null,
      error: {
        code: 'FORBIDDEN_ENTITY',
        message: `Actor has no access to entity scope '${envelope.scope.entityId}'`,
      },
    } satisfies CommandResult);
    return;
  }

  // Idempotent replay: same idempotency key returns the stored outcome.
  const existing = registry.findIdempotent(envelope.idempotencyKey);
  if (existing) {
    res.status(200).json(existing);
    return;
  }

  // Base-revision concurrency check.
  const currentRevision = registry.getRevision(envelope.scope.entityId);
  if (envelope.baseRevision !== null && currentRevision !== envelope.baseRevision) {
    const conflict: CommandResult = {
      status: 'conflict',
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      revision: currentRevision,
      error: {
        code: 'CONFLICT_REVISION',
        message: `Base revision '${envelope.baseRevision}' does not match current revision '${
          currentRevision ?? 'none'
        }'`,
      },
    };
    registry.recordIdempotent(envelope.idempotencyKey, conflict);
    res.status(409).json(conflict);
    return;
  }

  const revision = registry.apply(envelope);
  if (revision === null) {
    // Defensive: cannot happen after the check above.
    res.status(409).json({
      status: 'conflict',
      commandId: envelope.commandId,
      correlationId: envelope.correlationId,
      revision: currentRevision,
      error: { code: 'CONFLICT_REVISION', message: 'Base revision mismatch' },
    } satisfies CommandResult);
    return;
  }

  audit('command', 'command', envelope.commandId, userId, {
    commandId: envelope.commandId,
    commandType: envelope.commandType,
    entityId: envelope.scope.entityId,
    revision,
    correlationId: envelope.correlationId,
    idempotencyKey: envelope.idempotencyKey,
  });

  const result: CommandResult & { auditRecorded: boolean } = {
    status: 'completed',
    commandId: envelope.commandId,
    correlationId: envelope.correlationId,
    revision,
    auditRecorded: true,
  };
  registry.recordIdempotent(envelope.idempotencyKey, result);
  res.status(202).json(result);
});

/**
 * GET /api/v1/commands/:correlationId — query side of the spike contract.
 * Returns the stored outcome for a correlation id (404 NOT_FOUND when the
 * spike registry has no record).
 */
router.get('/commands/:correlationId', (req: Request, res: Response) => {
  const correlationId = String(req.params.correlationId ?? '');
  const result = CommandRegistry.getInstance().findByCorrelationId(correlationId);
  if (!result) {
    res.status(404).json({
      status: 'rejected',
      commandId: null,
      correlationId,
      revision: null,
      error: { code: 'NOT_FOUND', message: 'No command record for correlation id' },
    } satisfies CommandResult);
    return;
  }
  res.json(result);
});

export default router;
