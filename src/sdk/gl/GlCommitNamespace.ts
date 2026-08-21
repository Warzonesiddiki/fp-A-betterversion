/**
 * Typed GL commit client methods (W0.8.6 prep, K25/K27).
 *
 * Additive namespace over `FpaClient` for the future server-authoritative
 * glStore. Nothing here mutates the store; callers receive a discriminated
 * result so drafts flip to committed only on explicit success.
 *
 * Concurrency contract (K27 — never last-write-wins on a decimal):
 * - `createJournalBatch` commits atomically under an idempotency key
 *   (retries can never double-post a journal).
 * - `updateEntry` sends `If-Match: <version>`; a stale version yields a
 *   typed 409 (`FP-0400`) with the server version to rebase onto.
 * - `deleteEntry` tombstones (server-side soft delete); 404 is surfaced as
 *   `alreadyDeleted`, not an error, per K25 retention semantics.
 *
 * @module sdk/gl/GlCommitNamespace
 */

import type { FpaClient } from '../FpaClient';
import { ApiError } from '../../services/api-integration/types';
import { parseGlConflict } from './conflict';
import type { GlConflict } from './conflict';

/** One line of an atomic journal batch (balanced debit=credit enforced server-side). */
export interface GlJournalLine {
  readonly accountId: string;
  readonly entityId?: string;
  readonly postDate: string;
  readonly debit: number;
  readonly credit: number;
  readonly description?: string;
  readonly reference?: string;
  readonly departmentId?: string;
}

export interface GlJournalBatch {
  readonly journalId?: string;
  readonly environmentId: string;
  readonly lines: readonly GlJournalLine[];
}

/** Committed entry as returned by the server (server-assigned identity). */
export interface GlCommittedEntry {
  readonly id: string;
  readonly version: number;
}

export interface CreateJournalBatchInput {
  readonly batch: GlJournalBatch;
  /** Client-generated unique key; identical retries return the first commit. */
  readonly idempotencyKey: string;
}

export interface UpdateEntryInput {
  readonly entryId: string;
  readonly patch: Partial<Pick<GlJournalLine, 'debit' | 'credit' | 'description' | 'reference'>>;
  /** Base revision captured by the caller's last read (If-Match). */
  readonly expectedVersion: number;
  readonly environmentId: string;
}

export interface DeleteEntryInput {
  readonly entryId: string;
  readonly environmentId: string;
}

/**
 * Discriminated commit outcome. `committed` carries the authoritative value;
 * `conflict` carries a parsed, typed 409; anything else is `error`.
 */
export type GlCommitResult<T> =
  | { status: 'committed'; value: T }
  | { status: 'conflict'; conflict: GlConflict }
  | { status: 'already_deleted' }
  | { status: 'error'; message: string };

const API_BASE = '/api/gl';

function errorStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : undefined;
}

function errorData(err: unknown): unknown {
  return err instanceof ApiError ? err.data : undefined;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function conflictFrom(err: unknown): GlConflict | null {
  if (errorStatus(err) !== 409) return null;
  return parseGlConflict(errorData(err));
}

export class GlCommitNamespace {
  public constructor(private readonly client: FpaClient) {}

  /**
   * Commit a balanced journal batch atomically. The whole batch lands or
   * nothing does; retries with the same `idempotencyKey` are deduplicated
   * server-side (`FP-0401` surfaces as a conflict if keys collide across
   * *different* payloads).
   */
  public async createJournalBatch(
    input: CreateJournalBatchInput
  ): Promise<GlCommitResult<readonly GlCommittedEntry[]>> {
    try {
      const response = await this.client.request<readonly GlCommittedEntry[]>({
        method: 'POST',
        url: `${API_BASE}/bulk`,
        headers: { 'Idempotency-Key': input.idempotencyKey },
        data: {
          journalId: input.batch.journalId,
          environment_id: input.batch.environmentId,
          lines: input.batch.lines.map((line) => ({
            account_id: line.accountId,
            entity_id: line.entityId,
            post_date: line.postDate,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            reference: line.reference,
            department_id: line.departmentId,
          })),
        },
      });
      return { status: 'committed', value: response.data };
    } catch (err) {
      const conflict = conflictFrom(err);
      if (conflict) return { status: 'conflict', conflict };
      return { status: 'error', message: errorMessage(err) };
    }
  }

  /** Update a committed entry with optimistic versioning (K27). */
  public async updateEntry(input: UpdateEntryInput): Promise<GlCommitResult<GlCommittedEntry>> {
    try {
      const value = await this.client
        .request<GlCommittedEntry>({
          method: 'PUT',
          url: `${API_BASE}/${encodeURIComponent(input.entryId)}`,
          headers: { 'If-Match': String(input.expectedVersion) },
          data: {
            environment_id: input.environmentId,
            ...input.patch,
          },
        })
        .then((r) => r.data);
      return { status: 'committed', value };
    } catch (err) {
      const conflict = conflictFrom(err);
      if (conflict) return { status: 'conflict', conflict };
      return { status: 'error', message: errorMessage(err) };
    }
  }

  /** Tombstone a committed entry (K25: retention beats erasure). */
  public async deleteEntry(input: DeleteEntryInput): Promise<GlCommitResult<void>> {
    try {
      await this.client.request<void>({
        method: 'DELETE',
        url: `${API_BASE}/${encodeURIComponent(input.entryId)}`,
        params: { environment_id: input.environmentId },
      });
      return { status: 'committed', value: undefined };
    } catch (err) {
      if (errorStatus(err) === 404) return { status: 'already_deleted' };
      const conflict = conflictFrom(err);
      if (conflict) return { status: 'conflict', conflict };
      return { status: 'error', message: errorMessage(err) };
    }
  }
}
