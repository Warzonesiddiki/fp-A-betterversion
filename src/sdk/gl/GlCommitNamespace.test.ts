import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api-integration/types';
import { FpaClient } from '../FpaClient';
import type { ApiResponse, ApiRequestConfig } from '@/services/api-integration/types';

function makeClient(): {
  client: FpaClient;
  request: ReturnType<typeof vi.fn>;
} {
  const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });

  const request = vi.fn() as any;
  client.request = request as unknown as FpaClient['request'];
  return { client, request };
}

const okResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
});

const conflictError = (code: string, serverVersion?: number) =>
  new ApiError('conflict', 409, 'Conflict', {
    error: {
      code,
      message: 'stale revision',
      ...(serverVersion !== undefined ? { details: { serverVersion } } : {}),
    },
  });

describe('GlCommitNamespace.createJournalBatch', () => {
  it('happy path: POSTs to /api/gl/bulk with Idempotency-Key and returns committed entries', async () => {
    const { client, request } = makeClient();
    const committed = [
      { id: 'srv-1', version: 1 },
      { id: 'srv-2', version: 1 },
    ];
    request.mockResolvedValueOnce(okResponse(committed));

    const result = await client.gl.createJournalBatch({
      idempotencyKey: 'idem-123',
      batch: {
        environmentId: 'dev',
        journalId: 'j-1',
        lines: [
          { accountId: 'acc-1', postDate: '2026-01-31', debit: 100, credit: 0 },
          { accountId: 'acc-2', postDate: '2026-01-31', debit: 0, credit: 100 },
        ],
      },
    });

    expect(result).toEqual({ status: 'committed', value: committed });
    expect(request).toHaveBeenCalledTimes(1);
    const config = request.mock.calls[0]![0] as ApiRequestConfig;
    expect(config.method).toBe('POST');
    expect(config.url).toBe('/api/gl/bulk');
    expect(config.headers).toEqual({ 'Idempotency-Key': 'idem-123' });
    const body = config.data as { environment_id: string; lines: unknown[] };
    expect(body.environment_id).toBe('dev');
    expect(body.lines).toHaveLength(2);
  });

  it('maps a 409 FP-0401 duplicate-idempotency response to a typed conflict', async () => {
    const { client, request } = makeClient();
    request.mockRejectedValueOnce(conflictError('FP-0401'));

    const result = await client.gl.createJournalBatch({
      idempotencyKey: 'idem-dup',
      batch: { environmentId: 'dev', lines: [] },
    });

    expect(result.status).toBe('conflict');
    if (result.status === 'conflict') {
      expect(result.conflict.code).toBe('FP-0401');
    }
  });
});

describe('GlCommitNamespace.updateEntry', () => {
  it('happy path: PUTs with If-Match version header', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValueOnce(okResponse({ id: 'e-1', version: 2 }));

    const result = await client.gl.updateEntry({
      entryId: 'e-1',
      expectedVersion: 1,
      environmentId: 'dev',
      patch: { description: 'updated' },
    });

    expect(result).toEqual({ status: 'committed', value: { id: 'e-1', version: 2 } });
    const config = request.mock.calls[0]![0] as ApiRequestConfig;
    expect(config.method).toBe('PUT');
    expect(config.url).toBe('/api/gl/e-1');
    expect(config.headers).toEqual({ 'If-Match': '1' });
  });

  it('stale version yields typed FP-0400 conflict carrying serverVersion for rebase', async () => {
    const { client, request } = makeClient();
    request.mockRejectedValueOnce(conflictError('FP-0400', 7));

    const result = await client.gl.updateEntry({
      entryId: 'e-1',
      expectedVersion: 3,
      environmentId: 'dev',
      patch: {},
    });

    expect(result.status).toBe('conflict');
    if (result.status === 'conflict') {
      expect(result.conflict.code).toBe('FP-0400');
      expect(result.conflict.serverVersion).toBe(7);
    }
  });

  it('non-conflict errors surface as generic error', async () => {
    const { client, request } = makeClient();
    request.mockRejectedValueOnce(new ApiError('boom', 500, 'ISE'));

    const result = await client.gl.updateEntry({
      entryId: 'e-1',
      expectedVersion: 1,
      environmentId: 'dev',
      patch: {},
    });

    expect(result.status).toBe('error');
  });
});

