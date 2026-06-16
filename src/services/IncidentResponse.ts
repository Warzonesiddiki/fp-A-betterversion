/**
 * IncidentResponse — PATCH 9 (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * SECURITY OPERATIONS SERVICE — incident lifecycle, postmortems, artifacts.
 *
 * 9.1 Severity levels (CVSS-aligned):
 *      CRITICAL (9.0-10.0), HIGH (7.0-8.9), MEDIUM (4.0-6.9), LOW (0.1-3.9), INFO (0.0)
 * 9.2 Incident class:
 *      id, title, description, severity, status, timestamps, assignee, reporter,
 *      affectedSystems, affectedUsers, timeline, artifacts, postmortem
 * 9.3 Operations:
 *      createIncident, updateIncident, addTimelineEvent, assignIncident,
 *      closeIncident, reopenIncident
 *      attachArtifact, removeArtifact
 *      writePostmortem, signOffPostmortem
 *      exportIncident (JSON, markdown)
 * 9.4 Lifecycle:
 *      auto-escalation based on severity + age
 *      SLA tracking (response/resolution per severity)
 * 9.5 Audit integration:
 *      emit audit events for create/update/close/sign-off
 * 9.6 Storage:
 *      In-memory + pluggable adapter (MemoryAdapter default; can inject LocalStorage)
 *
 * CWE references:
 * - CWE-778 (Insufficient Logging) — full timeline + audit events
 * - CWE-223 (Omission of Security-relevant Information) — full artifact list
 * - CWE-1188 (Insecure Defaults) — strict typing, no implicit escalation
 *
 * @module services/IncidentResponse
 */

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * INCIDENT_RESPONSE_CONSTANTS — exported for downstream consumers
 * (audit logs, RATIFICATION GATE pre-checks, SOC 2 CC7.4/CC7.5 evidence).
 */
