/**
 * ThreatModel — PATCH 10 tests (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * Comprehensive test coverage for STRIDE/DREAD threat modeling service.
 * 48 tests across 12 test groups.
 *
 * @module services/ThreatModel.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ThreatModel,
  THREAT_MODEL_CONSTANTS,
  ThreatModelError,
  computeDreadMean,
  isValidDreadScore,
  _resetThreatModelCounters,
  type CreateThreatInput,
  type CreateControlInput,
  type DreadScore,
  type ThreatModelAuditEvent,
} from './ThreatModel';

// ── Test fixtures ────────────────────────────────────────────────────────────

const sampleDreadHigh: DreadScore = {
  damage: 9,
  reproducibility: 8,
  exploitability: 7,
  affectedUsers: 9,
  discoverability: 8,
};

const sampleDreadMedium: DreadScore = {
  damage: 6,
  reproducibility: 5,
  exploitability: 5,
  affectedUsers: 4,
  discoverability: 5,
};

const sampleDreadLow: DreadScore = {
  damage: 2,
  reproducibility: 2,
  exploitability: 2,
  affectedUsers: 2,
  discoverability: 2,
};

const sampleThreat: CreateThreatInput = {
  title: 'JWT Token Forgery',
  description: 'Attacker forges JWT token to impersonate user',
  category: 'S',
  asset: 'jwt-token',
  attackVector: 'Algorithm confusion attack (alg=none) or weak secret',
  preconditions: ['Access to JWT secret or none-alg support'],
  cweRef: 'CWE-345',
  dreadScore: sampleDreadHigh,
};

const sampleControl: CreateControlInput = {
  name: 'JWT RS256 Signing',
  type: 'PREVENTIVE',
  description: 'Use RS256 with 2048-bit key, reject alg=none',
  implementation: 'src/services/KeyManager.ts:signJwt',
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ThreatModel — PATCH 10 (Hephaestus 2026-06-16)', () => {
  beforeEach(() => {
    ThreatModel.resetInstance();
    _resetThreatModelCounters();
  });

  // ── 1. Constants ────────────────────────────────────────────────────────

  describe('1. THREAT_MODEL_CONSTANTS', () => {
    it('1.1 has correct schema version', () => {
      expect(THREAT_MODEL_CONSTANTS.SCHEMA_VERSION).toBe(1);
    });

    it('1.2 has DREAD thresholds matching spec', () => {
      expect(THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.CRITICAL).toBe(8.0);
      expect(THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.HIGH).toBe(6.0);
      expect(THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.MEDIUM).toBe(4.0);
      expect(THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.LOW).toBe(0.0);
    });

    it('1.3 has all 6 STRIDE category labels', () => {
      expect(THREAT_MODEL_CONSTANTS.STRIDE_LABELS.S).toBe('Spoofing');
      expect(THREAT_MODEL_CONSTANTS.STRIDE_LABELS.T).toBe('Tampering');
      expect(THREAT_MODEL_CONSTANTS.STRIDE_LABELS.R).toBe('Repudiation');
      expect(THREAT_MODEL_CONSTANTS.STRIDE_LABELS.I).toBe('Information Disclosure');
      expect(THREAT_MODEL_CONSTANTS.STRIDE_LABELS.D).toBe('Denial of Service');
      expect(THREAT_MODEL_CONSTANTS.STRIDE_LABELS.E).toBe('Elevation of Privilege');
    });

    it('1.4 has FinPlan Pro asset taxonomy', () => {
      expect(THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS).toContain('auth-session');
      expect(THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS).toContain('jwt-token');
      expect(THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS).toContain('financial-data');
      expect(THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS).toContain('cube-store');
      expect(THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS).toContain('encryption-key');
      expect(THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS.length).toBe(12);
    });

    it('1.5 has max limits for DoS prevention', () => {
      expect(THREAT_MODEL_CONSTANTS.MAX_THREATS).toBe(500);
      expect(THREAT_MODEL_CONSTANTS.MAX_CONTROLS).toBe(500);
      expect(THREAT_MODEL_CONSTANTS.MAX_MITIGATIONS_PER_CONTROL).toBe(100);
      expect(THREAT_MODEL_CONSTANTS.MAX_CONTROLS_PER_THREAT).toBe(10);
    });
  });

  // ── 2. computeDreadMean helper ─────────────────────────────────────────

  describe('2. computeDreadMean', () => {
    it('2.1 computes mean correctly for high-risk DREAD', () => {
      const result = computeDreadMean(sampleDreadHigh);
      // (9+8+7+9+8)/5 = 41/5 = 8.2
      expect(result.mean).toBe(8.2);
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('2.2 computes mean correctly for medium-risk DREAD', () => {
      const result = computeDreadMean(sampleDreadMedium);
      // (6+5+5+4+5)/5 = 25/5 = 5.0
      expect(result.mean).toBe(5.0);
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('2.3 computes mean correctly for low-risk DREAD', () => {
      const result = computeDreadMean(sampleDreadLow);
      // (2+2+2+2+2)/5 = 10/5 = 2.0
      expect(result.mean).toBe(2.0);
      expect(result.riskLevel).toBe('LOW');
    });

    it('2.4 boundary: exactly 8.0 → CRITICAL', () => {
      const score: DreadScore = { damage: 8, reproducibility: 8, exploitability: 8, affectedUsers: 8, discoverability: 8 };
      expect(computeDreadMean(score).riskLevel).toBe('CRITICAL');
    });

    it('2.5 boundary: exactly 6.0 → HIGH', () => {
      const score: DreadScore = { damage: 6, reproducibility: 6, exploitability: 6, affectedUsers: 6, discoverability: 6 };
      expect(computeDreadMean(score).riskLevel).toBe('HIGH');
    });

    it('2.6 boundary: exactly 4.0 → MEDIUM', () => {
      const score: DreadScore = { damage: 4, reproducibility: 4, exploitability: 4, affectedUsers: 4, discoverability: 4 };
      expect(computeDreadMean(score).riskLevel).toBe('MEDIUM');
    });
  });

  // ── 3. isValidDreadScore ───────────────────────────────────────────────

  describe('3. isValidDreadScore', () => {
    it('3.1 valid: all dimensions 1-10 integers', () => {
      expect(isValidDreadScore(sampleDreadHigh)).toBe(true);
      expect(isValidDreadScore(sampleDreadMedium)).toBe(true);
      expect(isValidDreadScore(sampleDreadLow)).toBe(true);
    });

    it('3.2 invalid: dimension below 1', () => {
      expect(isValidDreadScore({ ...sampleDreadHigh, damage: 0 })).toBe(false);
    });

    it('3.3 invalid: dimension above 10', () => {
      expect(isValidDreadScore({ ...sampleDreadHigh, damage: 11 })).toBe(false);
    });

    it('3.4 invalid: non-integer', () => {
      expect(isValidDreadScore({ ...sampleDreadHigh, damage: 5.5 })).toBe(false);
    });

    it('3.5 invalid: NaN', () => {
      expect(isValidDreadScore({ ...sampleDreadHigh, damage: NaN })).toBe(false);
    });

    it('3.6 invalid: missing dimension', () => {
      const partial = { damage: 5, reproducibility: 5, exploitability: 5, affectedUsers: 5 } as unknown as DreadScore;
      expect(isValidDreadScore(partial)).toBe(false);
    });
  });

  // ── 4. Singleton & DI ──────────────────────────────────────────────────

  describe('4. Singleton & dependency injection', () => {
    it('4.1 getInstance returns singleton', () => {
      const a = ThreatModel.getInstance();
      const b = ThreatModel.getInstance();
      expect(a).toBe(b);
    });

    it('4.2 create returns new instance (DI)', () => {
      const a = ThreatModel.create();
      const b = ThreatModel.create();
      expect(a).not.toBe(b);
    });

    it('4.3 resetInstance clears singleton', () => {
      const a = ThreatModel.getInstance();
      a.addThreat(sampleThreat);
      ThreatModel.resetInstance();
      const b = ThreatModel.getInstance();
      expect(b.listThreats().length).toBe(0);
    });

    it('4.4 create accepts audit emitter', () => {
      const events: ThreatModelAuditEvent[] = [];
      const tm = ThreatModel.create((e) => events.push(e));
      tm.addThreat(sampleThreat);
      tm.addControl(sampleControl);
      expect(events.length).toBe(2);
      expect(events[0].type).toBe('THREAT_ADDED');
      expect(events[1].type).toBe('CONTROL_ADDED');
    });

    it('4.5 model metadata can be set', () => {
      const tm = ThreatModel.create();
      tm.setModelMetadata('FinPlan Pro v1.0.0', '1.0.0');
      expect(tm.getModelName()).toBe('FinPlan Pro v1.0.0');
      expect(tm.getModelVersion()).toBe('1.0.0');
    });
  });

  // ── 5. addThreat ───────────────────────────────────────────────────────

  describe('5. addThreat', () => {
    it('5.1 adds threat with auto-generated ID', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      expect(t.id).toMatch(/^THR-\d{5}$/);
      expect(t.id).toBe('THR-00001');
    });

    it('5.2 adds threat with explicit ID', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat({ ...sampleThreat, id: 'THR-CUSTOM' });
      expect(t.id).toBe('THR-CUSTOM');
    });

    it('5.3 computes DREAD mean and risk level on creation', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      expect(t.dreadMean).toBe(8.2);
      expect(t.riskLevel).toBe('CRITICAL');
    });

    it('5.4 sets timestamps', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      expect(t.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(t.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(t.createdAt).toBe(t.updatedAt);
    });

    it('5.5 default status is OPEN', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      expect(t.status).toBe('OPEN');
    });

    it('5.6 throws on duplicate ID', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, id: 'T1' });
      expect(() => tm.addThreat({ ...sampleThreat, id: 'T1' })).toThrow(ThreatModelError);
      expect(() => tm.addThreat({ ...sampleThreat, id: 'T1' })).toThrow(/already exists/);
    });

    it('5.7 throws on invalid DREAD score', () => {
      const tm = ThreatModel.create();
      expect(() => tm.addThreat({ ...sampleThreat, dreadScore: { ...sampleDreadHigh, damage: 15 } })).toThrow(/DREAD/);
    });

    it('5.8 throws on invalid category', () => {
      const tm = ThreatModel.create();
      expect(() => tm.addThreat({ ...sampleThreat, category: 'X' as unknown as 'S' })).toThrow(/category/i);
    });
  });

  // ── 6. listThreats / getThreat ─────────────────────────────────────────

  describe('6. listThreats / getThreat', () => {
    it('6.1 listThreats returns all threats sorted by DREAD desc', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, title: 'Low', dreadScore: sampleDreadLow });
      tm.addThreat({ ...sampleThreat, title: 'High', dreadScore: sampleDreadHigh });
      tm.addThreat({ ...sampleThreat, title: 'Medium', dreadScore: sampleDreadMedium });
      const list = tm.listThreats();
      expect(list[0].title).toBe('High');
      expect(list[1].title).toBe('Medium');
      expect(list[2].title).toBe('Low');
    });

    it('6.2 listThreatsByCategory filters correctly', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, category: 'S' });
      tm.addThreat({ ...sampleThreat, category: 'T' });
      tm.addThreat({ ...sampleThreat, category: 'S' });
      const sThreats = tm.listThreatsByCategory('S');
      expect(sThreats.length).toBe(2);
      const tThreats = tm.listThreatsByCategory('T');
      expect(tThreats.length).toBe(1);
    });

    it('6.3 listThreatsByRiskLevel filters correctly', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, dreadScore: sampleDreadHigh });
      tm.addThreat({ ...sampleThreat, dreadScore: sampleDreadMedium });
      tm.addThreat({ ...sampleThreat, dreadScore: sampleDreadLow });
      const critical = tm.listThreatsByRiskLevel('CRITICAL');
      expect(critical.length).toBe(1);
      const medium = tm.listThreatsByRiskLevel('MEDIUM');
      expect(medium.length).toBe(1);
    });

    it('6.4 listThreatsByAsset filters correctly', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, asset: 'jwt-token' });
      tm.addThreat({ ...sampleThreat, asset: 'cube-store' });
      tm.addThreat({ ...sampleThreat, asset: 'jwt-token' });
      const jwt = tm.listThreatsByAsset('jwt-token');
      expect(jwt.length).toBe(2);
    });

    it('6.5 getThreat returns undefined for unknown ID', () => {
      const tm = ThreatModel.create();
      expect(tm.getThreat('UNKNOWN')).toBeUndefined();
    });
  });

  // ── 7. updateThreatStatus / deleteThreat ──────────────────────────────

  describe('7. updateThreatStatus / deleteThreat', () => {
    it('7.1 updateThreatStatus changes status', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      tm.updateThreatStatus(t.id, 'ACCEPTED');
      expect(tm.getThreat(t.id)!.status).toBe('ACCEPTED');
    });

    it('7.2 updateThreatStatus throws for unknown ID', () => {
      const tm = ThreatModel.create();
      expect(() => tm.updateThreatStatus('UNKNOWN', 'OPEN')).toThrow(/not found/);
    });

    it('7.3 deleteThreat removes from map', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      tm.deleteThreat(t.id);
      expect(tm.getThreat(t.id)).toBeUndefined();
    });

    it('7.4 deleteThreat throws for unknown ID', () => {
      const tm = ThreatModel.create();
      expect(() => tm.deleteThreat('UNKNOWN')).toThrow(/not found/);
    });
  });

  // ── 8. addControl / listControls ───────────────────────────────────────

  describe('8. addControl / listControls', () => {
    it('8.1 adds control with auto-generated ID', () => {
      const tm = ThreatModel.create();
      const c = tm.addControl(sampleControl);
      expect(c.id).toMatch(/^CTL-\d{5}$/);
      expect(c.id).toBe('CTL-00001');
    });

    it('8.2 adds control with explicit ID', () => {
      const tm = ThreatModel.create();
      const c = tm.addControl({ ...sampleControl, id: 'CTL-CUSTOM' });
      expect(c.id).toBe('CTL-CUSTOM');
    });

    it('8.3 throws on duplicate control ID', () => {
      const tm = ThreatModel.create();
      tm.addControl({ ...sampleControl, id: 'C1' });
      expect(() => tm.addControl({ ...sampleControl, id: 'C1' })).toThrow(/already exists/);
    });

    it('8.4 throws on invalid control type', () => {
      const tm = ThreatModel.create();
      expect(() => tm.addControl({ ...sampleControl, type: 'INVALID' as unknown as 'PREVENTIVE' })).toThrow(/type/i);
    });

    it('8.5 listControls returns sorted by ID', () => {
      const tm = ThreatModel.create();
      tm.addControl({ ...sampleControl, id: 'C3' });
      tm.addControl({ ...sampleControl, id: 'C1' });
      tm.addControl({ ...sampleControl, id: 'C2' });
      const list = tm.listControls();
      expect(list.map((c) => c.id)).toEqual(['C1', 'C2', 'C3']);
    });

    it('8.6 deleteControl removes from map', () => {
      const tm = ThreatModel.create();
      const c = tm.addControl(sampleControl);
      tm.deleteControl(c.id);
      expect(tm.getControl(c.id)).toBeUndefined();
    });

    it('8.7 deleteControl throws for unknown ID', () => {
      const tm = ThreatModel.create();
      expect(() => tm.deleteControl('UNKNOWN')).toThrow(/not found/);
    });
  });

  // ── 9. linkControl / unlinkControl ─────────────────────────────────────

  describe('9. linkControl / unlinkControl', () => {
    it('9.1 linkControl connects control to threat', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t.id);
      expect(tm.getThreat(t.id)!.mitigatedBy).toContain(c.id);
      expect(tm.getControl(c.id)!.mitigates).toContain(t.id);
    });

    it('9.2 linkControl is idempotent', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t.id);
      tm.linkControl(c.id, t.id);
      tm.linkControl(c.id, t.id);
      expect(tm.getThreat(t.id)!.mitigatedBy.length).toBe(1);
    });

    it('9.3 linking a control changes threat status to MITIGATED', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t.id);
      expect(tm.getThreat(t.id)!.status).toBe('MITIGATED');
    });

    it('9.4 unlinkControl removes the link', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t.id);
      tm.unlinkControl(c.id, t.id);
      expect(tm.getThreat(t.id)!.mitigatedBy).not.toContain(c.id);
      expect(tm.getControl(c.id)!.mitigates).not.toContain(t.id);
    });

    it('9.5 unlinking the last control reverts status to OPEN', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t.id);
      tm.unlinkControl(c.id, t.id);
      expect(tm.getThreat(t.id)!.status).toBe('OPEN');
    });

    it('9.6 linkControl throws for unknown control', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      expect(() => tm.linkControl('UNKNOWN', t.id)).toThrow(/Control/);
    });

    it('9.7 linkControl throws for unknown threat', () => {
      const tm = ThreatModel.create();
      const c = tm.addControl(sampleControl);
      expect(() => tm.linkControl(c.id, 'UNKNOWN')).toThrow(/Threat/);
    });

    it('9.8 deleting a threat removes it from all controls', () => {
      const tm = ThreatModel.create();
      const t1 = tm.addThreat(sampleThreat);
      const t2 = tm.addThreat({ ...sampleThreat, title: 'T2' });
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t1.id);
      tm.linkControl(c.id, t2.id);
      tm.deleteThreat(t1.id);
      expect(tm.getControl(c.id)!.mitigates).not.toContain(t1.id);
      expect(tm.getControl(c.id)!.mitigates).toContain(t2.id);
    });
  });

  // ── 10. gapAnalysis ────────────────────────────────────────────────────

  describe('10. gapAnalysis', () => {
    it('10.1 identifies unmitigated threats', () => {
      const tm = ThreatModel.create();
      const t1 = tm.addThreat(sampleThreat);
      const t2 = tm.addThreat({ ...sampleThreat, title: 'T2' });
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t1.id);
      const gap = tm.gapAnalysis();
      expect(gap.unmitigatedThreats.length).toBe(1);
      expect(gap.unmitigatedThreats[0].id).toBe(t2.id);
    });

    it('10.2 identifies orphan controls', () => {
      const tm = ThreatModel.create();
      tm.addControl(sampleControl);
      const gap = tm.gapAnalysis();
      expect(gap.orphanControls.length).toBe(1);
    });

    it('10.3 identifies single-defense threats', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat);
      const c1 = tm.addControl({ ...sampleControl, name: 'C1' });
      const c2 = tm.addControl({ ...sampleControl, name: 'C2' });
      tm.linkControl(c1.id, t.id);
      // t has only c1 → single defense
      const gap1 = tm.gapAnalysis();
      expect(gap1.singleDefenseThreats.length).toBe(1);
      tm.linkControl(c2.id, t.id);
      const gap2 = tm.gapAnalysis();
      expect(gap2.singleDefenseThreats.length).toBe(0);
    });

    it('10.4 riskByCategory aggregates correctly', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, category: 'S', dreadScore: sampleDreadHigh });
      tm.addThreat({ ...sampleThreat, category: 'S', dreadScore: sampleDreadLow });
      tm.addThreat({ ...sampleThreat, category: 'T', dreadScore: sampleDreadMedium });
      const gap = tm.gapAnalysis();
      expect(gap.riskByCategory.S.count).toBe(2);
      expect(gap.riskByCategory.S.meanDread).toBeCloseTo((8.2 + 2.0) / 2, 1);
      expect(gap.riskByCategory.S.maxDread).toBe(8.2);
      expect(gap.riskByCategory.T.count).toBe(1);
      expect(gap.riskByCategory.R.count).toBe(0);
    });

    it('10.5 riskByAsset aggregates correctly', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, asset: 'jwt-token', dreadScore: sampleDreadHigh });
      tm.addThreat({ ...sampleThreat, asset: 'jwt-token', dreadScore: sampleDreadLow });
      tm.addThreat({ ...sampleThreat, asset: 'cube-store', dreadScore: sampleDreadMedium });
      const gap = tm.gapAnalysis();
      expect(gap.riskByAsset['jwt-token'].count).toBe(2);
      expect(gap.riskByAsset['cube-store'].count).toBe(1);
    });

    it('10.6 coverage is 0 with no controls, 1 with all mitigated', () => {
      const tm1 = ThreatModel.create();
      tm1.addThreat(sampleThreat);
      expect(tm1.gapAnalysis().coverage).toBe(0);

      const tm2 = ThreatModel.create();
      const t = tm2.addThreat(sampleThreat);
      const c = tm2.addControl(sampleControl);
      tm2.linkControl(c.id, t.id);
      expect(tm2.gapAnalysis().coverage).toBe(1);
    });

    it('10.7 meanResidualRisk computed across all threats', () => {
      const tm = ThreatModel.create();
      tm.addThreat({ ...sampleThreat, dreadScore: sampleDreadHigh });
      tm.addThreat({ ...sampleThreat, dreadScore: sampleDreadLow });
      const gap = tm.gapAnalysis();
      expect(gap.meanResidualRisk).toBeCloseTo((8.2 + 2.0) / 2, 1);
    });

    it('10.8 empty model returns zero coverage and 1.0', () => {
      const tm = ThreatModel.create();
      const gap = tm.gapAnalysis();
      expect(gap.totalThreats).toBe(0);
      expect(gap.coverage).toBe(1.0);
      expect(gap.meanResidualRisk).toBe(0);
    });
  });

  // ── 11. export / toJSON / toMarkdown ───────────────────────────────────

  describe('11. export / toJSON / toMarkdown', () => {
    it('11.1 toJSON returns valid JSON with schema version', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const json = JSON.parse(tm.toJSON());
      expect(json.schemaVersion).toBe(THREAT_MODEL_CONSTANTS.SCHEMA_VERSION);
      expect(json.threats.length).toBe(1);
      expect(json.controls.length).toBe(0);
    });

    it('11.2 toMarkdown includes threats table', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const md = tm.toMarkdown(false, false);
      expect(md).toContain('# Threat Model Report');
      expect(md).toContain('## Threats');
      expect(md).toContain('JWT Token Forgery');
    });

    it('11.3 toMarkdown includes DREAD breakdown when requested', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const md = tm.toMarkdown(false, true);
      expect(md).toContain('### DREAD Breakdown');
    });

    it('11.4 toMarkdown includes gap analysis when requested', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const md = tm.toMarkdown(true, false);
      expect(md).toContain('## Gap Analysis');
      expect(md).toContain('Mitigation coverage');
    });

    it('11.5 export with includeJson only', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const result = tm.export({ includeJson: true, includeMarkdown: false, includeGapAnalysis: false, includeDreadBreakdown: false });
      expect(result.json).toBeDefined();
      expect(result.markdown).toBeUndefined();
    });

    it('11.6 export with includeMarkdown only', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const result = tm.export({ includeJson: false, includeMarkdown: true, includeGapAnalysis: false, includeDreadBreakdown: false });
      expect(result.json).toBeUndefined();
      expect(result.markdown).toBeDefined();
    });

    it('11.7 export with both', () => {
      const tm = ThreatModel.create();
      tm.addThreat(sampleThreat);
      const result = tm.export({ includeJson: true, includeMarkdown: true, includeGapAnalysis: true, includeDreadBreakdown: true });
      expect(result.json).toBeDefined();
      expect(result.markdown).toBeDefined();
    });

    it('11.8 export with neither throws', () => {
      const tm = ThreatModel.create();
      expect(() => tm.export({ includeJson: false, includeMarkdown: false, includeGapAnalysis: false, includeDreadBreakdown: false })).toThrow(/include/);
    });

    it('11.9 toJSON includes model metadata', () => {
      const tm = ThreatModel.create();
      tm.setModelMetadata('FinPlan Pro', '1.0.0');
      tm.addThreat(sampleThreat);
      const json = JSON.parse(tm.toJSON());
      expect(json.modelName).toBe('FinPlan Pro');
      expect(json.modelVersion).toBe('1.0.0');
    });
  });

  // ── 12. Integration scenarios ──────────────────────────────────────────

  describe('12. Integration scenarios (5th-ICP verdict)', () => {
    it('12.1 FinPlan Pro v1.0.0 full STRIDE model — 24 threats, 18 controls', () => {
      const tm = ThreatModel.create();
      tm.setModelMetadata('FinPlan Pro v1.0.0', '1.0.0');
      // 4 threats per STRIDE category = 24 threats
      const categories: ('S' | 'T' | 'R' | 'I' | 'D' | 'E')[] = ['S', 'T', 'R', 'I', 'D', 'E'];
      const assets = THREAT_MODEL_CONSTANTS.DEFAULT_ASSETS;
      for (const cat of categories) {
        for (let i = 0; i < 4; i++) {
          tm.addThreat({
            title: `${THREAT_MODEL_CONSTANTS.STRIDE_LABELS[cat]} threat #${i + 1}`,
            description: `Test threat for ${cat} on ${assets[i]}`,
            category: cat,
            asset: assets[i],
            attackVector: `Vector ${i + 1}`,
            dreadScore: {
              damage: 5 + i,
              reproducibility: 5 + i,
              exploitability: 5 + i,
              affectedUsers: 5 + i,
              discoverability: 5 + i,
            },
          });
        }
      }
      // 3 controls per category = 18 controls
      for (const cat of categories) {
        for (let i = 0; i < 3; i++) {
          tm.addControl({
            name: `${cat}-Control-${i + 1}`,
            type: 'PREVENTIVE',
            description: `Control ${i + 1} for ${cat}`,
            implementation: `src/${cat}${i}.ts`,
          });
        }
      }
      // Link each threat to one control
      const allThreats = tm.listThreats();
      const allControls = tm.listControls();
      for (let i = 0; i < allThreats.length; i++) {
        tm.linkControl(allControls[i % allControls.length].id, allThreats[i].id);
      }
      const gap = tm.gapAnalysis();
      expect(gap.totalThreats).toBe(24);
      expect(gap.totalControls).toBe(18);
      expect(gap.totalMitigated).toBe(24);
      expect(gap.coverage).toBe(1.0);
      expect(gap.unmitigatedThreats.length).toBe(0);
    });

    it('12.2 export full report with all sections', () => {
      const tm = ThreatModel.create();
      tm.setModelMetadata('FinPlan Pro v1.0.0', '1.0.0');
      // Add a few threats and controls
      const t1 = tm.addThreat({ ...sampleThreat, title: 'T1' });
      const t2 = tm.addThreat({ ...sampleThreat, title: 'T2', category: 'T' });
      const c1 = tm.addControl(sampleControl);
      const c2 = tm.addControl({ ...sampleControl, name: 'C2' });
      tm.linkControl(c1.id, t1.id);
      // t2 is unmitigated
      const result = tm.export({ includeJson: true, includeMarkdown: true, includeGapAnalysis: true, includeDreadBreakdown: true });
      expect(result.json).toBeDefined();
      const md = result.markdown!;
      expect(md).toContain('## Threats');
      expect(md).toContain('### DREAD Breakdown');
      expect(md).toContain('## Gap Analysis');
      expect(md).toContain('### Unmitigated Threats');
      expect(md).toContain(t2.id);
    });

    it('12.3 audit emitter receives all lifecycle events', () => {
      const events: ThreatModelAuditEvent[] = [];
      const tm = ThreatModel.create((e) => events.push(e));
      const t = tm.addThreat(sampleThreat);
      const c = tm.addControl(sampleControl);
      tm.linkControl(c.id, t.id);
      tm.updateThreatStatus(t.id, 'ACCEPTED');
      tm.unlinkControl(c.id, t.id);
      tm.deleteControl(c.id);
      tm.deleteThreat(t.id);
      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain('THREAT_ADDED');
      expect(eventTypes).toContain('CONTROL_ADDED');
      expect(eventTypes).toContain('CONTROL_LINKED');
      expect(eventTypes).toContain('THREAT_STATUS_UPDATED');
      expect(eventTypes).toContain('CONTROL_UNLINKED');
      expect(eventTypes).toContain('CONTROL_DELETED');
      expect(eventTypes).toContain('THREAT_DELETED');
    });

    it('12.4 threat with all CRITICAL DREAD and no control is in unmitigated threats', () => {
      const tm = ThreatModel.create();
      const t = tm.addThreat(sampleThreat); // CRITICAL DREAD
      const gap = tm.gapAnalysis();
      expect(gap.unmitigatedThreats.length).toBe(1);
      expect(gap.unmitigatedThreats[0].id).toBe(t.id);
      expect(gap.unmitigatedThreats[0].riskLevel).toBe('CRITICAL');
    });
  });
});
