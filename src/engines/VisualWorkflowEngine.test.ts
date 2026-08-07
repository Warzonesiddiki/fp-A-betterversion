/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { VisualWorkflowEngine } from './VisualWorkflowEngine';

describe('VisualWorkflowEngine', () => {
  let engine: VisualWorkflowEngine;

  beforeEach(() => {
    engine = new VisualWorkflowEngine();
  });

  describe('createWorkflow, list, and delete', () => {
    it('creates a new workflow, lists all workflows, and deletes', () => {
      const wf = engine.createWorkflow('Budget Approval', 'Approval workflow');
      expect(wf).toBeDefined();
      expect(wf.name).toBe('Budget Approval');
      expect(wf.id).toBeDefined();

      const list = engine.listWorkflows();
      expect(list.length).toBeGreaterThan(0);

      expect(engine.deleteWorkflow(wf.id)).toBe(true);
      expect(engine.deleteWorkflow('unknown_id')).toBe(false);
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

  describe('node and edge modifications', () => {
    it('adds and removes nodes and edges', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 100, 100, { cron: '0 0 * * *' });
      const n2 = engine.addNode(wf.id, 'end', 'Finish', 300, 100);

      expect(n1?.config['cron']).toBe('0 0 * * *');

      const edge = engine.addEdge(wf.id, n1!.id, n2!.id, 'always', 'Transition');
      expect(edge).toBeDefined();
      expect(edge?.sourceId).toBe(n1!.id);
      expect(edge?.targetId).toBe(n2!.id);

      expect(engine.removeEdge(wf.id, edge!.id)).toBe(true);
      expect(engine.removeEdge(wf.id, 'nonexistent_edge')).toBe(false);

      expect(engine.removeNode(wf.id, n2!.id)).toBe(true);
      expect(engine.removeNode(wf.id, 'nonexistent_node')).toBe(false);
    });

    it('returns null for invalid workflow node operations', () => {
      const node = engine.addNode('invalid', 'trigger', 'Start', 0, 0);
      expect(node).toBeNull();
      expect(engine.addEdge('invalid', 'n1', 'n2', 'always')).toBeNull();
      expect(engine.removeNode('invalid', 'n1')).toBe(false);
      expect(engine.removeEdge('invalid', 'e1')).toBe(false);
    });

    it('prevents cycle creation when adding edge', () => {
      const wf = engine.createWorkflow('CycleTest', 'test');
      const a = engine.addNode(wf.id, 'trigger', 'A', 0, 0)!;
      const b = engine.addNode(wf.id, 'action', 'B', 100, 0)!;
      const c = engine.addNode(wf.id, 'action', 'C', 200, 0)!;

      engine.addEdge(wf.id, a.id, b.id, 'always');
      engine.addEdge(wf.id, b.id, c.id, 'always');

      // Attempting to add edge c -> a would create cycle
      const cycleEdge = engine.addEdge(wf.id, c.id, a.id, 'always');
      expect(cycleEdge).toBeNull();
    });
  });

  describe('validate and topological sort', () => {
    it('validates correct workflow', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 0, 0)!;
      const n2 = engine.addNode(wf.id, 'end', 'End', 100, 0)!;
      engine.addEdge(wf.id, n1.id, n2.id, 'always');
      const result = engine.validate(wf.id);
      expect(result.valid).toBe(true);
    });

    it('detects missing trigger, missing end, split/merge warnings, and unreachable nodes', () => {
      const wf = engine.createWorkflow('Test', 'test');
      const splitNode = engine.addNode(wf.id, 'split', 'Split', 0, 0)!;
      const mergeNode = engine.addNode(wf.id, 'merge', 'Merge', 100, 0)!;
      engine.addEdge(wf.id, splitNode.id, mergeNode.id, 'always');

      const result = engine.validate(wf.id);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('returns topological order for valid DAG workflow and handles invalid workflow', () => {
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

      expect(engine.getExecutionOrder('non_existent_wf')).toBeNull();
    });
  });

  describe('getDownstreamNodes, getUpstreamNodes, serialize, and deserialize', () => {
    it('returns downstream and upstream nodes and serializes/deserializes workflow JSON', () => {
      const wf = engine.createWorkflow('SerDeTest', 'test');
      const n1 = engine.addNode(wf.id, 'trigger', 'Start', 0, 0)!;
      const n2 = engine.addNode(wf.id, 'action', 'Middle', 100, 0)!;
      const n3 = engine.addNode(wf.id, 'end', 'End', 200, 0)!;
      engine.addEdge(wf.id, n1.id, n2.id, 'always');
      engine.addEdge(wf.id, n2.id, n3.id, 'always');

      const downstream = engine.getDownstreamNodes(wf.id, n1.id);
      expect(downstream).toContain(n2.id);
      expect(downstream).toContain(n3.id);

      const upstream = engine.getUpstreamNodes(wf.id, n3.id);
      expect(upstream).toContain(n2.id);
      expect(upstream).toContain(n1.id);

      expect(engine.getDownstreamNodes('invalid', 'n1')).toEqual([]);
      expect(engine.getUpstreamNodes('invalid', 'n3')).toEqual([]);

      const json = engine.serialize(wf.id);
      expect(json).toBeDefined();
      expect(engine.serialize('invalid')).toBeNull();

      const newEngine = new VisualWorkflowEngine();
      const restored = newEngine.deserialize(json!);
      expect(restored.name).toBe('SerDeTest');
      expect(restored.nodes).toHaveLength(3);
    });
  });
});
