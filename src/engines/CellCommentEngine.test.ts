import { describe, it, expect, beforeEach } from 'vitest';
import { CellCommentEngine, type CellComment } from './CellCommentEngine';

describe('CellCommentEngine', () => {
  let engine: CellCommentEngine;

  beforeEach(() => {
    engine = new CellCommentEngine();
  });

  it('should initialize with empty comments', () => {
    expect(engine.getComments('A1')).toEqual([]);
    expect(engine.getCommentCount('A1')).toBe(0);
  });

  it('should add a comment', () => {
    const comment = engine.addComment('A1', 'Alice', 'Test comment');
    expect(comment.id).toMatch(/^cmt-/);
    expect(comment.cellKey).toBe('A1');
    expect(comment.author).toBe('Alice');
    expect(comment.text).toBe('Test comment');
    expect(comment.resolved).toBe(false);
    expect(comment.parentId).toBeNull();
  });

  it('should get comments for a cell', () => {
    engine.addComment('A1', 'Alice', 'Comment 1');
    engine.addComment('A1', 'Bob', 'Comment 2');
    engine.addComment('B1', 'Alice', 'Comment 3');

    expect(engine.getComments('A1')).toHaveLength(2);
    expect(engine.getComments('B1')).toHaveLength(1);
    expect(engine.getComments('C1')).toEqual([]);
  });

  it('should reply to a comment', () => {
    const parent = engine.addComment('A1', 'Alice', 'Parent');
    const reply = engine.replyTo(parent.id, 'Bob', 'Reply');

    expect(reply).not.toBeNull();
    expect(reply!.parentId).toBe(parent.id);
    expect(reply!.cellKey).toBe('A1');
  });

  it('should return null when replying to non-existent comment', () => {
    const reply = engine.replyTo('non-existent', 'Bob', 'Reply');
    expect(reply).toBeNull();
  });

  it('should resolve and unresolve a comment', () => {
    const comment = engine.addComment('A1', 'Alice', 'Test');
    expect(engine.resolveComment(comment.id)).toBe(true);
    expect(engine.getComments('A1')[0].resolved).toBe(true);

    expect(engine.unresolveComment(comment.id)).toBe(true);
    expect(engine.getComments('A1')[0].resolved).toBe(false);
  });

  it('should return false when resolving non-existent comment', () => {
    expect(engine.resolveComment('non-existent')).toBe(false);
  });

  it('should delete a comment', () => {
    const comment = engine.addComment('A1', 'Alice', 'Test');
    expect(engine.deleteComment(comment.id)).toBe(true);
    expect(engine.getComments('A1')).toHaveLength(0);
  });

  it('should return false when deleting non-existent comment', () => {
    expect(engine.deleteComment('non-existent')).toBe(false);
  });

  it('should extract mentions from text', () => {
    const comment = engine.addComment('A1', 'Alice', 'Hey @Bob and @Charlie');
    expect(comment.mentions).toContain('Bob');
    expect(comment.mentions).toContain('Charlie');
  });

  it('should count comments correctly', () => {
    engine.addComment('A1', 'Alice', 'C1');
    engine.addComment('A1', 'Bob', 'C2');
    engine.addComment('B1', 'Alice', 'C3');
    expect(engine.getCommentCount('A1')).toBe(2);
    expect(engine.getCommentCount('B1')).toBe(1);
  });

  it('should export comments', () => {
    engine.addComment('A1', 'Alice', 'Test');
    const exported = engine.exportAll();
    expect(exported.length).toBeGreaterThan(0);
    expect(exported[0].cellKey).toBe('A1');
  });

  it('should import comments', () => {
    const data = [
      {
        cellKey: 'A1',
        comments: [
          {
            id: 'cmt-1',
            cellKey: 'A1',
            author: 'Alice',
            text: 'Imported',
            createdAt: new Date().toISOString(),
            resolved: false,
            parentId: null,
            mentions: [],
          },
        ],
      },
    ];
    engine.importData(data);
    expect(engine.getComments('A1')).toHaveLength(1);
  });
});