export const INCIDENT_RESPONSE_CONSTANTS = {
  /** Default response SLA in minutes (CRITICAL = 15 min, HIGH = 1h, etc.) */
  DEFAULT_RESPONSE_SLA_MINUTES: {
    CRITICAL: 15,
    HIGH: 60,
    MEDIUM: 240, // 4 hours
    LOW: 1440,   // 24 hours
    INFO: 10080, // 7 days
  } as const,
  /** Default resolution SLA in minutes */
  DEFAULT_RESOLUTION_SLA_MINUTES: {
    CRITICAL: 240,    // 4 hours
    HIGH: 1440,       // 24 hours
    MEDIUM: 4320,     // 3 days
    LOW: 10080,       // 7 days
    INFO: 43200,      // 30 days
  } as const,
  /** Numeric CVSS score per severity */
  SEVERITY_SCORE: {
    CRITICAL: 9.5,
    HIGH: 7.5,
    MEDIUM: 5.0,
    LOW: 2.0,
    INFO: 0.0,
  } as const,
  /** Auto-escalate after this many minutes past response SLA */
  AUTO_ESCALATION_BUFFER_MINUTES: 5,
  /** Schema version for forward-compat (bump on breaking changes) */
  SCHEMA_VERSION: 1,
  /** Maximum timeline events per incident (defends against unbounded growth) */
  MAX_TIMELINE_EVENTS: 1000,
  /** Maximum artifacts per incident */
  MAX_ARTIFACTS: 100,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type IncidentStatus =
  | 'open'            // newly created, not yet acknowledged
  | 'investigating'   // actively being worked
  | 'contained'       // impact contained, monitoring
  | 'resolved'        // fixed, awaiting postmortem
  | 'postmortem'      // postmortem in progress
  | 'closed';         // fully closed

export type IncidentEventType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'severity_changed'
  | 'assigned'
  | 'artifact_attached'
  | 'artifact_removed'
  | 'timeline_event'
  | 'postmortem_written'
  | 'postmortem_signed_off'
  | 'closed'
  | 'reopened'
  | 'escalated';

export interface IncidentArtifact {
  id: string;
  type: 'log' | 'screenshot' | 'file' | 'metric' | 'config' | 'other';
  name: string;
  content?: string;        // inline for small artifacts
  url?: string;            // external link for large artifacts
  contentType?: string;    // mime type
  size?: number;           // bytes
  hash?: string;           // sha256 of content
  attachedAt: number;
  attachedBy: string;
}

export interface IncidentTimelineEvent {
  id: string;
  type: IncidentEventType;
  timestamp: number;
  actor: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface IncidentPostmortem {
  rootCause: string;
  lessonsLearned: string;
  actionItems: Array<{
    description: string;
    owner: string;
    dueDate?: number;
    status: 'open' | 'in_progress' | 'done';
  }>;
  writtenAt?: number;
  writtenBy?: string;
  signedOffAt?: number;
  signedOffBy?: string;
}

export interface Incident {
  schemaVersion: number;
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  closedAt?: number;
  /** ISO date string (YYYY-MM-DD) of when incident occurred (may differ from createdAt) */
  occurredAt?: number;
  reporter: string;
  assignee?: string;
  affectedSystems: string[];
  affectedUsers: number;
  tags: string[];
  timeline: IncidentTimelineEvent[];
  artifacts: IncidentArtifact[];
  postmortem?: IncidentPostmortem;
  /** Audit log correlation ID (links to AuditLogEngine) */
  auditCorrelationId?: string;
  /** SLA tracking */
  responseSlaMinutes: number;
  resolutionSlaMinutes: number;
  /** Was the response SLA met? */
  responseSlaMet?: boolean;
  /** Was the resolution SLA met? */
  resolutionSlaMet?: boolean;
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  severity: IncidentSeverity;
  reporter: string;
  affectedSystems?: string[];
  affectedUsers?: number;
  tags?: string[];
  occurredAt?: number;
  assignee?: string;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  affectedSystems?: string[];
  affectedUsers?: number;
  tags?: string[];
  assignee?: string;
}

export interface SlaStatus {
  responseSla: { limit: number; elapsed: number; met: boolean | undefined; breached: boolean };
  resolutionSla: { limit: number; elapsed: number; met: boolean | undefined; breached: boolean };
}

export interface ExportOptions {
  format: 'json' | 'markdown';
  includeTimeline?: boolean;
  includeArtifacts?: boolean;
  includePostmortem?: boolean;
}

// ── Storage Adapter ──────────────────────────────────────────────────────────

/**
 * StorageAdapter — interface for pluggable incident persistence.
 * Default: InMemoryAdapter. LocalStorageAdapter available for browser.
 */
export interface IncidentStorageAdapter {
  save(incident: Incident): void;
  get(id: string): Incident | null;
  list(): Incident[];
  delete(id: string): boolean;
}

export class InMemoryIncidentAdapter implements IncidentStorageAdapter {
  private store: Map<string, Incident> = new Map();

  save(incident: Incident): void {
    this.store.set(incident.id, { ...incident });
  }

  get(id: string): Incident | null {
    return this.store.get(id) ?? null;
  }

  list(): Incident[] {
    return Array.from(this.store.values());
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }
}

export class LocalStorageIncidentAdapter implements IncidentStorageAdapter {
  constructor(private readonly storageKey: string = 'incidents') {}

  private getStore(): Map<string, Incident> {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorageIncidentAdapter: localStorage is not available');
    }
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return new Map();
    try {
      const arr = JSON.parse(raw) as Incident[];
      return new Map(arr.map((i) => [i.id, i]));
    } catch {
      return new Map();
    }
  }

  private setStore(store: Map<string, Incident>): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(Array.from(store.values())));
  }

  save(incident: Incident): void {
    const store = this.getStore();
    store.set(incident.id, { ...incident });
    this.setStore(store);
  }

  get(id: string): Incident | null {
    return this.getStore().get(id) ?? null;
  }

  list(): Incident[] {
    return Array.from(this.getStore().values());
  }

  delete(id: string): boolean {
    const store = this.getStore();
    const had = store.delete(id);
    if (had) this.setStore(store);
    return had;
  }
}

