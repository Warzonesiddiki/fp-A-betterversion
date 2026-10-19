// AuditLogger — standalone in-memory hash-sequence utility (not product authority)
// FinPlan Pro v1.0.0 — historical PATCH 12 implementation; bounded by DEC-031
//
// LIMITS:
//   - This class has no production caller or persistence adapter in this repo.
//   - SHA-256 links are unkeyed and have no external anchor. Verification can
//     detect accidental or partial mutation relative to the retained head, but
//     a writer able to replace the whole snapshot can recompute every link.
//   - Export/restore are local snapshot APIs, not durable storage, delivery,
//     authenticity, non-repudiation, SOX, or SOC 2 evidence.
//   - This class does not implement the type-only AuditLogger sink interface
//     used by SecretsVault; no production adapter connects the two.
//
// DEPENDENCIES:
//   - Web Crypto API (crypto.subtle.digest for SHA-256).

export const AUDIT_LOGGER_CONSTANTS = {
  SCHEMA_VERSION: 1,
  GENESIS_PREIMAGE: 'finplan-pro-audit-log-genesis-v1',
  /** Hard cap on retained events (FIFO). Older events evicted first. */
  MAX_EVENTS: 100_000,
  /** Hard cap on a single payload size in bytes (serialized). */
  MAX_PAYLOAD_BYTES: 64 * 1024,
  /** Maximum number of events returned by query() without paging. */
  MAX_QUERY_RESULTS: 10_000,
  /** Severity levels. Aligned to NIST SP 800-61r2. */
  SEVERITY: {
    DEBUG: 'debug',
    INFO: 'info',
    NOTICE: 'notice',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
    ALERT: 'alert',
    EMERGENCY: 'emergency',
  } as const,
  /** Event categories. */
  CATEGORY: {
    AUTH: 'auth',
    AUTHORIZATION: 'authorization',
    DATA_ACCESS: 'data-access',
    DATA_MODIFICATION: 'data-modification',
    DATA_EXPORT: 'data-export',
    CONFIG_CHANGE: 'config-change',
    SECRET_ROTATION: 'secret-rotation',
    SYSTEM: 'system',
    SECURITY_INCIDENT: 'security-incident',
    COMPLIANCE: 'compliance',
    ADMIN_ACTION: 'admin-action',
    USER_ACTION: 'user-action',
    ERROR: 'error',
  } as const,
} as const;

export type AuditSeverity =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical'
  | 'alert'
  | 'emergency';

export type AuditCategory =
  | 'auth'
  | 'authorization'
  | 'data-access'
  | 'data-modification'
  | 'data-export'
  | 'config-change'
  | 'secret-rotation'
  | 'credential-management'
  | 'system'
  | 'security-incident'
  | 'compliance'
  | 'admin-action'
  | 'user-action'
  | 'error';

export interface AuditEvent {
  /** Monotonic id (string, zero-padded, per-log). */
  id: string;
  /** Epoch millis. */
  timestamp: number;
  /** Identity of the actor (user id, service, 'system'). */
  actor: string;
  /** Short event type ('user.login', 'secret.rotated', ...). */
  eventType: string;
  /** Category. */
  category: AuditCategory;
  /** Severity. */
  severity: AuditSeverity;
  /** Free-form structured payload (object, capped in size). */
  payload: Record<string, unknown>;
  /** Originating subsystem. */
  source: string;
  /** Optional correlation id linking related events. */
  correlationId: string | null;
  /** SHA-256 of the event (hex). */
  eventHash: string;
  /** Previous chain value at append time (the first value is the literal genesis marker). */
  prevChainHash: string;
  /** Per-event nonce (16 bytes hex). */
  nonce: string;
}

export interface AuditQuery {
  category?: AuditCategory;
  severity?: AuditSeverity;
  actor?: string;
  eventType?: string;
  source?: string;
  correlationId?: string;
  /** Epoch millis inclusive. */
  sinceMs?: number;
  /** Epoch millis inclusive. */
  untilMs?: number;
  /** Maximum number of results. Defaults to MAX_QUERY_RESULTS. */
  limit?: number;
  /** Offset. Defaults to 0. */
  offset?: number;
}

export interface AddEventInput {
  actor: string;
  eventType: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  payload?: Record<string, unknown>;
  source: string;
  correlationId?: string | null;
  /** Epoch millis override (defaults to Date.now()). */
  timestamp?: number;
}

