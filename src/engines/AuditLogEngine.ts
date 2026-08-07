// Audit Log Engine - Comprehensive audit logging
// Pure TypeScript, no external dependencies

import { randomId } from '@/utils/cryptoId';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'view'
  | 'comment';

export interface ChainHashEntry {
  prevHash: string;
  entryHash: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class AuditLogEngine {
  private entries: AuditEntry[] = [];
  private maxEntries: number;
  private retentionDays: number;

  constructor(config?: { maxEntries?: number; retentionDays?: number }) {
    this.maxEntries = config?.maxEntries ?? 100000;
    this.retentionDays = config?.retentionDays ?? 2555; // 7 years for SOX
  }

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      ...entry,
      id: randomId('audit'),
      timestamp: new Date().toISOString(),
    };
    this.entries.push(auditEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    return auditEntry;
  }

  filter(filters: AuditFilter): AuditEntry[] {
    let result = [...this.entries];
    if (filters.userId) result = result.filter((e) => e.userId === filters.userId);
    if (filters.action) result = result.filter((e) => e.action === filters.action);
    if (filters.resource) result = result.filter((e) => e.resource === filters.resource);
    if (filters.resourceId) result = result.filter((e) => e.resourceId === filters.resourceId);
    if (filters.startDate) result = result.filter((e) => e.timestamp >= filters.startDate!);
    if (filters.endDate) result = result.filter((e) => e.timestamp <= filters.endDate!);
    result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (filters.limit) result = result.slice(0, filters.limit);
    return result;
  }

  getRecent(count: number): AuditEntry[] {
    return this.entries.slice(-count).reverse();
  }