// ── Audit Emitter ───────────────────────────────────────────────────────────

export interface IncidentAuditEvent {
  type: string;
  timestamp: number;
  actor: string;
  incidentId: string;
  payload: Record<string, unknown>;
}

export type AuditEmitter = (event: IncidentAuditEvent) => void;

// ── Errors ───────────────────────────────────────────────────────────────────

export class IncidentError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'IncidentError';
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fallbackRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function newId(prefix: string): string {
  const ts = Date.now().toString(36);
  const hex = fallbackRandomHex(6);
  return `${prefix}-${ts}-${hex}`;
}

// ── Class ────────────────────────────────────────────────────────────────────

/**
 * IncidentResponse — incident lifecycle manager.
 *
 * Singleton via `getInstance()` for app-wide use. Tests should call
 * `resetInstance()` between cases.
 *
 * @example
 * ```ts
 * const ir = IncidentResponse.getInstance();
 * const incident = ir.createIncident({
 *   title: 'Auth bypass in login',
 *   description: 'Attackers can bypass 2FA via...',
 *   severity: 'CRITICAL',
 *   reporter: 'sec-team@example.com',
 * });
 * ir.assignIncident(incident.id, 'security-lead@example.com');
 * ir.addTimelineEvent(incident.id, {
 *   type: 'timeline_event',
 *   actor: 'security-lead@example.com',
 *   message: 'Patched auth bypass at 16:30 UTC',
 * });
 * const md = ir.exportIncident(incident.id, { format: 'markdown' });
 * ```
 */
export class IncidentResponse {
  private static _instance: IncidentResponse | null = null;
  private readonly adapter: IncidentStorageAdapter;
  private readonly auditEmitter: AuditEmitter | null;

  private constructor(
    adapter: IncidentStorageAdapter = new InMemoryIncidentAdapter(),
    auditEmitter: AuditEmitter | null = null
  ) {
    this.adapter = adapter;
    this.auditEmitter = auditEmitter;
  }

  /**
   * Get the singleton instance. First call creates the default instance.
   */
  static getInstance(): IncidentResponse {
    if (!IncidentResponse._instance) {
      IncidentResponse._instance = new IncidentResponse();
    }
    return IncidentResponse._instance;
  }

  /**
   * Reset the singleton (for tests).
   */
  static resetInstance(): void {
    IncidentResponse._instance = null;
  }

  /**
   * Create a new instance with custom adapter/audit emitter (for tests/dependency injection).
   */
  static create(adapter?: IncidentStorageAdapter, auditEmitter?: AuditEmitter): IncidentResponse {
    return new IncidentResponse(adapter, auditEmitter);
  }

  // ── 9.1 Severity levels ──────────────────────────────────────────────────

  /**
   * Get the numeric CVSS-aligned score for a severity level.
   */
  getSeverityScore(severity: IncidentSeverity): number {
    return INCIDENT_RESPONSE_CONSTANTS.SEVERITY_SCORE[severity];
  }

  /**
   * Get the response SLA in minutes for a severity.
   */
  getResponseSla(severity: IncidentSeverity): number {
    return INCIDENT_RESPONSE_CONSTANTS.DEFAULT_RESPONSE_SLA_MINUTES[severity];
  }

  /**
   * Get the resolution SLA in minutes for a severity.
   */
  getResolutionSla(severity: IncidentSeverity): number {
    return INCIDENT_RESPONSE_CONSTANTS.DEFAULT_RESOLUTION_SLA_MINUTES[severity];
  }

  // ── 9.2 Create / Read ────────────────────────────────────────────────────

