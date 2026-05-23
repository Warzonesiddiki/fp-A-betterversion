import { describe, it, expect, beforeEach } from 'vitest';
import { CrashRecoveryEngine } from './CrashRecoveryEngine';

describe('CrashRecoveryEngine', () => {
  let engine: CrashRecoveryEngine;

  beforeEach(() => {
    engine = new CrashRecoveryEngine();
  });

  it('should initialize with no candidates', () => {
    expect(engine.hasCandidates()).toBe(false);
    expect(engine.getCandidateCount()).toBe(0);
  });

  it('should add a candidate', () => {
    const candidate = engine.addCandidate({
      path: '/tmp/autosave.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 1024,
      originalPath: '/docs/model.finplan',
      data: '{"stores": {}}',
    });
    expect(candidate.id).toBeDefined();
    expect(engine.hasCandidates()).toBe(true);
    expect(engine.getCandidateCount()).toBe(1);
  });

  it('should get candidates', () => {
    engine.addCandidate({
      path: '/tmp/a.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 100,
      originalPath: null,
      data: '{}',
    });
    engine.addCandidate({
      path: '/tmp/b.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 200,
      originalPath: null,
      data: '{}',
    });
    expect(engine.getCandidates()).toHaveLength(2);
  });

  it('should recover a candidate', async () => {
    const candidate = engine.addCandidate({
      path: '/tmp/autosave.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 1024,
      originalPath: '/docs/model.finplan',
      data: '{}',
    });
    const result = await engine.recover(candidate.id);
    expect(result.success).toBe(true);
    expect(result.recoveredPath).toBe('/docs/model.finplan');
    expect(engine.isRecovered(candidate.id)).toBe(true);
  });

  it('should not show recovered candidates', async () => {
    const candidate = engine.addCandidate({
      path: '/tmp/autosave.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 1024,
      originalPath: null,
      data: '{}',
    });
    await engine.recover(candidate.id);
    expect(engine.getCandidates()).toHaveLength(0);
    expect(engine.getCandidateCount()).toBe(0);
  });

  it('should fail to recover non-existent candidate', async () => {
    const result = await engine.recover('non-existent');
    expect(result.success).toBe(false);
  });

  it('should discard a candidate', () => {
    const candidate = engine.addCandidate({
      path: '/tmp/a.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 100,
      originalPath: null,
      data: '{}',
    });
    expect(engine.discard(candidate.id)).toBe(true);
    expect(engine.hasCandidates()).toBe(false);
  });

  it('should discard all candidates', () => {
    engine.addCandidate({
      path: '/tmp/a.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 100,
      originalPath: null,
      data: '{}',
    });
    engine.addCandidate({
      path: '/tmp/b.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 200,
      originalPath: null,
      data: '{}',
    });
    engine.discardAll();
    expect(engine.hasCandidates()).toBe(false);
  });

  it('should recover all candidates', async () => {
    engine.addCandidate({
      path: '/tmp/a.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 100,
      originalPath: '/a.finplan',
      data: '{}',
    });
    engine.addCandidate({
      path: '/tmp/b.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 200,
      originalPath: '/b.finplan',
      data: '{}',
    });
    const results = await engine.recoverAll();
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(engine.getRecoveredCount()).toBe(2);
  });

  it('should serialize and deserialize', () => {
    engine.addCandidate({
      path: '/tmp/a.finplan',
      timestamp: new Date().toISOString(),
      sizeBytes: 100,
      originalPath: null,
      data: '{}',
    });
    const json = engine.serialize();
    const newEngine = new CrashRecoveryEngine();
    newEngine.deserialize(json);
    expect(newEngine.getCandidateCount()).toBe(1);
  });
});