  getByResource(resource: string, resourceId: string): AuditEntry[] {
    return this.entries
      .filter((e) => e.resource === resource && e.resourceId === resourceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  getByUser(userId: string, limit?: number): AuditEntry[] {
    const result = this.entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return limit ? result.slice(0, limit) : result;
  }

  getStats(): {
    total: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Record<string, number>;
  } {
    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    for (const e of this.entries) {
      byAction[e.action] = (byAction[e.action] || 0) + 1;
      byResource[e.resource] = (byResource[e.resource] || 0) + 1;
      byUser[e.userId] = (byUser[e.userId] || 0) + 1;
    }
    return { total: this.entries.length, byAction, byResource, byUser };
  }

  exportCSV(): string {
    // SECURITY (Phase 7 audit, Hephaestus PATCH 4): escape CWE-1236 formula-injection vectors (=, +, -, @, tab, CR) by prefixing single quote. RFC 4180 quote for comma/quote/newline.
    const headers = this.escapeCsvRow([
      'id',
      'timestamp',
      'userId',
      'userName',
      'action',
      'resource',
      'resourceId',
      'oldValue',
      'newValue',
      'ipAddress',
      'sessionId',
      'details',
      'metadata',
    ]);
    const rows = this.entries
      .map((e) =>
        this.escapeCsvRow([
          e.id,
          e.timestamp,
          e.userId,
          e.userName,
          e.action,
          e.resource,
          e.resourceId,
          e.oldValue == null ? null : String(e.oldValue),
          e.newValue == null ? null : String(e.newValue),
          e.ipAddress,
          e.sessionId,
          e.details,
          e.metadata ? JSON.stringify(e.metadata) : null,
        ])
      )
      .join('\n');
    return headers + '\n' + rows;
  }

  prune(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const cutoffStr = cutoff.toISOString();
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.timestamp >= cutoffStr);
    return before - this.entries.length;
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  serialize(): string {
    return JSON.stringify(this.entries);
  }

  deserialize(json: string): void {
    this.entries = JSON.parse(json);
  }

  private escapeCsvValue(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (s.length === 0) return '';
    const first = s.charAt(0);
    if (
      first === '=' ||
      first === '+' ||
      first === '-' ||
      first === '@' ||
      first === '\t' ||
      first === '\r'
    ) {
      return `'${s}`;
    }
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private escapeCsvRow(values: (string | number | boolean | null | undefined)[]): string {
    return values.map((v) => this.escapeCsvValue(v)).join(',');
  }

  private fallbackRandomHex(hexChars: number): string {
    // CSPRNG only — audit hashes/salts must never degrade to Math.random.
    const c = globalThis.crypto;
    if (!c || typeof c.getRandomValues !== 'function') {
      throw new Error('AuditLogEngine: Web Crypto unavailable — cannot generate audit hashes.');
    }
    const byteLen = Math.ceil(hexChars / 2);
    const bytes = new Uint8Array(byteLen);
    c.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, hexChars);
  }

  // ===========================================================================
  // PATCH 8 — Hephaestus, FinPlan Pro v1.0.0 (CYCLE 7)
  // Hash chain integrity (CWE-345), HMAC signing (CWE-345), async flush queue,
  // retention policy enforcement. All additions are additive — no breaking
  // changes to the existing API.
  // ===========================================================================

  /** Hash chain entry — extends AuditEntry with prevHash + entryHash. */
  private _chainedHashes: Map<string, ChainHashEntry> = new Map();
  private _lastChainHash: string = '0'.repeat(64);
  private _signingKey: CryptoKey | null = null;
  private _queue: AuditEntry[] = [];
  private _queueConfig: {
    maxBatchSize: number;
    maxBatchDelayMs: number;
    onFlush?: (entries: AuditEntry[]) => void | Promise<void>;
  } = {
    maxBatchSize: 50,
    maxBatchDelayMs: 250,
  };
  private _flushTimer: ReturnType<typeof setTimeout> | null = null;
  private _pruneTimer: ReturnType<typeof setInterval> | null = null;
  private _retention: { maxEntries: number; maxAgeDays: number; autoPruneIntervalMs: number } = {
    maxEntries: 100000,
    maxAgeDays: 2555,
    autoPruneIntervalMs: 0,
  };

  // -- PATCH 8.1: Hash chain integrity ----------------------------------------

  /**
   * Compute the canonical hash of a chained entry. The hash is over a stable
   * JSON serialization of (entry fields + prevHash), using SHA-256. Field
   * order is deterministic to ensure the chain is reproducible.
   */
  private async _hashEntry(entry: AuditEntry, prevHash: string): Promise<string> {
    const canonical = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      userId: entry.userId,
      userName: entry.userName,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      ipAddress: entry.ipAddress ?? null,
      sessionId: entry.sessionId ?? null,
      metadata: entry.metadata ?? null,
      prevHash,
    });
    const buf = new TextEncoder().encode(canonical);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** PATCH 8.1: Log a new entry AND extend the SHA-256 hash chain. */
  async logChain(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>
  ): Promise<AuditEntry & { prevHash: string; entryHash: string }> {
    const base = this.log(entry);
    const prevHash = this._lastChainHash;
    const entryHash = await this._hashEntry(base, prevHash);
    this._chainedHashes.set(base.id, { prevHash, entryHash });
    this._lastChainHash = entryHash;
    return Object.assign({}, base, { prevHash, entryHash });
  }

  /** PATCH 8.1: Walk the hash chain and confirm every entry is correctly linked. */
  async verifyIntegrity(): Promise<{
    ok: boolean;
    totalEntries: number;
    checkedAt: string;
    brokenAt?: number;
    reason?: string;
    expectedHash?: string;
    actualHash?: string;
  }> {
    if (this.entries.length === 0) {
      return {
        ok: true,
        totalEntries: 0,
        checkedAt: new Date().toISOString(),
        reason: 'EMPTY_CHAIN',
      };
    }
    let prevHash = '0'.repeat(64);
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i]!;
      const expected = this._chainedHashes.get(e.id);
      if (expected && expected.prevHash !== prevHash) {
        return {
          ok: false,
          totalEntries: this.entries.length,
          checkedAt: new Date().toISOString(),
          brokenAt: i,
          reason: 'BROKEN_PREV_HASH',
          expectedHash: prevHash,
          actualHash: expected.prevHash,
        };
      }
      const recomputed = await this._hashEntry(e, prevHash);
      if (expected && expected.entryHash !== recomputed) {
        return {
          ok: false,
          totalEntries: this.entries.length,
          checkedAt: new Date().toISOString(),
          brokenAt: i,
          reason: 'BROKEN_HASH_MISMATCH',
          expectedHash: expected.entryHash,
          actualHash: recomputed,
        };
      }
      prevHash = recomputed;
    }
    return { ok: true, totalEntries: this.entries.length, checkedAt: new Date().toISOString() };
  }

  /** Returns the current head of the hash chain, or 64-zero string if empty. */
  chainHead(): string {
    return this._lastChainHash;
  }

  // -- PATCH 8.2: HMAC signatures ---------------------------------------------

  /** PATCH 8.2: Install a CryptoKey (HMAC) used to sign entries. */
  async setSigningKey(key: CryptoKey | null): Promise<void> {
    this._signingKey = key;
  }

  /** PATCH 8.2: Produce a base64 HMAC-SHA256 signature over the canonical entry. */
  async sign(entry: AuditEntry): Promise<string | null> {
    if (!this._signingKey) return null;
    const canonical = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      userId: entry.userId,
      userName: entry.userName,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ?? null,
    });
    const buf = new TextEncoder().encode(canonical);
    const sig = await crypto.subtle.sign('HMAC', this._signingKey, buf);
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  /** PATCH 8.2: HMAC verification of a base64 signature. */
  async verifySignature(entry: AuditEntry, signature: string): Promise<boolean> {
    if (!this._signingKey) return false;
    try {
      const canonical = JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        userId: entry.userId,
        userName: entry.userName,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details ?? null,
      });
      const buf = new TextEncoder().encode(canonical);
      const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
      return await crypto.subtle.verify('HMAC', this._signingKey, sig, buf);
    } catch {
      return false;
    }
  }

  // -- PATCH 8.3: Async flush queue -------------------------------------------

  /** PATCH 8.3: Configure the async batch thresholds and sink. */
  configureAsyncQueue(config: {
    maxBatchSize?: number;
    maxBatchDelayMs?: number;
    onFlush?: (entries: AuditEntry[]) => void | Promise<void>;
  }): void {
    if (typeof config.maxBatchSize === 'number' && config.maxBatchSize > 0) {
      this._queueConfig.maxBatchSize = config.maxBatchSize;
    }
    if (typeof config.maxBatchDelayMs === 'number' && config.maxBatchDelayMs >= 0) {
      this._queueConfig.maxBatchDelayMs = config.maxBatchDelayMs;
    }
    if ('onFlush' in config) this._queueConfig.onFlush = config.onFlush;
  }

  /** PATCH 8.3: Add an entry to the async batch. */
  enqueue(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const created = this.log(entry);
    this._queue.push(created);
    if (this._queue.length >= this._queueConfig.maxBatchSize) {
      void this.flush();
    } else if (this._flushTimer === null && this._queueConfig.maxBatchDelayMs > 0) {
      this._flushTimer = setTimeout(() => {
        this._flushTimer = null;
        void this.flush();
      }, this._queueConfig.maxBatchDelayMs);
    }
    return created;
  }

  /** PATCH 8.3: Force-flush the async batch. */
  async flush(): Promise<AuditEntry[]> {
    if (this._flushTimer !== null) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
    if (this._queue.length === 0) return [];
    const batch = this._queue.slice();
    this._queue = [];
    if (this._queueConfig.onFlush) {
      try {
        await this._queueConfig.onFlush(batch);
      } catch {
        // Swallow sink errors — auditing must never throw.
      }
    }
    return batch;
  }

  /** Current size of the async batch (testing/diagnostics). */
  queueSize(): number {
    return this._queue.length;
  }

  // -- PATCH 8.4: Retention policy --------------------------------------------

  /** PATCH 8.4: Install a new retention policy and start the auto-prune timer. */
  setRetentionPolicy(policy: {
    maxEntries?: number;
    maxAgeDays?: number;
    autoPruneIntervalMs?: number;
  }): void {
    if (typeof policy.maxEntries === 'number' && policy.maxEntries > 0) {
      this._retention.maxEntries = policy.maxEntries;
      this.maxEntries = policy.maxEntries;
    }
    if (typeof policy.maxAgeDays === 'number' && policy.maxAgeDays > 0) {
      this._retention.maxAgeDays = policy.maxAgeDays;
      this.retentionDays = policy.maxAgeDays;
    }
    if (typeof policy.autoPruneIntervalMs === 'number' && policy.autoPruneIntervalMs >= 0) {
      this._retention.autoPruneIntervalMs = policy.autoPruneIntervalMs;
    }
    if (this._pruneTimer !== null) {
      clearInterval(this._pruneTimer);
      this._pruneTimer = null;
    }
    if (this._retention.autoPruneIntervalMs > 0) {
      this._pruneTimer = setInterval(() => this.autoPrune(), this._retention.autoPruneIntervalMs);
    }
    this.autoPrune();
  }

  /** Returns the current retention policy. */
  getRetentionPolicy(): { maxEntries: number; maxAgeDays: number; autoPruneIntervalMs: number } {
    return { ...this._retention };
  }

  /** PATCH 8.4: Combine maxEntries and maxAgeDays enforcement. Returns the count removed. */
  autoPrune(): number {
    const before = this.entries.length;
    const cutoffMs = Date.now() - this._retention.maxAgeDays * 86_400_000;
    const cutoffIso = new Date(cutoffMs).toISOString();
    this.entries = this.entries.filter((e) => e.timestamp >= cutoffIso);
    if (this.entries.length > this._retention.maxEntries) {
      this.entries = this.entries.slice(-this._retention.maxEntries);
    }
    return before - this.entries.length;
  }

  /** PATCH 8.4: Stop timers and clear state. Call on app teardown. */
  dispose(): void {
    if (this._flushTimer !== null) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
    if (this._pruneTimer !== null) {
      clearInterval(this._pruneTimer);
      this._pruneTimer = null;
    }
    this._queue = [];
    this._chainedHashes.clear();
    this._signingKey = null;
  }
}