  /**
   * Create a new incident. Throws if title or description is empty.
   */
  createIncident(input: CreateIncidentInput): Incident {
    if (!input.title || input.title.trim().length === 0) {
      throw new IncidentError('Incident title is required', 'INVALID_INPUT');
    }
    if (!input.description || input.description.trim().length === 0) {
      throw new IncidentError('Incident description is required', 'INVALID_INPUT');
    }
    if (!input.reporter || input.reporter.trim().length === 0) {
      throw new IncidentError('Reporter is required', 'INVALID_INPUT');
    }

    const now = Date.now();
    const incident: Incident = {
      schemaVersion: INCIDENT_RESPONSE_CONSTANTS.SCHEMA_VERSION,
      id: newId('inc'),
      title: input.title.trim(),
      description: input.description.trim(),
      severity: input.severity,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      occurredAt: input.occurredAt,
      reporter: input.reporter,
      assignee: input.assignee,
      affectedSystems: input.affectedSystems ?? [],
      affectedUsers: input.affectedUsers ?? 0,
      tags: input.tags ?? [],
      timeline: [
        {
          id: newId('evt'),
          type: 'created',
          timestamp: now,
          actor: input.reporter,
          message: `Incident created with severity ${input.severity}`,
          metadata: { severity: input.severity },
        },
      ],
      artifacts: [],
      responseSlaMinutes: this.getResponseSla(input.severity),
      resolutionSlaMinutes: this.getResolutionSla(input.severity),
    };

    this.adapter.save(incident);
    this.emitAudit('incident_created', incident, { severity: incident.severity });
    return incident;
  }

  /**
   * Get an incident by ID.
   */
  getIncident(id: string): Incident | null {
    return this.adapter.get(id);
  }

  /**
   * List all incidents.
   */
  listIncidents(): Incident[] {
    return this.adapter.list();
  }

  // ── 9.3 Update operations ────────────────────────────────────────────────

  /**
   * Update an incident. Only the fields explicitly provided are changed.
   * Status changes are recorded as timeline events.
   */
  updateIncident(id: string, input: UpdateIncidentInput, actor: string): Incident {
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    if (!actor || actor.trim().length === 0) {
      throw new IncidentError('Actor is required for update', 'INVALID_INPUT');
    }
    if (incident.status === 'closed' && !input.status) {
      throw new IncidentError('Cannot update closed incident without reopening first', 'CLOSED');
    }

    const now = Date.now();
    const before = { ...incident };
    const updated: Incident = { ...incident, updatedAt: now };

    if (input.title !== undefined) updated.title = input.title.trim();
    if (input.description !== undefined) updated.description = input.description.trim();
    if (input.severity !== undefined && input.severity !== incident.severity) {
      updated.severity = input.severity;
      updated.responseSlaMinutes = this.getResponseSla(input.severity);
      updated.resolutionSlaMinutes = this.getResolutionSla(input.severity);
      this.appendTimeline(updated, {
        type: 'severity_changed',
        actor,
        message: `Severity changed: ${incident.severity} → ${input.severity}`,
        metadata: { from: incident.severity, to: input.severity },
      });
    }
    if (input.status !== undefined && input.status !== incident.status) {
      updated.status = input.status;
      if (input.status === 'resolved' || input.status === 'closed') {
        updated.resolvedAt = now;
        updated.resolutionSlaMet = this.checkResolutionSla(updated);
      }
      this.appendTimeline(updated, {
        type: 'status_changed',
        actor,
        message: `Status changed: ${incident.status} → ${input.status}`,
        metadata: { from: incident.status, to: input.status },
      });
      if (input.status === 'closed') {
        updated.closedAt = now;
      }
    }
    if (input.affectedSystems !== undefined) updated.affectedSystems = [...input.affectedSystems];
    if (input.affectedUsers !== undefined) updated.affectedUsers = input.affectedUsers;
    if (input.tags !== undefined) updated.tags = [...input.tags];
    if (input.assignee !== undefined) {
      updated.assignee = input.assignee;
      this.appendTimeline(updated, {
        type: 'assigned',
        actor,
        message: `Assigned to ${input.assignee}`,
        metadata: { assignee: input.assignee },
      });
    }

    this.appendTimeline(updated, {
      type: 'updated',
      actor,
      message: 'Incident updated',
      metadata: this.diffFields(before, updated),
    });

    this.adapter.save(updated);
    this.emitAudit('incident_updated', updated, { changedFields: Object.keys(input) });
    return updated;
  }

