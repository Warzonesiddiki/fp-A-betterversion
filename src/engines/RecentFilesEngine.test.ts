import { describe, it, expect, beforeEach } from 'vitest';
import { RecentFilesEngine } from './RecentFilesEngine';

describe('RecentFilesEngine', () => {
  let engine: RecentFilesEngine;

  beforeEach(() => {
    engine = new RecentFilesEngine({ maxEntries: 5 });
  });

  it('should initialize with no files', () => {
    expect(engine.getFileCount()).toBe(0);
    expect(engine.getFiles()).toEqual([]);
  });

  it('should add a file', () => {
    const file = engine.addFile('/docs/model.finplan', 'model', 1024);
    expect(file.path).toBe('/docs/model.finplan');
    expect(file.name).toBe('model');
    expect(file.openCount).toBe(1);
    expect(engine.getFileCount()).toBe(1);
  });

  it('should increment open count for existing file', () => {
    engine.addFile('/docs/model.finplan', 'model', 1024);
    engine.addFile('/docs/model.finplan', 'model', 1024);
    const file = engine.getFile('/docs/model.finplan');
    expect(file!.openCount).toBe(2);
    expect(engine.getFileCount()).toBe(1);
  });

  it('should move re-opened file to top', () => {
    engine.addFile('/a.finplan', 'A');
    engine.addFile('/b.finplan', 'B');
    // Small delay to ensure different timestamps
    const file = engine.getFile('/a.finplan');
    if (file) file.lastOpened = new Date(Date.now() + 1000).toISOString();
    engine.addFile('/a.finplan', 'A');
    const files = engine.getFiles();
    expect(files![0]!.path).toBe('/a.finplan');
  });

  it('should remove a file', () => {
    engine.addFile('/a.finplan', 'A');
    expect(engine.removeFile('/a.finplan')).toBe(true);
    expect(engine.getFileCount()).toBe(0);
  });

  it('should return false when removing non-existent file', () => {
    expect(engine.removeFile('/nonexistent.finplan')).toBe(false);
  });

  it('should pin and unpin files', () => {
    engine.addFile('/a.finplan', 'A');
    engine.pin('/a.finplan');
    expect(engine.getPinnedFiles()).toHaveLength(1);
    engine.unpin('/a.finplan');
    expect(engine.getPinnedFiles()).toHaveLength(0);
  });

  it('should toggle pin', () => {
    engine.addFile('/a.finplan', 'A');
    expect(engine.togglePin('/a.finplan')).toBe(true);
    expect(engine.togglePin('/a.finplan')).toBe(false);
  });

  it('should sort pinned files first', () => {
    engine.addFile('/a.finplan', 'A');
    engine.addFile('/b.finplan', 'B');
    engine.pin('/b.finplan');
    const files = engine.getFiles();
    expect(files![0]!.path).toBe('/b.finplan');
  });

  it('should prune to max entries', () => {
    for (let i = 0; i < 10; i++) {
      engine.addFile(`/file${i}.finplan`, `file${i}`);
    }
    expect(engine.getFileCount()).toBe(5);
  });

  it('should not prune pinned files', () => {
    engine.addFile('/pinned.finplan', 'pinned');
    engine.pin('/pinned.finplan');
    for (let i = 0; i < 10; i++) {
      engine.addFile(`/file${i}.finplan`, `file${i}`);
    }
    expect(engine.hasFile('/pinned.finplan')).toBe(true);
  });

  it('should clear all files', () => {
    engine.addFile('/a.finplan', 'A');
    engine.addFile('/b.finplan', 'B');
    engine.clear();
    expect(engine.getFileCount()).toBe(0);
  });

  it('should clear only unpinned files', () => {
    engine.addFile('/a.finplan', 'A');
    engine.addFile('/b.finplan', 'B');
    engine.pin('/a.finplan');
    engine.clearUnpinned();
    expect(engine.getFileCount()).toBe(1);
    expect(engine.hasFile('/a.finplan')).toBe(true);
  });

  it('should remove missing files', () => {
    engine.addFile('/a.finplan', 'A');
    engine.addFile('/b.finplan', 'B');
    const removed = engine.removeMissing(new Set(['/a.finplan']));
    expect(removed).toBe(1);
    expect(engine.hasFile('/a.finplan')).toBe(true);
    expect(engine.hasFile('/b.finplan')).toBe(false);
  });

  it('should not remove pinned files even if missing', () => {
    engine.addFile('/a.finplan', 'A');
    engine.pin('/a.finplan');
    const removed = engine.removeMissing(new Set());
    expect(removed).toBe(0);
  });

  it('should serialize and deserialize', () => {
    engine.addFile('/a.finplan', 'A');
    engine.pin('/a.finplan');
    const json = engine.serialize();
    const newEngine = new RecentFilesEngine();
    newEngine.deserialize(json);
    expect(newEngine.getFileCount()).toBe(1);
    expect(newEngine.getPinnedFiles()).toHaveLength(1);
  });

  it('should update config', () => {
    engine.updateConfig({ maxEntries: 10 });
    const config = engine.getConfig();
    expect(config.maxEntries).toBe(10);
  });
});
