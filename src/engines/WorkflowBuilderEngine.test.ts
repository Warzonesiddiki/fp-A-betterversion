import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorkflowBuilderEngine,
  type WorkflowNode,
  type WorkflowEdge,
} from './WorkflowBuilderEngine';

describe('WorkflowBuilderEngine', () => {
  let engine: WorkflowBuilderEngine;

  beforeEach(() => {
    engine = new WorkflowBuilderEngine();
  });

  it('should create a workflow', () => {
    const wf = engine.createWorkflow('Budget Approval', 'Standard approval workflow');
    expect(wf.id).toBeDefined();
    expect(wf.nodes).toHaveLength(2); // start + end
  });

  it('should list workflows', () => {
    engine.createWorkflow('W1', 'test');
    engine.createWorkflow('W2', 'test');
    expect(engine.listWorkflows()).toHaveLength(2);
  });

  it('should delete a workflow', () => {
    const wf = engine.createWorkflow('Test', 'test');
    expect(engine.deleteWorkflow(wf.id)).toBe(true);
    expect(engine.getWorkflow(wf.id)).toBeUndefined();
  });

  it('should add nodes', () => {
    const wf = engine.createWorkflow('Test', 'test');
    const node: WorkflowNode = {
      id: 'task1',
      type: 'task',
      label: 'Review',
      config: {},
      x: 100,
      y: 0,
    };
    expect(engine.addNode(wf.id, node)).toBe(true);
    expect(engine.getWorkflow(wf.id)?.nodes).toHaveLength(3);
  });

  it('should remove nodes and connected edges', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Review', config: {}, x: 100, y: 0 });
    engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 'task1', type: 'sequential' });
    engine.addEdge(wf.id, { id: 'e2', sourceId: 'task1', targetId: 'end', type: 'sequential' });
    engine.removeNode(wf.id, 'task1');
    const wf2 = engine.getWorkflow(wf.id)!;
    expect(wf2.nodes).toHaveLength(2);
    expect(wf2.edges).toHaveLength(0);
  });

  it('should add edges', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Review', config: {}, x: 100, y: 0 });
    expect(
      engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 'task1', type: 'sequential' })
    ).toBe(true);
  });

  it('should not add edge with invalid source', () => {
    const wf = engine.createWorkflow('Test', 'test');
    expect(
      engine.addEdge(wf.id, { id: 'e1', sourceId: 'invalid', targetId: 'end', type: 'sequential' })
    ).toBe(false);
  });

  it('should validate workflow', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Review', config: {}, x: 100, y: 0 });
    engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 'task1', type: 'sequential' });
    engine.addEdge(wf.id, { id: 'e2', sourceId: 'task1', targetId: 'end', type: 'sequential' });
    const result = engine.validate(wf.id);
    expect(result.valid).toBe(true);
  });

  it('should detect disconnected nodes', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Orphan', config: {}, x: 100, y: 0 });
    const result = engine.validate(wf.id);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should save as template', () => {
    const wf = engine.createWorkflow('Test', 'test');
    const template = engine.saveAsTemplate(wf.id, 'My Template');
    expect(template?.id).toContain('tmpl-');
    expect(engine.listTemplates()).toHaveLength(1);
  });

  it('should create from template', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.saveAsTemplate(wf.id, 'My Template');
    const newWf = engine.createFromTemplate(engine!.listTemplates()[0]!.id, 'New Workflow');
    expect(newWf?.name).toBe('New Workflow');
  });

  it('should serialize and deserialize', () => {
    const wf = engine.createWorkflow('Test', 'test');
    const json = engine.serialize(wf.id);
    expect(json).toBeDefined();
    const imported = engine.deserialize(json!);
    expect(imported?.name).toBe('Test');
  });
});