  /**
   * Assign an incident to a user/team.
   */
  assignIncident(id: string, assignee: string, actor: string): Incident {
    if (!assignee || assignee.trim().length === 0) {
      throw new IncidentError('Assignee is required', 'INVALID_INPUT');
    }
    return this.updateIncident(id, { assignee }, actor);
  }

  /**
   * Close an incident (terminal state).
   */
  closeIncident(id: string, actor: string, note?: string): Incident {
    const updated = this.updateIncident(id, { status: 'closed' }, actor);
    if (note) {
      this.appendTimeline(updated, {
        type: 'timeline_event',
        actor,
        message: `Close note: ${note}`,
      });
      this.adapter.save(updated);
    }
    this.emitAudit('incident_closed', updated, { actor, note });
    return updated;
  }

  /**
   * Reopen a closed incident.
   */
  reopenIncident(id: string, actor: string, reason: string): Incident {
    if (!reason || reason.trim().length === 0) {
      throw new IncidentError('Reopen reason is required', 'INVALID_INPUT');
    }
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    const now = Date.now();
    const updated: Incident = {
      ...incident,
      status: 'investigating',
      closedAt: undefined,
      resolvedAt: undefined,
      updatedAt: now,
    };
    this.appendTimeline(updated, {
      type: 'reopened',
      actor,
      message: `Reopened: ${reason}`,
      metadata: { reason },
    });
    this.adapter.save(updated);
    this.emitAudit('incident_reopened', updated, { actor, reason });
    return updated;
  }

  // ── 9.3 Timeline ─────────────────────────────────────────────────────────

  /**
   * Add a timeline event to an incident.
   */
  addTimelineEvent(
    id: string,
    event: { type: IncidentEventType; actor: string; message: string; metadata?: Record<string, unknown> }
  ): Incident {
    if (!event.actor || event.actor.trim().length === 0) {
      throw new IncidentError('Actor is required for timeline event', 'INVALID_INPUT');
    }
    if (!event.message || event.message.trim().length === 0) {
      throw new IncidentError('Message is required for timeline event', 'INVALID_INPUT');
    }
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    if (incident.timeline.length >= INCIDENT_RESPONSE_CONSTANTS.MAX_TIMELINE_EVENTS) {
      throw new IncidentError(
        `Maximum timeline events (${INCIDENT_RESPONSE_CONSTANTS.MAX_TIMELINE_EVENTS}) reached`,
        'CAPACITY'
      );
    }
    const updated: Incident = { ...incident, updatedAt: Date.now() };
    this.appendTimeline(updated, event);
    this.adapter.save(updated);
    this.emitAudit('timeline_event_added', updated, { eventType: event.type });
    return updated;
  }

  // ── 9.3 Artifacts ────────────────────────────────────────────────────────

  /**
   * Attach an artifact to an incident.
   */
  attachArtifact(id: string, artifact: Omit<IncidentArtifact, 'id' | 'attachedAt'>): Incident {
    if (!artifact.name || artifact.name.trim().length === 0) {
      throw new IncidentError('Artifact name is required', 'INVALID_INPUT');
    }
    if (!artifact.attachedBy || artifact.attachedBy.trim().length === 0) {
      throw new IncidentError('attachedBy is required', 'INVALID_INPUT');
    }
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    if (incident.artifacts.length >= INCIDENT_RESPONSE_CONSTANTS.MAX_ARTIFACTS) {
      throw new IncidentError(
        `Maximum artifacts (${INCIDENT_RESPONSE_CONSTANTS.MAX_ARTIFACTS}) reached`,
        'CAPACITY'
      );
    }
    const now = Date.now();
    const newArtifact: IncidentArtifact = {
      ...artifact,
      id: newId('art'),
      attachedAt: now,
    };
    const updated: Incident = {
      ...incident,
      artifacts: [...incident.artifacts, newArtifact],
      updatedAt: now,
    };
    this.appendTimeline(updated, {
      type: 'artifact_attached',
      actor: artifact.attachedBy,
      message: `Attached artifact: ${newArtifact.name} (${newArtifact.type})`,
      metadata: { artifactId: newArtifact.id, type: newArtifact.type },
    });
    this.adapter.save(updated);
    this.emitAudit('artifact_attached', updated, { artifactId: newArtifact.id, type: newArtifact.type });
    return updated;
  }