export interface AuditChainVerificationResult {
  valid: boolean;
  /** Number of events inspected. */
  inspected: number;
  /** Index of the first failing event, or -1. */
  firstFailure: number;
  /** Reason for failure, or null. */
  reason: string | null;
  /** Current chain value (literal genesis marker before the first event, then a digest). */
  chainHead: string;
}

export interface AuditLoggerConfig {
  /** Source label written into every event by default. */
  source?: string;
  category?: AuditCategory;
  /** Initial predecessor marker. Defaults to the literal GENESIS_PREIMAGE string; no digest is applied. */
  genesisChainHead?: string;
  /** Maximum events to retain. Defaults to MAX_EVENTS. */
  maxEvents?: number;
}

export class AuditLoggerError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AuditLoggerError';
  }
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `n:${value}` : 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'b:true' : 'b:false';
  }
  if (typeof value === 'string') {
    // Use JSON.stringify for safe escaping of control chars.
    return `s:${JSON.stringify(value)}`;
  }
  if (Array.isArray(value)) {
    return `a:[${value.map(canonicalize).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `o:{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k]!)}`).join(',')}}`;
  }
  return 'null';
}

export class AuditLogger {
  private static instance: AuditLogger | null = null;

  private events: AuditEvent[] = [];
  private chainHead: string;
  private source: string;
  private category: AuditCategory;
  private maxEvents: number;
  private nextSequence: number = 0;
  /** Initial predecessor marker; the default is a literal constant, not a hashed genesis anchor. */
  private readonly genesisChainHead: string;

  private constructor(config: AuditLoggerConfig = {}) {
    this.source = config.source ?? 'finplan-pro';
    this.category = (config.category ?? 'security-event') as AuditCategory;
    this.maxEvents = config.maxEvents ?? AUDIT_LOGGER_CONSTANTS.MAX_EVENTS;
    this.genesisChainHead =
      config.genesisChainHead ??
      // Compute lazily — caller may override for snapshot restoration.
      AUDIT_LOGGER_CONSTANTS.GENESIS_PREIMAGE;
    this.chainHead = this.genesisChainHead;
  }