describe('GlCommitNamespace.deleteEntry', () => {
  it('happy path: DELETEs scoped by environment', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValueOnce(okResponse(undefined));

    const result = await client.gl.deleteEntry({ entryId: 'e-9', environmentId: 'prod' });

    expect(result.status).toBe('committed');
    const config = request.mock.calls[0]![0] as ApiRequestConfig;
    expect(config.method).toBe('DELETE');
    expect(config.url).toBe('/api/gl/e-9');
    expect(config.params).toEqual({ environment_id: 'prod' });
  });

  it('404 maps to already_deleted (K25 tombstone semantics)', async () => {
    const { client, request } = makeClient();
    request.mockRejectedValueOnce(new ApiError('gone', 404, 'Not Found'));

    const result = await client.gl.deleteEntry({ entryId: 'e-9', environmentId: 'dev' });

    expect(result).toEqual({ status: 'already_deleted' });
  });
});

describe('parseGlConflict robustness', () => {
  it('returns null for non-server payloads (HTML page, wrong codes)', async () => {
    const { parseGlConflict } = await import('./conflict');
    expect(parseGlConflict('<html>oops</html>')).toBeNull();
    expect(parseGlConflict({ error: { code: 'FP-0001', message: 'validation' } })).toBeNull();
    expect(parseGlConflict({ error: null })).toBeNull();
    expect(parseGlConflict(null)).toBeNull();
  });

  it('conflict without serverVersion omits the field', async () => {
    const { parseGlConflict } = await import('./conflict');
    const parsed = parseGlConflict({
      error: { code: 'FP-0410', message: 'bad transition', details: { table: 'gl_entries' } },
    });
    expect(parsed?.code).toBe('FP-0410');
    expect(parsed?.serverVersion).toBeUndefined();
  });

  it('client conflict-code list matches the server registry ids', async () => {
    // Reads the server source text — no cross-bundle import needed.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../server/src/types/errorCodes.ts'),
      'utf8'
    );
    const { GL_CONFLICT_CODES } = await import('./conflict');
    const registered = [...src.matchAll(/'(FP-\d{4})'/g)].map((m) => m[1]);
    for (const code of GL_CONFLICT_CODES) {
      expect(src).toContain(`category: 'conflict'`);
      expect(registered).toContain(code);
    }
  });
});

describe('GlCommitNamespace.listEntries', () => {
  // Mirrors what GET /api/gl/entries actually returns: `SELECT ge.*` snake_case
  // columns plus the accounts LEFT JOIN aliases (server/src/routes/gl.ts).
  const listedRow = {
    id: 'uuid-1',
    version: 3,
    tenant_id: 'default',
    environment_id: 'dev',
    account_id: 'acc-1',
    account_code: '1000',
    post_date: '2026-01-31',
    amount: 250,
    debit: 250,
    credit: 0,
    description: 'from server',
    reference: 'REF-9',
  };

  it('GETs /api/gl/entries scoped by environment_id and maps snake_case rows', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValueOnce(
      okResponse({ data: [listedRow], total: 1, limit: 50, offset: 0 })
    );

    const result = await client.gl.listEntries({ environmentId: 'dev' });

    expect(result.status).toBe('listed');
    if (result.status === 'listed') {
      expect(result.entries).toEqual([
        {
          id: 'uuid-1',
          version: 3,
          accountId: 'acc-1',
          accountCode: '1000',
          postDate: '2026-01-31',
          debit: 250,
          credit: 0,
          description: 'from server',
          reference: 'REF-9',
        },
      ]);
    }
    const config = request.mock.calls[0]![0] as ApiRequestConfig;
    expect(config.method).toBe('GET');
    expect(config.url).toBe('/api/gl/entries');
    expect(config.params).toEqual({ environment_id: 'dev' });
  });

  it('surfaces version as undefined when the handler does not select it', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValueOnce(okResponse({ data: [{ ...listedRow, version: undefined }] }));

    const result = await client.gl.listEntries({ environmentId: 'dev' });

    expect(result.status).toBe('listed');
    if (result.status === 'listed') {
      expect(result.entries[0]?.id).toBe('uuid-1');
      expect(result.entries[0]?.version).toBeUndefined();
    }
  });

  it('drops malformed rows instead of guessing identities on financial data', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValueOnce(
      okResponse({ data: [null, 'nope', { no_id: true }, { id: '', version: 1 }, listedRow] })
    );

    const result = await client.gl.listEntries({ environmentId: 'dev' });

    expect(result.status).toBe('listed');
    if (result.status === 'listed') {
      expect(result.entries.map((e) => e.id)).toEqual(['uuid-1']);
    }
  });

  it('maps transport failure to a typed error instead of throwing past the namespace', async () => {
    const { client, request } = makeClient();
    request.mockRejectedValueOnce(new ApiError('boom', 500, 'ISE'));

    const result = await client.gl.listEntries({ environmentId: 'dev' });

    expect(result.status).toBe('error');
  });
});
