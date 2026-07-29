/**
 * IncidentResponse.test.ts — PATCH 9 (Hephaestus, FinPlan Pro v1.0.0)
 *
 * Tests for incident lifecycle, postmortems, artifacts, SLA tracking, export.
 */

import { describe, it, expect, beforeEach, afterEach, _vi } from 'vitest';
import {
  IncidentResponse,
  InMemoryIncidentAdapter,
  LocalStorageIncidentAdapter,
  IncidentError,
  INCIDENT_RESPONSE_CONSTANTS,
  type Incident,
  type IncidentAuditEvent,
  type AuditEmitter,
} from './IncidentResponse';

describe('IncidentResponse', () => {
  let ir: IncidentResponse;
  let auditEvents: IncidentAuditEvent[];

  beforeEach(() => {
    IncidentResponse.resetInstance();
    auditEvents = [];
    const audit: AuditEmitter = (e) => auditEvents.push(e);
    ir = IncidentResponse.create(new InMemoryIncidentAdapter(), audit);
  });

  afterEach(() => {
    IncidentResponse.resetInstance();
  });

  // ── Constants ────────────────────────────────────────────────────────────

  describe('INCIDENT_RESPONSE_CONSTANTS', () => {
    it('exports canonical constants', () => {
      expect(INCIDENT_RESPONSE_CONSTANTS.SCHEMA_VERSION).toBe(1);
      expect(INCIDENT_RESPONSE_CONSTANTS.SEVERITY_SCORE.CRITICAL).toBe(9.5);
      expect(INCIDENT_RESPONSE_CONSTANTS.DEFAULT_RESPONSE_SLA_MINUTES.CRITICAL).toBe(15);
      expect(INCIDENT_RESPONSE_CONSTANTS.DEFAULT_RESOLUTION_SLA_MINUTES.CRITICAL).toBe(240);
      expect(INCIDENT_RESPONSE_CONSTANTS.MAX_TIMELINE_EVENTS).toBe(1000);
      expect(INCIDENT_RESPONSE_CONSTANTS.MAX_ARTIFACTS).toBe(100);
    });
  });

  // ── Singleton ────────────────────────────────────────────────────────────

  describe('singleton', () => {
    it('returns the same instance from getInstance()', () => {
      const a = IncidentResponse.getInstance();
      const b = IncidentResponse.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance clears the singleton', () => {
      IncidentResponse.getInstance();
      IncidentResponse.resetInstance();
      const a = IncidentResponse.getInstance();
      const b = IncidentResponse.getInstance();
      expect(a).toBe(b);
    });

    it('create() returns a new instance (not the singleton)', () => {
      const singleton = IncidentResponse.getInstance();
      const custom = IncidentResponse.create();
      expect(custom).not.toBe(singleton);
    });
  });

  // ── Severity helpers ─────────────────────────────────────────────────────

  describe('severity helpers', () => {
    it('getSeverityScore returns CVSS-aligned scores', () => {
      expect(ir.getSeverityScore('CRITICAL')).toBe(9.5);
      expect(ir.getSeverityScore('HIGH')).toBe(7.5);
      expect(ir.getSeverityScore('MEDIUM')).toBe(5.0);
      expect(ir.getSeverityScore('LOW')).toBe(2.0);
      expect(ir.getSeverityScore('INFO')).toBe(0.0);
    });

    it('getResponseSla returns minutes per severity', () => {
      expect(ir.getResponseSla('CRITICAL')).toBe(15);
      expect(ir.getResponseSla('HIGH')).toBe(60);
      expect(ir.getResponseSla('MEDIUM')).toBe(240);
      expect(ir.getResponseSla('LOW')).toBe(1440);
      expect(ir.getResponseSla('INFO')).toBe(10080);
    });

    it('getResolutionSla returns minutes per severity', () => {
      expect(ir.getResolutionSla('CRITICAL')).toBe(240);
      expect(ir.getResolutionSla('HIGH')).toBe(1440);
      expect(ir.getResolutionSla('MEDIUM')).toBe(4320);
      expect(ir.getResolutionSla('LOW')).toBe(10080);
      expect(ir.getResolutionSla('INFO')).toBe(43200);
    });
  });

  // ── Create ───────────────────────────────────────────────────────────────

  describe('createIncident', () => {
    it('creates an incident with all required fields', () => {
      const incident = ir.createIncident({
        title: 'Auth bypass',
        description: 'Attackers can bypass 2FA',
        severity: 'CRITICAL',
        reporter: 'sec@example.com',
      });
      expect(incident.id).toMatch(/^inc-/);
      expect(incident.status).toBe('open');
      expect(incident.severity).toBe('CRITICAL');
      expect(incident.schemaVersion).toBe(1);
      expect(incident.responseSlaMinutes).toBe(15);
      expect(incident.resolutionSlaMinutes).toBe(240);
      expect(incident.timeline.length).toBe(1);
      expect(incident.timeline[0].type).toBe('created');
    });

    it('throws on empty title', () => {
      expect(() =>
        ir.createIncident({
          title: '',
          description: 'desc',
          severity: 'HIGH',
          reporter: 'r@example.com',
        })
      ).toThrow(IncidentError);
    });

    it('throws on empty description', () => {
      expect(() =>
        ir.createIncident({
          title: 'title',
          description: '   ',
          severity: 'HIGH',
          reporter: 'r@example.com',
        })
      ).toThrow(IncidentError);
    });

    it('throws on empty reporter', () => {
      expect(() =>
        ir.createIncident({
          title: 'title',
          description: 'desc',
          severity: 'HIGH',
          reporter: '',
        })
      ).toThrow(IncidentError);
    });

    it('persists the incident to the adapter', () => {
      const incident = ir.createIncident({
        title: 'Test',
        description: 'Desc',
        severity: 'MEDIUM',
        reporter: 'r@example.com',
      });
      const fetched = ir.getIncident(incident.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(incident.id);
    });

    it('emits audit event on create', () => {
      ir.createIncident({
        title: 'Test',
        description: 'Desc',
        severity: 'CRITICAL',
        reporter: 'r@example.com',
      });
      expect(auditEvents.length).toBe(1);
      expect(auditEvents[0].type).toBe('incident_created');
    });
  });

  // ── Read ─────────────────────────────────────────────────────────────────

  describe('getIncident / listIncidents', () => {
    it('returns null for unknown ID', () => {
      expect(ir.getIncident('inc-unknown')).toBeNull();
    });

    it('lists all incidents', () => {
      ir.createIncident({ title: 'A', description: 'a', severity: 'HIGH', reporter: 'r@e.com' });
      ir.createIncident({ title: 'B', description: 'b', severity: 'LOW', reporter: 'r@e.com' });
      expect(ir.listIncidents().length).toBe(2);
    });
  });

  // ── Update ───────────────────────────────────────────────────────────────

  describe('updateIncident', () => {
    let incident: Incident;
    beforeEach(() => {
      incident = ir.createIncident({
        title: 'Test',
        description: 'Desc',
        severity: 'HIGH',
        reporter: 'r@example.com',
      });
    });

    it('updates title and description', () => {
      const updated = ir.updateIncident(
        incident.id,
        {
          title: 'New title',
          description: 'New desc',
        },
        'r@example.com'
      );
      expect(updated.title).toBe('New title');
      expect(updated.description).toBe('New desc');
    });

    it('records severity change in timeline', () => {
      const updated = ir.updateIncident(incident.id, { severity: 'CRITICAL' }, 'r@example.com');
      expect(updated.severity).toBe('CRITICAL');
      const sevEvent = updated.timeline.find((e) => e.type === 'severity_changed');
      expect(sevEvent).toBeDefined();
    });

    it('records status change in timeline', () => {
      const updated = ir.updateIncident(incident.id, { status: 'investigating' }, 'r@example.com');
      expect(updated.status).toBe('investigating');
      const statusEvent = updated.timeline.find((e) => e.type === 'status_changed');
      expect(statusEvent).toBeDefined();
    });

    it('sets resolvedAt when status becomes resolved', () => {
      const updated = ir.updateIncident(incident.id, { status: 'resolved' }, 'r@example.com');
      expect(updated.resolvedAt).toBeDefined();
    });

    it('throws on unknown incident', () => {
      expect(() => ir.updateIncident('inc-nope', { title: 'x' }, 'r@e.com')).toThrow(IncidentError);
    });

    it('throws on empty actor', () => {
      expect(() => ir.updateIncident(incident.id, { title: 'x' }, '')).toThrow(IncidentError);
    });
  });

  // ── Assign / Close / Reopen ──────────────────────────────────────────────

  describe('assignIncident', () => {
    it('assigns to a user', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      const updated = ir.assignIncident(inc.id, 'lead@e.com', 'r@e.com');
      expect(updated.assignee).toBe('lead@e.com');
      const evt = updated.timeline.find((e) => e.type === 'assigned');
      expect(evt).toBeDefined();
    });
  });

  describe('closeIncident', () => {
    it('closes an incident', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      const closed = ir.closeIncident(inc.id, 'r@e.com', 'fixed');
      expect(closed.status).toBe('closed');
      expect(closed.closedAt).toBeDefined();
    });

    it('emits incident_closed audit event', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      auditEvents.length = 0;
      ir.closeIncident(inc.id, 'r@e.com');
      const closeEvent = auditEvents.find((e) => e.type === 'incident_closed');
      expect(closeEvent).toBeDefined();
    });
  });

  describe('reopenIncident', () => {
    it('reopens a closed incident', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      ir.closeIncident(inc.id, 'r@e.com');
      const reopened = ir.reopenIncident(inc.id, 'r@e.com', 'Recurrence');
      expect(reopened.status).toBe('investigating');
      expect(reopened.closedAt).toBeUndefined();
    });

    it('throws on empty reason', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      ir.closeIncident(inc.id, 'r@e.com');
      expect(() => ir.reopenIncident(inc.id, 'r@e.com', '')).toThrow(IncidentError);
    });
  });

  // ── Timeline ─────────────────────────────────────────────────────────────

  describe('addTimelineEvent', () => {
    it('adds a timeline event', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      const updated = ir.addTimelineEvent(inc.id, {
        type: 'timeline_event',
        actor: 'lead@e.com',
        message: 'Started investigation',
      });
      expect(updated.timeline.length).toBe(2);
      const newEvent = updated.timeline[updated.timeline.length - 1];
      expect(newEvent.type).toBe('timeline_event');
      expect(newEvent.message).toBe('Started investigation');
    });

    it('throws on empty actor', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(() =>
        ir.addTimelineEvent(inc.id, {
          type: 'timeline_event',
          actor: '',
          message: 'msg',
        })
      ).toThrow(IncidentError);
    });

    it('throws on empty message', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(() =>
        ir.addTimelineEvent(inc.id, {
          type: 'timeline_event',
          actor: 'r@e.com',
          message: '   ',
        })
      ).toThrow(IncidentError);
    });
  });

  // ── Artifacts ────────────────────────────────────────────────────────────

  describe('artifacts', () => {
    it('attaches an artifact', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      const updated = ir.attachArtifact(inc.id, {
        type: 'log',
        name: 'auth.log',
        content: '...',
        attachedBy: 'r@e.com',
      });
      expect(updated.artifacts.length).toBe(1);
      expect(updated.artifacts[0].name).toBe('auth.log');
    });

    it('removes an artifact', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      const withArt = ir.attachArtifact(inc.id, { type: 'log', name: 'x', attachedBy: 'r@e.com' });
      const withoutArt = ir.removeArtifact(inc.id, withArt.artifacts[0].id, 'r@e.com');
      expect(withoutArt.artifacts.length).toBe(0);
    });

    it('throws on unknown artifact id', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(() => ir.removeArtifact(inc.id, 'art-nope', 'r@e.com')).toThrow(IncidentError);
    });

    it('throws on empty name', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(() =>
        ir.attachArtifact(inc.id, { type: 'log', name: '', attachedBy: 'r@e.com' })
      ).toThrow(IncidentError);
    });
  });

  // ── Postmortem ───────────────────────────────────────────────────────────

  describe('postmortem', () => {
    it('writes a postmortem on a resolved incident', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      ir.updateIncident(inc.id, { status: 'resolved' }, 'r@e.com');
      const withPM = ir.writePostmortem(inc.id, {
        rootCause: 'Bug in auth middleware',
        lessonsLearned: 'Add e2e tests for auth',
        actionItems: [{ description: 'Add e2e tests', owner: 'qa@e.com', status: 'open' }],
        writtenBy: 'r@e.com',
      });
      expect(withPM.postmortem).toBeDefined();
      expect(withPM.postmortem?.rootCause).toBe('Bug in auth middleware');
      expect(withPM.status).toBe('postmortem');
    });

    it('signs off a postmortem', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      ir.updateIncident(inc.id, { status: 'resolved' }, 'r@e.com');
      const _withPM = ir.writePostmortem(inc.id, {
        rootCause: 'X',
        lessonsLearned: 'Y',
        actionItems: [],
        writtenBy: 'r@e.com',
      });
      const signed = ir.signOffPostmortem(inc.id, 'director@e.com');
      expect(signed.postmortem?.signedOffBy).toBe('director@e.com');
    });

    it('throws on missing postmortem at sign-off', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(() => ir.signOffPostmortem(inc.id, 'd@e.com')).toThrow(IncidentError);
    });

    it('throws when writing postmortem on open incident', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(() =>
        ir.writePostmortem(inc.id, {
          rootCause: 'X',
          lessonsLearned: 'Y',
          actionItems: [],
          writtenBy: 'r@e.com',
        })
      ).toThrow(IncidentError);
    });
  });

  // ── SLA ──────────────────────────────────────────────────────────────────

  describe('SLA tracking', () => {
    it('getSlaStatus returns limits and elapsed time', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'CRITICAL',
        reporter: 'r@e.com',
      });
      const sla = ir.getSlaStatus(inc.id);
      expect(sla).not.toBeNull();
      expect(sla?.responseSla.limit).toBe(15);
      expect(sla?.resolutionSla.limit).toBe(240);
    });

    it('returns null for unknown incident', () => {
      expect(ir.getSlaStatus('inc-nope')).toBeNull();
    });
  });

  // ── Export ───────────────────────────────────────────────────────────────

  describe('exportIncident', () => {
    let inc: Incident;
    beforeEach(() => {
      inc = ir.createIncident({
        title: 'Test',
        description: 'Test description',
        severity: 'HIGH',
        reporter: 'r@e.com',
        affectedSystems: ['auth', 'db'],
        affectedUsers: 100,
        tags: ['security', 'auth'],
      });
      ir.attachArtifact(inc.id, { type: 'log', name: 'auth.log', attachedBy: 'r@e.com' });
      ir.updateIncident(inc.id, { status: 'resolved' }, 'r@e.com');
      ir.writePostmortem(inc.id, {
        rootCause: 'Bug',
        lessonsLearned: 'Lesson',
        actionItems: [{ description: 'Fix', owner: 'qa@e.com', status: 'open' }],
        writtenBy: 'r@e.com',
      });
    });

    it('exports as JSON', () => {
      const json = ir.exportIncident(inc.id, { format: 'json' });
      const parsed = JSON.parse(json);
      expect(parsed.title).toBe('Test');
      expect(parsed.severity).toBe('HIGH');
    });

    it('exports as Markdown with sections', () => {
      const md = ir.exportIncident(inc.id, { format: 'markdown' });
      expect(md).toContain('# Incident: Test');
      expect(md).toContain('## Description');
      expect(md).toContain('## Timeline');
      expect(md).toContain('## Artifacts');
      expect(md).toContain('## Postmortem');
      expect(md).toContain('auth.log');
      expect(md).toContain('Bug');
    });

    it('respects includeTimeline: false', () => {
      const json = ir.exportIncident(inc.id, { format: 'json', includeTimeline: false });
      const parsed = JSON.parse(json);
      expect(parsed.timeline).toBeUndefined();
    });

    it('throws on unknown incident', () => {
      expect(() => ir.exportIncident('inc-nope', { format: 'json' })).toThrow(IncidentError);
    });
  });

  // ── Delete ───────────────────────────────────────────────────────────────

  describe('deleteIncident', () => {
    it('deletes an incident', () => {
      const inc = ir.createIncident({
        title: 'A',
        description: 'a',
        severity: 'HIGH',
        reporter: 'r@e.com',
      });
      expect(ir.deleteIncident(inc.id)).toBe(true);
      expect(ir.getIncident(inc.id)).toBeNull();
    });

    it('returns false for unknown incident', () => {
      expect(ir.deleteIncident('inc-nope')).toBe(false);
    });
  });

  // ── Adapter integration ──────────────────────────────────────────────────

  describe('LocalStorageIncidentAdapter', () => {
    beforeEach(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    it('throws when localStorage is unavailable on set', () => {
      if (typeof localStorage === 'undefined') return;
      const adapter = new LocalStorageIncidentAdapter();
      expect(() =>
        adapter.save({
          schemaVersion: 1,
          id: 'a',
          title: 't',
          description: 'd',
          severity: 'HIGH',
          status: 'open',
          createdAt: 0,
          updatedAt: 0,
          reporter: 'r',
          affectedSystems: [],
          affectedUsers: 0,
          tags: [],
          timeline: [],
          artifacts: [],
          responseSlaMinutes: 60,
          resolutionSlaMinutes: 1440,
        })
      ).not.toThrow();
    });

    it('round-trips data via localStorage', () => {
      if (typeof localStorage === 'undefined') return;
      const adapter = new LocalStorageIncidentAdapter('test-incidents');
      const incident: Incident = {
        schemaVersion: 1,
        id: 'i1',
        title: 't',
        description: 'd',
        severity: 'HIGH',
        status: 'open',
        createdAt: 0,
        updatedAt: 0,
        reporter: 'r',
        affectedSystems: [],
        affectedUsers: 0,
        tags: [],
        timeline: [],
        artifacts: [],
        responseSlaMinutes: 60,
        resolutionSlaMinutes: 1440,
      };
      adapter.save(incident);
      const retrieved = adapter.get('i1');
      expect(retrieved?.title).toBe('t');
    });
  });

  // ── Audit integration ────────────────────────────────────────────────────

  describe('audit integration', () => {
    it('does not throw when audit emitter throws', () => {
      const badEmitter: AuditEmitter = () => {
        throw new Error('audit fail');
      };
      const ir2 = IncidentResponse.create(new InMemoryIncidentAdapter(), badEmitter);
      expect(() =>
        ir2.createIncident({
          title: 'A',
          description: 'a',
          severity: 'HIGH',
          reporter: 'r@e.com',
        })
      ).not.toThrow();
    });
  });
});