  static getInstance(config?: AuditLoggerConfig): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(config);
    }
    return AuditLogger.instance;
  }

  static resetInstance(): void {
    if (AuditLogger.instance) {
      AuditLogger.instance.events = [];
      AuditLogger.instance.chainHead = AuditLogger.instance.genesisChainHead;
      AuditLogger.instance.nextSequence = 0;
    }
    AuditLogger.instance = null;
  }

  /**
   * Initialize the chain head. Idempotent: calling twice with the same
   * preimage is a no-op. Calling with a different preimage after events
   * have been logged throws (would invalidate the chain).
   */
  async initialize(preimage: string = AUDIT_LOGGER_CONSTANTS.GENESIS_PREIMAGE): Promise<void> {
    if (this.events.length > 0 && preimage !== this.genesisChainHead) {
      throw new AuditLoggerError(
        'cannot reinitialize with different preimage after events logged',
        'CHAIN_LOCKED'
      );
    }
    if (preimage === this.genesisChainHead) {
      return;
    }
    // We permit a one-time preimage change before any events are logged,
    // to support snapshot restoration in tests.
    (this as unknown as { genesisChainHead: string }).genesisChainHead = preimage;
    this.chainHead = preimage;
  }

  /** Append an event to the log. Computes hash, updates chain head. */
  async log(input: {
    action: string;
    target: string;
    result: 'ok' | 'denied' | 'error' | 'scheduled' | 'backend-error' | 'forbidden';
    severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    const severity: AuditSeverity =
      input.severity === 'warn' ? 'warning' : (input.severity ?? 'info');
    const payload: Record<string, unknown> = {
      ...(input.metadata ?? {}),
      target: input.target,
      result: input.result,
    };
    return this.addEvent({
      actor: this.source ?? 'system',
      eventType: input.action,
      category: this.category ?? 'security-event',
      severity,
      payload,
      source: this.source ?? 'hephaestus',
    });
  }

  async addEvent(input: AddEventInput): Promise<AuditEvent> {
    if (!input || typeof input !== 'object') {
      throw new AuditLoggerError('input required', 'INVALID_INPUT');
    }
    if (typeof input.actor !== 'string' || input.actor.length === 0) {
      throw new AuditLoggerError('actor required', 'INVALID_ACTOR');
    }
    if (typeof input.eventType !== 'string' || input.eventType.length === 0) {
      throw new AuditLoggerError('eventType required', 'INVALID_EVENT_TYPE');
    }
    if (typeof input.source !== 'string' || input.source.length === 0) {
      throw new AuditLoggerError('source required', 'INVALID_SOURCE');
    }
    if (!isValidCategory(input.category)) {
      throw new AuditLoggerError(`unknown category: ${input.category}`, 'INVALID_CATEGORY');
    }
    const severity: AuditSeverity = input.severity ?? 'info';
    if (!isValidSeverity(severity)) {
      throw new AuditLoggerError(`unknown severity: ${severity}`, 'INVALID_SEVERITY');
    }
    const payload = input.payload ?? {};
    if (typeof payload !== 'object' || Array.isArray(payload)) {
      throw new AuditLoggerError('payload must be an object', 'INVALID_PAYLOAD');
    }
    const serialized = JSON.stringify(payload);
    if (serialized.length > AUDIT_LOGGER_CONSTANTS.MAX_PAYLOAD_BYTES) {
      throw new AuditLoggerError(
        `payload too large: ${serialized.length} > ${AUDIT_LOGGER_CONSTANTS.MAX_PAYLOAD_BYTES}`,
        'PAYLOAD_TOO_LARGE'
      );
    }

    const sequence = this.nextSequence++;
    const id = `ev_${sequence.toString(36).padStart(8, '0')}`;
    const timestamp = input.timestamp ?? Date.now();
    const correlationId = input.correlationId ?? null;
    const nonce = randomHex(16);
    const prevChainHash = this.chainHead;

    const event: AuditEvent = {
      id,
      timestamp,
      actor: input.actor,
      eventType: input.eventType,
      category: input.category,
      severity,
      payload: { ...payload },
      source: input.source,
      correlationId,
      eventHash: '', // computed below
      prevChainHash,
      nonce,
    };

    event.eventHash = await computeEventHash(event);
    this.chainHead = event.eventHash;
    this.events.push(event);

    // Enforce FIFO cap.
    if (this.events.length > this.maxEvents) {
      const overflow = this.events.length - this.maxEvents;
      this.events.splice(0, overflow);
      // Note: we do NOT recompute the chain head from a truncated log.
      // Truncation is a deliberate operational action; verifiers MUST
      // compare against a snapshot exported prior to truncation.
    }

    return event;
  }

  /** Current chain value (literal genesis marker before the first event, then a digest). */
  getChainHead(): string {
    return this.chainHead;
  }

  /** Number of events currently retained. */
  getEventCount(): number {
    return this.events.length;
  }

  /** Lookup by id. */
  getEventById(id: string): AuditEvent | null {
    return this.events.find((e) => e.id === id) ?? null;
  }

  /** Read-only copy of all events. */
  getEvents(): AuditEvent[] {
    return this.events.slice();
  }

  /**
   * Walk the chain and verify hash integrity. Returns a summary including
   * the first failing index (or -1 if all good).
   */
  async verifyChain(): Promise<AuditChainVerificationResult> {
    let prevChainHash = this.genesisChainHead;
    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i]!;
      if (e.prevChainHash !== prevChainHash) {
        return {
          valid: false,
          inspected: i + 1,
          firstFailure: i,
          reason: 'prevChainHash mismatch',
          chainHead: this.chainHead,
        };
      }
      const expected = await computeEventHash(e);
      if (expected !== e.eventHash) {
        return {
          valid: false,
          inspected: i + 1,
          firstFailure: i,
          reason: 'eventHash mismatch (payload or header tampering)',
          chainHead: this.chainHead,
        };
      }
      prevChainHash = e.eventHash;
    }
    if (prevChainHash !== this.chainHead) {
      return {
        valid: false,
        inspected: this.events.length,
        firstFailure: -1,
        reason: 'chainHead drift',
        chainHead: this.chainHead,
      };
    }
    return {
      valid: true,
      inspected: this.events.length,
      firstFailure: -1,
      reason: null,
      chainHead: this.chainHead,
    };
  }

  /**
   * Query events. Returns matching events in append order, capped at
   * `limit` (default MAX_QUERY_RESULTS).
   */
  query(filter: AuditQuery = {}): AuditEvent[] {
    const limit = filter.limit ?? AUDIT_LOGGER_CONSTANTS.MAX_QUERY_RESULTS;
    const offset = filter.offset ?? 0;
    const out: AuditEvent[] = [];
    for (const e of this.events) {
      if (filter.category && e.category !== filter.category) continue;
      if (filter.severity && e.severity !== filter.severity) continue;
      if (filter.actor && e.actor !== filter.actor) continue;
      if (filter.eventType && e.eventType !== filter.eventType) continue;
      if (filter.source && e.source !== filter.source) continue;
      if (filter.correlationId && e.correlationId !== filter.correlationId) {
        continue;
      }
      if (filter.sinceMs !== undefined && e.timestamp < filter.sinceMs) continue;
      if (filter.untilMs !== undefined && e.timestamp > filter.untilMs) continue;
      out.push(e);
    }
    return out.slice(offset, offset + limit);
  }

  /**
   * Export the log. 'json' returns a pretty-printed snapshot;
   * 'jsonl' returns newline-delimited JSON, one event per line.
   */
  export(format: 'json' | 'jsonl' = 'json'): string {
    if (format === 'jsonl') {
      return this.events.map((e) => JSON.stringify(e)).join('\n');
    }
    return JSON.stringify(
      {
        schemaVersion: AUDIT_LOGGER_CONSTANTS.SCHEMA_VERSION,
        exportedAt: Date.now(),
        chainHead: this.chainHead,
        eventCount: this.events.length,
        events: this.events,
      },
      null,
      2
    );
  }

  /**
   * Replace the in-memory log with an export. Validates the chain head
   * before accepting. Throws on mismatch.
   */
  async restore(snapshot: { chainHead: string; events: AuditEvent[] }): Promise<void> {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new AuditLoggerError('snapshot required', 'INVALID_SNAPSHOT');
    }
    if (typeof snapshot.chainHead !== 'string') {
      throw new AuditLoggerError('snapshot.chainHead required', 'INVALID_SNAPSHOT');
    }
    if (!Array.isArray(snapshot.events)) {
      throw new AuditLoggerError('snapshot.events must be array', 'INVALID_SNAPSHOT');
    }
    // Validate chain inside the snapshot.
    let prev = this.genesisChainHead;
    for (let i = 0; i < snapshot.events.length; i++) {
      const e = snapshot.events[i]!;
      if (e.prevChainHash !== prev) {
        throw new AuditLoggerError(`chain broken at index ${i}`, 'CHAIN_BROKEN');
      }
      const expected = await computeEventHash(e);
      if (expected !== e.eventHash) {
        throw new AuditLoggerError(`event ${i} hash mismatch`, 'CHAIN_BROKEN');
      }
      prev = e.eventHash;
    }
    if (prev !== snapshot.chainHead) {
      throw new AuditLoggerError('snapshot.chainHead drift', 'CHAIN_BROKEN');
    }
    this.events = snapshot.events.slice();
    this.chainHead = snapshot.chainHead;
    this.nextSequence = this.events.length;
  }

  /** Test seam. */
  clear(): void {
    this.events = [];
    this.chainHead = this.genesisChainHead;
    this.nextSequence = 0;
  }
}

function isValidCategory(c: unknown): c is AuditCategory {
  if (typeof c !== 'string') return false;
  const valid = [
    'auth',
    'authorization',
    'data-access',
    'data-modification',
    'data-export',
    'config-change',
    'secret-rotation',
    'credential-management',
    'system',
    'security-incident',
    'compliance',
    'admin-action',
    'user-action',
    'error',
  ];
  return valid.indexOf(c) !== -1;
}

function isValidSeverity(s: unknown): s is AuditSeverity {
  if (typeof s !== 'string') return false;
  const valid = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
  return valid.indexOf(s) !== -1;
}

async function computeEventHash(e: AuditEvent): Promise<string> {
  const preimage = [
    e.prevChainHash,
    e.id,
    e.timestamp.toString(),
    e.actor,
    e.eventType,
    e.category,
    e.severity,
    canonicalize(e.payload),
    e.source,
    e.correlationId ?? '',
    e.nonce,
  ].join('|');
  return sha256Hex(preimage);
}