  /**
   * Remove an artifact from an incident.
   */
  removeArtifact(id: string, artifactId: string, actor: string): Incident {
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    const target = incident.artifacts.find((a) => a.id === artifactId);
    if (!target) {
      throw new IncidentError(`Artifact not found: ${artifactId}`, 'NOT_FOUND');
    }
    const updated: Incident = {
      ...incident,
      artifacts: incident.artifacts.filter((a) => a.id !== artifactId),
      updatedAt: Date.now(),
    };
    this.appendTimeline(updated, {
      type: 'artifact_removed',
      actor,
      message: `Removed artifact: ${target.name}`,
      metadata: { artifactId },
    });
    this.adapter.save(updated);
    this.emitAudit('artifact_removed', updated, { artifactId });
    return updated;
  }

  // ── 9.3 Postmortem ───────────────────────────────────────────────────────

  /**
   * Write a postmortem for an incident. The incident must be in 'resolved' or 'postmortem' state.
   */
  writePostmortem(
    id: string,
    postmortem: { rootCause: string; lessonsLearned: string; actionItems: IncidentPostmortem['actionItems']; writtenBy: string }
  ): Incident {
    if (!postmortem.rootCause || postmortem.rootCause.trim().length === 0) {
      throw new IncidentError('Root cause is required', 'INVALID_INPUT');
    }
    if (!postmortem.writtenBy || postmortem.writtenBy.trim().length === 0) {
      throw new IncidentError('writtenBy is required', 'INVALID_INPUT');
    }
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    if (incident.status !== 'resolved' && incident.status !== 'postmortem' && incident.status !== 'closed') {
      throw new IncidentError(
        `Cannot write postmortem in status ${incident.status}; must be resolved, postmortem, or closed`,
        'INVALID_STATE'
      );
    }
    const now = Date.now();
    const updated: Incident = {
      ...incident,
      status: incident.status === 'resolved' ? 'postmortem' : incident.status,
      postmortem: {
        rootCause: postmortem.rootCause,
        lessonsLearned: postmortem.lessonsLearned,
        actionItems: [...postmortem.actionItems],
        writtenAt: now,
        writtenBy: postmortem.writtenBy,
      },
      updatedAt: now,
    };
    this.appendTimeline(updated, {
      type: 'postmortem_written',
      actor: postmortem.writtenBy,
      message: 'Postmortem written',
    });
    this.adapter.save(updated);
    this.emitAudit('postmortem_written', updated, { writtenBy: postmortem.writtenBy });
    return updated;
  }

  /**
   * Sign off on a postmortem (final approval). The postmortem must exist.
   */
  signOffPostmortem(id: string, signedOffBy: string): Incident {
    if (!signedOffBy || signedOffBy.trim().length === 0) {
      throw new IncidentError('signedOffBy is required', 'INVALID_INPUT');
    }
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    if (!incident.postmortem) {
      throw new IncidentError('Cannot sign off on missing postmortem', 'NO_POSTMORTEM');
    }
    const now = Date.now();
    const updated: Incident = {
      ...incident,
      postmortem: {
        ...incident.postmortem,
        signedOffAt: now,
        signedOffBy,
      },
      updatedAt: now,
    };
    this.appendTimeline(updated, {
      type: 'postmortem_signed_off',
      actor: signedOffBy,
      message: `Postmortem signed off by ${signedOffBy}`,
    });
    this.adapter.save(updated);
    this.emitAudit('postmortem_signed_off', updated, { signedOffBy });
    return updated;
  }

  // ── 9.4 SLA tracking ─────────────────────────────────────────────────────

