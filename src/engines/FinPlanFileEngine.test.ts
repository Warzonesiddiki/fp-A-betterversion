import { describe, it, expect, beforeEach } from 'vitest';
import { FinPlanFileEngine } from './FinPlanFileEngine';

describe('FinPlanFileEngine', () => {
  let engine: FinPlanFileEngine;

  beforeEach(() => {
    engine = new FinPlanFileEngine();
  });

  it('should initialize with no current path', () => {
    expect(engine.getCurrentPath()).toBeNull();
    expect(engine.getHasUnsavedChanges()).toBe(false);
  });

  it('should create a new file', async () => {
    const result = await engine.newFile('/test/model.finplan');
    expect(result.success).toBe(true);
    expect(engine.getCurrentPath()).toBe('/test/model.finplan');
    expect(engine.getHasUnsavedChanges()).toBe(false);
  });

  it('should open a file with data', async () => {
    const data = JSON.stringify({
      metadata: {
        name: 'Test',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        version: '1.0.0',
        author: '',
        description: '',
        sizeBytes: 0,
        path: null,
      },
      stores: { budget: { items: [] } },
      cubes: {},
      formulas: {},
      scenarios: {},
      reports: {},
      settings: {},
    });
    const result = await engine.openFile('/test/model.finplan', data);
    expect(result.success).toBe(true);
    expect(engine.getStoreData().budget).toEqual({ items: [] });
  });

  it('should save a file', async () => {
    await engine.newFile('/test/model.finplan');
    engine.setStoreData({ test: true });
    expect(engine.getHasUnsavedChanges()).toBe(true);
    const result = await engine.saveFile();
    expect(result.success).toBe(true);
    expect(engine.getHasUnsavedChanges()).toBe(false);
  });

  it('should save as a new file', async () => {
    await engine.newFile('/test/original.finplan');
    const result = await engine.saveFileAs('/test/copy.finplan');
    expect(result.success).toBe(true);
    expect(engine.getCurrentPath()).toBe('/test/copy.finplan');
  });

  it('should fail to save when no file is open', async () => {
    const result = await engine.saveFile();
    expect(result.success).toBe(false);
    expect(result.error).toBe('No file open');
  });

  it('should close a file', async () => {
    await engine.newFile('/test/model.finplan');
    engine.setStoreData({ test: true });
    await engine.closeFile();
    expect(engine.getCurrentPath()).toBeNull();
    expect(engine.getHasUnsavedChanges()).toBe(false);
    expect(engine.getStoreData()).toEqual({});
  });

  it('should track unsaved changes', async () => {
    await engine.newFile('/test/model.finplan');
    expect(engine.getHasUnsavedChanges()).toBe(false);
    engine.setStoreData({ test: true });
    expect(engine.getHasUnsavedChanges()).toBe(true);
    engine.setCubeData({ cube: true });
    expect(engine.getHasUnsavedChanges()).toBe(true);
  });

  it('should serialize and export', async () => {
    await engine.newFile('/test/model.finplan');
    engine.setStoreData({ budget: { items: [1, 2, 3] } });
    const json = engine.serialize();
    expect(json).toContain('budget');
    const exported = engine.exportToJson();
    expect(exported).toContain('budget');
  });

  it('should import from JSON', async () => {
    const json = JSON.stringify({
      metadata: {
        name: 'Import',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        version: '1.0.0',
        author: '',
        description: '',
        sizeBytes: 0,
        path: null,
      },
      stores: { imported: true },
      cubes: {},
      formulas: {},
      scenarios: {},
      reports: {},
      settings: {},
    });
    const result = engine.importFromJson(json);
    expect(result.success).toBe(true);
    expect(engine.getStoreData().imported).toBe(true);
  });

  it('should get file metadata', async () => {
    await engine.newFile('/test/model.finplan');
    const meta = engine.getFileMetadata();
    expect(meta.name).toBe('model');
    expect(meta.version).toBe('1.0.0');
  });
});
