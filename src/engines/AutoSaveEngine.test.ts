import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoSaveEngine } from './AutoSaveEngine';

describe('AutoSaveEngine', () => {
  let engine: AutoSaveEngine;

  beforeEach(() => {
    engine = new AutoSaveEngine({ intervalMs: 1000, maxAutoSaves: 3 });
  });

  it('should initialize with default config', () => {
    const config = engine.getConfig();
    expect(config.saveOnBlur).toBe(true);
    expect(config.saveOnClose).toBe(true);
    expect(config.maxAutoSaves).toBe(3);
  });

  it('should not be running initially', () => {
    expect(engine.isEngineRunning()).toBe(false);
  });

  it('should start and stop', () => {
    const callback = vi.fn().mockResolvedValue('data');
    engine.start(callback);
    expect(engine.isEngineRunning()).toBe(true);
    engine.stop();
    expect(engine.isEngineRunning()).toBe(false);
  });

  it('should perform manual save', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('test data'));
    engine.onAutoSave((entry) => {
      expect(entry.trigger).toBe('manual');
    });
    const entry = await engine.triggerManualSave();
    expect(entry).not.toBeNull();
    expect(entry!.trigger).toBe('manual');
    expect(entry!.sizeBytes).toBeGreaterThan(0);
  });

  it('should perform blur save', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    const entry = await engine.triggerBlurSave();
    expect(entry).not.toBeNull();
    expect(entry!.trigger).toBe('blur');
  });

  it('should perform close save', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    const entry = await engine.triggerCloseSave();
    expect(entry).not.toBeNull();
    expect(entry!.trigger).toBe('close');
  });

  it('should track entries', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    await engine.triggerManualSave();
    await engine.triggerManualSave();
    expect(engine.getEntries()).toHaveLength(2);
  });

  it('should prune old entries', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    for (let i = 0; i < 5; i++) {
      await engine.triggerManualSave();
    }
    expect(engine.getEntries()).toHaveLength(3); // maxAutoSaves = 3
  });

  it('should get latest entry', async () => {
    expect(engine.getLatestEntry()).toBeNull();
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    await engine.triggerManualSave();
    const latest = engine.getLatestEntry();
    expect(latest).not.toBeNull();
    expect(latest!.trigger).toBe('manual');
  });

  it('should remove entry', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    const entry = await engine.triggerManualSave();
    expect(engine.removeEntry(entry!.id)).toBe(true);
    expect(engine.getEntries()).toHaveLength(0);
  });

  it('should clear entries', async () => {
    engine.setSaveCallback(vi.fn().mockResolvedValue('data'));
    await engine.triggerManualSave();
    await engine.triggerManualSave();
    engine.clearEntries();
    expect(engine.getEntries()).toHaveLength(0);
  });

  it('should update config', () => {
    engine.updateConfig({ intervalMs: 2000, saveOnBlur: false });
    const config = engine.getConfig();
    expect(config.intervalMs).toBe(2000);
    expect(config.saveOnBlur).toBe(false);
  });

  it('should return null when callback returns null', async () => {
    const callback = vi.fn().mockResolvedValue(null);
    engine.start(callback);
    const entry = await engine.triggerManualSave();
    expect(entry).toBeNull();
  });
});
