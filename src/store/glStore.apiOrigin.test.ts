/**
 * W6-P0-13 api-origin-truth — glStore instantiation-site wiring spec.
 *
 * Pins the DEFAULT server-commit channel built at `glStore.ts` (~line 79):
 *  - REST origin comes from `import.meta.env.VITE_API_URL` (dev proxy serves
 *    same-origin `/api` → Express :3001) — never a hardcoded fictional host.
 *  - The bearer credential is pulled LAZILY from authStore state through a
 *    getState() accessor at request time, so a login that happens after store
 *    creation still produces authenticated requests.
 *  - With no session token, commits fail closed: drafts are marked `failed`
 *    and nothing is delegated to the transport.
 *
 * RestApiClient is replaced with a recording fake (see apiOrigin.test.ts);
 * this file proves the STORE wiring, not axios.
 *
 * @module store/glStore.apiOrigin.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  constructed: [] as { baseUrl: string }[],
  requests: [] as {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    params?: unknown;
    data?: unknown;
  }[],
  /** Committed rows echoed back to the namespace, in request order. */
  committedRows: [] as { id: string; version: number }[],
}));

vi.mock('../services/api-integration/RestApiClient', () => ({
  RestApiClient: class {
    public constructor(baseUrl: string) {
      h.constructed.push({ baseUrl });
    }
    public request<T>(config: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      params?: unknown;
      data?: unknown;
    }): Promise<{ data: T; status: number; statusText: string; headers: Record<string, string> }> {
      h.requests.push(config);
      return Promise.resolve({
        data: h.committedRows as T,
        status: 200,
        statusText: 'OK',
        headers: {},
      });
    }
    public setOAuthTokens(): void {
      /* unused */
    }
  },
}));

import { actAs } from '@/test/rbacFixtures';
import { useAuthStore } from './authStore';

function seedStore(): void {
  actAs('Admin');
  useAuthStore.setState({ accessToken: null, isAuthenticated: false });
}

function makeEntry(
  id: string,
  overrides: Partial<{ debit: number; credit: number; netChange: number; amount: number }> = {}
) {
  return {
    id,
    accountId: `acc-${id}`,
    accountCode: `1000-${id}`,
    accountName: `Account ${id}`,
    period: '2026-01',
    periodName: '2026-01',
    date: '2026-01-31',
    postDate: '2026-01-31',
    debit: 100,
    credit: 0,
    netChange: 100,
    amount: 100,
    description: '',
    reference: '',
    ...overrides,
  };
}

/** Balanced journal pair — the store rejects imbalanced batches pre-flight. */
function balancedBatch(prefix: string) {
  return [
    makeEntry(`${prefix}-d`),
    makeEntry(`${prefix}-c`, { debit: 0, credit: 100, netChange: -100, amount: -100 }),
  ];
}

describe('glStore default commit channel — api-origin-truth wiring (W6-P0-13)', () => {
  beforeEach(() => {
    h.constructed.length = 0;
    h.requests.length = 0;
    h.committedRows = [];
    seedStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('routes GL publish to VITE_API_URL with a live Bearer token from authStore', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    h.committedRows = [
      { id: 'srv-1', version: 1 },
      { id: 'srv-2', version: 1 },
    ];
    // Import AFTER the env stub: the default client resolves its origin at
    // construction, which happens once when the store module loads.
    const { useGLStore } = await import('./glStore');

    useAuthStore.setState({ accessToken: 'tok-e2e', isAuthenticated: true });
    useGLStore.setState({
      entries: [],
      accounts: [],
      trialBalance: [],
      accountAnalysis: null,
      dateFilter: null,
      accountFilter: [],
      isLoading: false,
      importProgress: 0,
      importStatus: 'idle',
      importError: null,
      lastImportResult: null,
      importHistory: [],
      lastImportEntryIds: [],
      entrySyncState: {},
      entryVersions: {},
      environmentId: 'dev',
    });

    const { addEntries, commitDraftsToServer } = useGLStore.getState();
    addEntries(balancedBatch('gl-origin'));

    const summary = await commitDraftsToServer();
    expect(summary).toEqual({ committed: 2, failed: 0, conflicts: [] });

    // The publish went to the configured origin with the live credential…
    expect(h.constructed[0]?.baseUrl).toBe('http://localhost:3001');
    expect(h.requests[0]?.method).toBe('POST');
    expect(h.requests[0]?.url).toBe('/api/gl/bulk');
    expect(h.requests[0]?.headers?.Authorization).toBe('Bearer tok-e2e');
    // …and the GlCommitNamespace paths are unchanged.
    expect(String(h.requests[0]?.url)).toContain('/api/gl/');
  });

  it('fails closed without a session token: drafts marked failed, zero transport delegation', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    const { useGLStore } = await import('./glStore');

    useGLStore.setState({
      entries: [],
      accounts: [],
      trialBalance: [],
      accountAnalysis: null,
      dateFilter: null,
      accountFilter: [],
      isLoading: false,
      importProgress: 0,
      importStatus: 'idle',
      importError: null,
      lastImportResult: null,
      importHistory: [],
      lastImportEntryIds: [],
      entrySyncState: {},
      entryVersions: {},
      environmentId: 'dev',
    });

    const { addEntries, commitDraftsToServer } = useGLStore.getState();
    addEntries(balancedBatch('gl-anon'));

    const summary = await commitDraftsToServer();
    expect(summary.committed).toBe(0);
    expect(summary.failed).toBe(2);
    expect(useGLStore.getState().entrySyncState['gl-anon-d']).toBe('failed');
    expect(useGLStore.getState().entrySyncState['gl-anon-c']).toBe('failed');
    // Nothing reached the REST layer — no silent anonymous publish either.
    expect(h.requests).toHaveLength(0);
  });
});
