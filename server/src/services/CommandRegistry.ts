import type { CommandEnvelope, CommandResult } from '../types/commandEnvelope.js';

/**
 * In-memory command registry (F-04 spike).
 *
 * Proves idempotency and base-revision semantics without a production store.
 * Production would persist the outbox and revision state transactionally with
 * audit evidence; this registry is intentionally ephemeral and never a
 * production readiness claim.
 */
export class CommandRegistry {
  private static instance: CommandRegistry | null = null;

  private readonly idempotentResults = new Map<string, CommandResult>();
  private readonly correlationResults = new Map<string, CommandResult>();
  private readonly revisions = new Map<string, string>();
  private revisionCounter = 0;

  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /** Test hook: clears all registry state. */
  resetForTests(): void {
    this.idempotentResults.clear();
    this.correlationResults.clear();
    this.revisions.clear();
    this.revisionCounter = 0;
  }

  getRevision(entityId: string): string | null {
    return this.revisions.get(entityId) ?? null;
  }

  findIdempotent(idempotencyKey: string): CommandResult | undefined {
    return this.idempotentResults.get(idempotencyKey);
  }

  findByCorrelationId(correlationId: string): CommandResult | undefined {
    return this.correlationResults.get(correlationId);
  }

  recordIdempotent(idempotencyKey: string, result: CommandResult): void {
    this.idempotentResults.set(idempotencyKey, result);
    if (result.correlationId) {
      this.correlationResults.set(result.correlationId, result);
    }
  }

  /**
   * Applies the command when the base revision matches the current revision.
   * Returns null on conflict; otherwise returns the new revision.
   */
  apply(envelope: CommandEnvelope): string | null {
    const current = this.revisions.get(envelope.scope.entityId) ?? null;
    if (envelope.baseRevision !== null && envelope.baseRevision !== current) {
      return null;
    }
    this.revisionCounter += 1;
    const revision = `r${this.revisionCounter}`;
    this.revisions.set(envelope.scope.entityId, revision);
    return revision;
  }
}