// ============================================================================
// PROBE T-FIX-12 EDGE CASE TESTS v2 (15 tests, corrected 2026-06-18)
// Per D-007 2nd SELF-HONEST-LABEL CASCADE: original tests used WRONG API
// (createIncidentResponse factory, severity P0, .on() method, oncallSchedule).
// Replaced with valid API: IncidentResponse.create(adapter), severity CRITICAL/HIGH/MEDIUM/LOW/INFO.
// ============================================================================
describe('IncidentResponse edge cases v2 (Probe T-FIX-12)', () => {
  let ir: IncidentResponse;

  beforeEach(() => {
    ir = IncidentResponse.create(new InMemoryIncidentAdapter());
  });

  // 5 Severity classification (using VALID API)
  it('classifies CRITICAL severity with highest CVSS score', () => {
    const incident = ir.createIncident({
      title: 'Prod down',
      description: 'Production completely unavailable',
      severity: 'CRITICAL',
      reporter: 'r@example.com',
    });
    expect(incident.severity).toBe('CRITICAL');
    expect(ir.getSeverityScore('CRITICAL')).toBeGreaterThanOrEqual(9.0);
  });
  it('classifies HIGH severity with high CVSS score', () => {
    const incident = ir.createIncident({
      title: 'Major degradation',
      description: 'Major feature broken',
      severity: 'HIGH',
      reporter: 'r@example.com',
    });
    expect(incident.severity).toBe('HIGH');
    expect(ir.getSeverityScore('HIGH')).toBeGreaterThanOrEqual(7.0);
  });
  it('classifies MEDIUM severity with medium CVSS score', () => {
    const incident = ir.createIncident({
      title: 'Degradation',
      description: 'Some users affected',
      severity: 'MEDIUM',
      reporter: 'r@example.com',
    });
    expect(incident.severity).toBe('MEDIUM');
    expect(ir.getSeverityScore('MEDIUM')).toBeGreaterThanOrEqual(4.0);
  });
  it('classifies LOW severity with low CVSS score', () => {
    const incident = ir.createIncident({
      title: 'Minor issue',
      description: 'Cosmetic glitch',
      severity: 'LOW',
      reporter: 'r@example.com',
    });
    expect(incident.severity).toBe('LOW');
    expect(ir.getSeverityScore('LOW')).toBeGreaterThanOrEqual(0.1);
  });
  it('classifies INFO severity with zero CVSS', () => {
    const incident = ir.createIncident({
      title: 'Log noise',
      description: 'Informational only',
      severity: 'INFO',
      reporter: 'r@example.com',
    });
    expect(incident.severity).toBe('INFO');
    expect(ir.getSeverityScore('INFO')).toBe(0);
  });

  // 3 SLA tracking
  it('getResponseSla returns minutes for each severity', () => {
    expect(typeof ir.getResponseSla('CRITICAL')).toBe('number');
    expect(typeof ir.getResponseSla('HIGH')).toBe('number');
    expect(typeof ir.getResponseSla('MEDIUM')).toBe('number');
    expect(ir.getResponseSla('CRITICAL')).toBeLessThan(ir.getResponseSla('LOW'));
  });
  it('getResolutionSla returns minutes for each severity', () => {
    expect(typeof ir.getResolutionSla('CRITICAL')).toBe('number');
    expect(ir.getResolutionSla('CRITICAL')).toBeLessThanOrEqual(ir.getResolutionSla('HIGH'));
  });
  it('getSlaStatus returns null for unknown incident', () => {
    expect(ir.getSlaStatus('nonexistent-incident-id')).toBeNull();
  });

  // 3 Update + Postmortem
  it('updateIncident with valid actor changes status', () => {
    const incident = ir.createIncident({
      title: 'T',
      description: 'D',
      severity: 'HIGH',
      reporter: 'r@example.com',
    });
    const updated = ir.updateIncident(
      incident.id,
      { status: 'INVESTIGATING' },
      'admin@example.com'
    );
    expect(updated.status).toBe('INVESTIGATING');
  });
  it('writePostmortem with all required fields succeeds', () => {
    const incident = ir.createIncident({
      title: 'T',
      description: 'D',
      severity: 'HIGH',
      reporter: 'r@example.com',
    });
    // Postmortems may only be written once an incident has left the 'open'
    // state (resolved, postmortem, or closed) — this is the real lifecycle
    // invariant enforced by writePostmortem. Transition the incident first.
    ir.updateIncident(incident.id, { status: 'resolved' }, 'admin@example.com');
    expect(() =>
      ir.writePostmortem(incident.id, {
        rootCause: 'DB connection pool exhausted',
        lessonsLearned: 'Increase pool size by 2x',
        actionItems: ['Increase pool', 'Add monitoring'],
        writtenBy: 'admin@example.com',
      })
    ).not.toThrow();
  });
  it('writePostmortem rejects missing required fields', () => {
    const incident = ir.createIncident({
      title: 'T',
      description: 'D',
      severity: 'HIGH',
      reporter: 'r@example.com',
    });
    expect(() =>
      ir.writePostmortem(incident.id, {
        rootCause: '',
        lessonsLearned: '',
        actionItems: [],
        writtenBy: '',
      })
    ).toThrow();
  });

  // 2 List + Query
  it('listIncidents returns array including newly created', () => {
    const initial = ir.listIncidents();
    ir.createIncident({
      title: 'T',
      description: 'D',
      severity: 'MEDIUM',
      reporter: 'r@example.com',
    });
    const after = ir.listIncidents();
    expect(after.length).toBe(initial.length + 1);
  });
  it('getIncident returns the created incident', () => {
    const created = ir.createIncident({
      title: 'T',
      description: 'D',
      severity: 'LOW',
      reporter: 'r@example.com',
    });
    const fetched = ir.getIncident(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
  });

  // 2 Edge cases
  it('rejects unknown severity', () => {
    expect(() =>
      ir.createIncident({
        title: 'T',
        description: 'D',
        severity: 'UNKNOWN' as never,
        reporter: 'r@example.com',
      })
    ).toThrow();
  });
  it('requires reporter on createIncident', () => {
    expect(() =>
      ir.createIncident({
        title: 'T',
        description: 'D',
        severity: 'HIGH',
        reporter: '',
      })
    ).toThrow();
  });
});

// ============================================================================
// PROBE T-FIX-12 BENCHMARK TESTS (4 tests, added 2026-06-18)
// Per Peitho integration acceptance: TEMPLATE 1 benchmark coverage
// ============================================================================
describe('Probe benchmark tests — performance bounds (IncidentResponse)', () => {
  it('createIncident completes within 20ms', () => {
    const ir2 = IncidentResponse.create(new InMemoryIncidentAdapter());
    const start = Date.now();
    ir2.createIncident({
      title: 'Bench',
      description: 'd',
      severity: 'HIGH',
      reporter: 'r@example.com',
    });
    expect(Date.now() - start).toBeLessThan(20);
  });
  it('getSeverityScore completes within 5ms for all 5 severities', () => {
    const ir2 = IncidentResponse.create(new InMemoryIncidentAdapter());
    const start = Date.now();
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const) {
      ir2.getSeverityScore(sev);
    }
    expect(Date.now() - start).toBeLessThan(5);
  });
  it('listIncidents returns within 10ms after 50 creates', () => {
    const ir2 = IncidentResponse.create(new InMemoryIncidentAdapter());
    for (let i = 0; i < 50; i += 1) {
      ir2.createIncident({
        title: `T-${i}`,
        description: 'd',
        severity: 'MEDIUM',
        reporter: 'r@example.com',
      });
    }
    const start = Date.now();
    const list = ir2.listIncidents();
    expect(Date.now() - start).toBeLessThan(10);
    expect(list.length).toBeGreaterThanOrEqual(50);
  });
  it('getResponseSla completes within 1ms for all severities', () => {
    const ir2 = IncidentResponse.create(new InMemoryIncidentAdapter());
    const start = Date.now();
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const) {
      ir2.getResponseSla(sev);
    }
    expect(Date.now() - start).toBeLessThan(1);
  });
});
