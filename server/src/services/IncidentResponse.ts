/**
 * Server-side incident register (N-0011 / N-0012).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `server/src/index.ts` previously did:
 *
 *     import { IncidentResponse } from '../src/services/IncidentResponse.js';
 *
 * That reaches OUT of the server project into the browser bundle's source
 * tree. It is structurally uncompilable — `server/tsconfig.json` declares
 * `rootDir: "src"`, so a path above it can never be emitted — and
 * `npx tsc --noEmit` in `server/` failed with TS2307. The server "worked"
 * only because `tsx`/vitest resolved it at runtime and the type error was
 * never gated in CI. Wiring the server into CI (N-0011) surfaced it
 * immediately.
 *
 * This is the server's own minimal, dependency-free incident register. It
 * intentionally does NOT import the 1,075-line frontend module: the browser
 * implementation carries UI concerns and browser globals that have no place
 * in an Express process.
 */

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CLOSED';

export interface IncidentTimelineEvent {
  timestamp: string;
  actor: string;
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reporter: string;
  affectedSystems: string[];
  affectedUsers: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  timeline: IncidentTimelineEvent[];
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  severity: IncidentSeverity;
  reporter: string;
  affectedSystems?: string[];
  affectedUsers?: number;
  tags?: string[];
}

const VALID_SEVERITIES: readonly IncidentSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

/** Thrown on invalid incident input. Never silently coerced. */
export class InvalidIncidentError extends Error {
  constructor(field: string, value: unknown) {
    super(`Invalid incident ${field}: ${String(value)}`);
    this.name = 'InvalidIncidentError';
  }
}

export class IncidentResponse {
  private static instance: IncidentResponse | undefined;
  private incidents: Incident[] = [];
  private counter = 0;

  static getInstance(): IncidentResponse {
    if (!IncidentResponse.instance) IncidentResponse.instance = new IncidentResponse();
    return IncidentResponse.instance;
  }

  /** Test-only reset so suites cannot leak state into one another. */
  static __resetForTests(): void {
    IncidentResponse.instance = undefined;
  }

  createIncident(input: CreateIncidentInput): Incident {
    if (!input?.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
      throw new InvalidIncidentError('title', input?.title);
    }
    if (!VALID_SEVERITIES.includes(input.severity)) {
      throw new InvalidIncidentError('severity', input?.severity);
    }
    const now = new Date().toISOString();
    this.counter += 1;
    const incident: Incident = {
      id: `INC-${String(this.counter).padStart(5, '0')}`,
      title: input.title,
      description: input.description ?? '',
      severity: input.severity,
      status: 'OPEN',
      reporter: input.reporter ?? 'system',
      affectedSystems: input.affectedSystems ?? [],
      affectedUsers: Number.isFinite(input.affectedUsers) ? Number(input.affectedUsers) : 0,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
      timeline: [{ timestamp: now, actor: input.reporter ?? 'system', message: 'Incident opened' }],
    };
    this.incidents.push(incident);
    return incident;
  }

  listIncidents(): Incident[] {
    return this.incidents.map((i) => ({ ...i, timeline: [...i.timeline] }));
  }

  getIncident(id: string): Incident | undefined {
    const found = this.incidents.find((i) => i.id === id);
    return found ? { ...found, timeline: [...found.timeline] } : undefined;
  }

  updateStatus(id: string, status: IncidentStatus, actor = 'system'): Incident {
    const incident = this.incidents.find((i) => i.id === id);
    if (!incident) throw new InvalidIncidentError('id', id);
    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    incident.timeline.push({
      timestamp: incident.updatedAt,
      actor,
      message: `Status changed to ${status}`,
    });
    return { ...incident, timeline: [...incident.timeline] };
  }
}
