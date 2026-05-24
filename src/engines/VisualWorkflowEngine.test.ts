/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { VisualWorkflowEngine } from './VisualWorkflowEngine';

describe('VisualWorkflowEngine', () => {
  const engine = new VisualWorkflowEngine();

  describe('createWorkflow', () => {
    it('creates a new workflow', () => {
      const wf = engine.createWorkflow('Budget Approval', 'Approval workflow');
      expect(wf).toBeDefined();
      expect(wf.name).toBe('Budget Approval');
      expect(wf.id).toBeDefined();
    });

    it('creates unique IDs', () => {
      const wf1 = engine.createWorkflow('WF1', 'test');
      const wf2 = engine.createWorkflow('WF2', 'test');
      expect(wf1.id).not.toBe(wf2.id);
    });
  });

  describe('getWorkflow', () => {
    it('retrieves workflow by ID', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const retrieved = engine.getWorkflow(wf.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test');
    });

    it('returns undefined for missing ID', () => {
      const retrieved = engine.getWorkflow('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('addNode', () => {
    it('adds node to workflow', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const node = engine.addNode(wf.id, 'trigger', 'Start', 100, 100);
      expect(node).toBeDefined();
      expect(node?.type).toBe('trigger');
    });

    it('returns null for invalid workflow', () => {
      const node = engine.addNode('invalid', 'trigger', 'Start', 0, 0);
      expect(node).toBeNull();
    });
  });

  describe('addEdge', () => {
    it('adds edge between nodes', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 0, 0)!;
      const n2 = engine.addNode(wf.id, 'end', 'End', 100, 0)!;
      const edge = engine.addEdge(wf.id, n1.id, n2.id, 'always');
      expect(edge).toBeDefined();
      expect(edge?.sourceId).toBe(n1.id);
    });
  });

  describe('validate', () => {
    it('validates correct workflow', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 0, 0)!;
      const n2 = engine.addNode(wf.id, 'end', 'End', 100, 0)!;
      engine.addEdge(wf.id, n1.id, n2.id, 'always');
      const result = engine.validate(wf.id);
      expect(result.valid).toBe(true);
    });

    it('detects missing trigger', () => {
      const wf = engine.createWorkflow('Test', 'test');
      engine.addNode(wf.id, 'action', 'Do', 0, 0);
      const result = engine.validate(wf.id);
      expect(result.valid).toBe(false);
    });
  });

  describe('getExecutionOrder', () => {
    it('returns topological order for valid workflow', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 0, 0)!;
      const n2 = engine.addNode(wf.id, 'action', 'Process', 100, 0)!;
      const n3 = engine.addNode(wf.id, 'end', 'End', 200, 0)!;
      engine.addEdge(wf.id, n1.id, n2.id, 'always');
      engine.addEdge(wf.id, n2.id, n3.id, 'always');
      const order = engine.getExecutionOrder(wf.id);
      expect(order).toBeDefined();
      expect(order).toHaveLength(3);
      expect(order![0]).toBe(n1.id);
      expect(order![2]).toBe(n3.id);
    });

    it('returns null for nonexistent workflow', () => {
      expect(engine.getExecutionOrder('nonexistent')).toBeNull();
    });
  });

  describe('getDownstreamNodes', () => {
    it('returns downstream nodes', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 0, 0)!;
      const n2 = engine.addNode(wf.id, 'end', 'End', 100, 0)!;
      engine.addEdge(wf.id, n1.id, n2.id, 'always');
      const downstream = engine.getDownstreamNodes(wf.id, n1.id);
      expect(downstream).toContain(n2.id);
    });
  });
});