  /**
   * Check the SLA status of an incident.
   */
  getSlaStatus(id: string): SlaStatus | null {
    const incident = this.adapter.get(id);
    if (!incident) return null;
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - incident.createdAt) / 60_000);

    const responseLimit = incident.responseSlaMinutes;
    const responseMet = incident.responseSlaMet !== undefined
      ? incident.responseSlaMet
      : (incident.assignee !== undefined ? true : undefined);
    const responseBreached = responseMet === false || elapsedMinutes > responseLimit + INCIDENT_RESPONSE_CONSTANTS.AUTO_ESCALATION_BUFFER_MINUTES;

    const resolutionLimit = incident.resolutionSlaMinutes;
    const resolutionMet = incident.resolutionSlaMet !== undefined
      ? incident.resolutionSlaMet
      : (incident.resolvedAt !== undefined ? true : undefined);
    const resolutionBreached = resolutionMet === false || (
      !incident.resolvedAt && elapsedMinutes > resolutionLimit + INCIDENT_RESPONSE_CONSTANTS.AUTO_ESCALATION_BUFFER_MINUTES
    );

    return {
      responseSla: { limit: responseLimit, elapsed: elapsedMinutes, met: responseMet, breached: responseBreached },
      resolutionSla: { limit: resolutionLimit, elapsed: elapsedMinutes, met: resolutionMet, breached: resolutionBreached },
    };
  }

  /**
   * Auto-escalate incidents whose response SLA is breached.
   * Returns the list of escalated incident IDs.
   */
  autoEscalate(actor: string = 'system'): string[] {
    const escalated: string[] = [];
    for (const incident of this.adapter.list()) {
      if (incident.status === 'closed' || incident.status === 'resolved') continue;
      const sla = this.getSlaStatus(incident.id);
      if (!sla) continue;
      if (sla.responseSla.breached || sla.resolutionSla.breached) {
        const updated: Incident = { ...incident, updatedAt: Date.now() };
        this.appendTimeline(updated, {
          type: 'escalated',
          actor,
          message: `Auto-escalated: response SLA ${sla.responseSla.breached ? 'breached' : 'OK'}, resolution SLA ${sla.resolutionSla.breached ? 'breached' : 'OK'}`,
          metadata: { responseBreached: sla.responseSla.breached, resolutionBreached: sla.resolutionSla.breached },
        });
        this.adapter.save(updated);
        this.emitAudit('incident_escalated', updated, { sla: sla });
        escalated.push(incident.id);
      }
    }
    return escalated;
  }

  // ── 9.4 Export ───────────────────────────────────────────────────────────

  /**
   * Export an incident as JSON or markdown.
   */
  exportIncident(id: string, options: ExportOptions): string {
    const incident = this.adapter.get(id);
    if (!incident) {
      throw new IncidentError(`Incident not found: ${id}`, 'NOT_FOUND');
    }
    if (options.format === 'json') {
      const exported: Partial<Incident> = {
        schemaVersion: incident.schemaVersion,
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        resolvedAt: incident.resolvedAt,
        closedAt: incident.closedAt,
        reporter: incident.reporter,
        assignee: incident.assignee,
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers,
        tags: incident.tags,
        postmortem: options.includePostmortem === false ? undefined : incident.postmortem,
      };
      if (options.includeTimeline !== false) exported.timeline = incident.timeline;
      if (options.includeArtifacts !== false) exported.artifacts = incident.artifacts;
      return JSON.stringify(exported, null, 2);
    }

    // Markdown
    const lines: string[] = [];
    lines.push(`# Incident: ${incident.title}`);
    lines.push('');
    lines.push(`**ID:** \`${incident.id}\`  `);
    lines.push(`**Severity:** ${incident.severity} (${this.getSeverityScore(incident.severity)})  `);
    lines.push(`**Status:** ${incident.status}  `);
    lines.push(`**Created:** ${new Date(incident.createdAt).toISOString()}  `);
    lines.push(`**Reporter:** ${incident.reporter}  `);
    if (incident.assignee) lines.push(`**Assignee:** ${incident.assignee}  `);
    lines.push('');
    lines.push('## Description');
    lines.push(incident.description);
    lines.push('');
    lines.push('## Impact');
    lines.push(`- Affected systems: ${incident.affectedSystems.length > 0 ? incident.affectedSystems.join(', ') : 'none'}`);
    lines.push(`- Affected users: ${incident.affectedUsers}`);
    lines.push(`- Tags: ${incident.tags.length > 0 ? incident.tags.join(', ') : 'none'}`);
    lines.push('');

    if (options.includeTimeline !== false && incident.timeline.length > 0) {
      lines.push('## Timeline');
      for (const evt of incident.timeline) {
        lines.push(`- **${new Date(evt.timestamp).toISOString()}** [${evt.type}] ${evt.actor}: ${evt.message}`);
      }
      lines.push('');
    }

    if (options.includeArtifacts !== false && incident.artifacts.length > 0) {
      lines.push('## Artifacts');
      for (const art of incident.artifacts) {
        lines.push(`- \`${art.id}\` (${art.type}) ${art.name}${art.hash ? ` — sha256:${art.hash.slice(0, 12)}` : ''}`);
      }
      lines.push('');
    }

    if (options.includePostmortem !== false && incident.postmortem) {
      lines.push('## Postmortem');
      lines.push('### Root cause');
      lines.push(incident.postmortem.rootCause);
      lines.push('');
      lines.push('### Lessons learned');
      lines.push(incident.postmortem.lessonsLearned);
      lines.push('');
      if (incident.postmortem.actionItems.length > 0) {
        lines.push('### Action items');
        for (const item of incident.postmortem.actionItems) {
          lines.push(`- [${item.status}] ${item.description} (owner: ${item.owner}${item.dueDate ? `, due: ${new Date(item.dueDate).toISOString()}` : ''})`);
        }
        lines.push('');
      }
      if (incident.postmortem.signedOffBy) {
        lines.push(`*Signed off by ${incident.postmortem.signedOffBy} on ${new Date(incident.postmortem.signedOffAt!).toISOString()}*`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ── 9.6 Delete ───────────────────────────────────────────────────────────

  /**
   * Delete an incident (and all its timeline + artifacts).
   * Returns true if deleted, false if not found.
   */
  deleteIncident(id: string): boolean {
    const had = this.adapter.delete(id);
    if (had) this.emitAudit('incident_deleted', { id } as Incident, { id });
    return had;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private appendTimeline(
    incident: Incident,
    event: { type: IncidentEventType; actor: string; message: string; metadata?: Record<string, unknown> }
  ): void {
    if (incident.timeline.length >= INCIDENT_RESPONSE_CONSTANTS.MAX_TIMELINE_EVENTS) return;
    incident.timeline.push({
      id: newId('evt'),
      type: event.type,
      timestamp: Date.now(),
      actor: event.actor,
      message: event.message,
      metadata: event.metadata,
    });
  }

  private checkResolutionSla(incident: Incident): boolean {
    const elapsed = (Date.now() - incident.createdAt) / 60_000;
    return elapsed <= incident.resolutionSlaMinutes;
  }

  private diffFields(before: Incident, after: Incident): Record<string, { from: unknown; to: unknown }> {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    const keys: (keyof Incident)[] = ['title', 'description', 'severity', 'status', 'assignee', 'affectedUsers', 'tags', 'affectedSystems'];
    for (const k of keys) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        diff[k] = { from: before[k], to: after[k] };
      }
    }
    return diff;
  }

  private emitAudit(
    type: string,
    incident: Incident,
    payload: Record<string, unknown>
  ): void {
    if (this.auditEmitter) {
      try {
        this.auditEmitter({
          type,
          timestamp: Date.now(),
          actor: incident.assignee ?? incident.reporter,
          incidentId: incident.id,
          payload,
        });
      } catch {
        // Swallow audit errors so the original operation succeeds
      }
    }
  }
}
