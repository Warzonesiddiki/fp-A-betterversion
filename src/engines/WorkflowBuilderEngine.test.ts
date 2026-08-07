import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowBuilderEngine, type WorkflowNode } from './WorkflowBuilderEngine';

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

  it('should list workflows and get by ID', () => {
    const w1 = engine.createWorkflow('W1', 'test');
    engine.createWorkflow('W2', 'test');
    expect(engine.listWorkflows()).toHaveLength(2);
    expect(engine.getWorkflow(w1.id)).toBeDefined();
  });

  it('should delete a workflow', () => {
    const wf = engine.createWorkflow('Test', 'test');
    expect(engine.deleteWorkflow(wf.id)).toBe(true);
    expect(engine.getWorkflow(wf.id)).toBeUndefined();
  });

  it('should add, update, and move nodes', () => {
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
    expect(engine.addNode('invalid_wf', node)).toBe(false);
    expect(engine.getWorkflow(wf.id)?.nodes).toHaveLength(3);

    expect(engine.updateNode(wf.id, 'task1', { label: 'Updated Review' })).toBe(true);
    expect(engine.updateNode(wf.id, 'nonexistent', {})).toBe(false);
    expect(engine.updateNode('invalid_wf', 'task1', {})).toBe(false);

    expect(engine.moveNode(wf.id, 'task1', 250, 150)).toBe(true);
    expect(engine.moveNode(wf.id, 'nonexistent', 0, 0)).toBe(false);
    expect(engine.moveNode('invalid_wf', 'task1', 0, 0)).toBe(false);
  });

  it('should remove nodes and connected edges', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Review', config: {}, x: 100, y: 0 });
    engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 'task1', type: 'sequential' });
    engine.addEdge(wf.id, { id: 'e2', sourceId: 'task1', targetId: 'end', type: 'sequential' });

    expect(engine.removeEdge(wf.id, 'e1')).toBe(true);
    expect(engine.removeEdge(wf.id, 'nonexistent_edge')).toBe(false);
    expect(engine.removeEdge('invalid_wf', 'e1')).toBe(false);

    expect(engine.removeNode(wf.id, 'task1')).toBe(true);
    expect(engine.removeNode('invalid_wf', 'task1')).toBe(false);
    const wf2 = engine.getWorkflow(wf.id)!;
    expect(wf2.nodes).toHaveLength(2);
  });

  it('should add edges', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Review', config: {}, x: 100, y: 0 });
    expect(
      engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 'task1', type: 'sequential' })
    ).toBe(true);
    expect(
      engine.addEdge('invalid_wf', {
        id: 'e1',
        sourceId: 'start',
        targetId: 'task1',
        type: 'sequential',
      })
    ).toBe(false);
  });

  it('should not add edge with invalid source or target', () => {
    const wf = engine.createWorkflow('Test', 'test');
    expect(
      engine.addEdge(wf.id, { id: 'e1', sourceId: 'invalid', targetId: 'end', type: 'sequential' })
    ).toBe(false);
    expect(
      engine.addEdge(wf.id, {
        id: 'e1',
        sourceId: 'start',
        targetId: 'invalid',
        type: 'sequential',
      })
    ).toBe(false);
  });

  it('should validate workflow with decision nodes, cycles, and missing nodes', () => {
    const wf = engine.createWorkflow('Test', 'test');
    engine.addNode(wf.id, { id: 'task1', type: 'task', label: 'Review', config: {}, x: 100, y: 0 });
    engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 'task1', type: 'sequential' });
    engine.addEdge(wf.id, { id: 'e2', sourceId: 'task1', targetId: 'end', type: 'sequential' });
    const result = engine.validate(wf.id);
    expect(result.valid).toBe(true);

    // Decision node without conditions
    engine.addNode(wf.id, {
      id: 'dec1',
      type: 'decision',
      label: 'Check Budget',
      config: {},
      x: 200,
      y: 0,
    });
    engine.addEdge(wf.id, { id: 'e3', sourceId: 'task1', targetId: 'dec1', type: 'conditional' });
    engine.addEdge(wf.id, { id: 'e4', sourceId: 'dec1', targetId: 'end', type: 'conditional' }); // only 1 outEdge, no condition
    const decValidation = engine.validate(wf.id);
    expect(decValidation.warnings.length).toBeGreaterThan(0);

    // Invalid workflow ID
    expect(engine.validate('invalid_wf').valid).toBe(false);
  });

  it('should detect cycles during validation', () => {
    const wf = engine.createWorkflow('CycleTest', 'test');
    engine.addNode(wf.id, { id: 't1', type: 'task', label: 'T1', config: {}, x: 100, y: 0 });
    engine.addNode(wf.id, { id: 't2', type: 'task', label: 'T2', config: {}, x: 200, y: 0 });
    engine.addEdge(wf.id, { id: 'e1', sourceId: 'start', targetId: 't1', type: 'sequential' });
    engine.addEdge(wf.id, { id: 'e2', sourceId: 't1', targetId: 't2', type: 'sequential' });
    engine.addEdge(wf.id, { id: 'e3', sourceId: 't2', targetId: 't1', type: 'sequential' }); // cycle
    engine.addEdge(wf.id, { id: 'e4', sourceId: 't2', targetId: 'end', type: 'sequential' });

    const val = engine.validate(wf.id);
    expect(val.valid).toBe(false);
    expect(val.errors).toContain('Workflow contains a cycle');
  });

  it('should save as template and create from template', () => {
    const wf = engine.createWorkflow('Test', 'test');
    const template = engine.saveAsTemplate(wf.id, 'My Template');
    expect(template?.id).toContain('tmpl-');
    expect(engine.listTemplates()).toHaveLength(1);
    expect(engine.getTemplate(template!.id)).toBeDefined();

    expect(engine.saveAsTemplate('invalid_wf', 'Fail')).toBeNull();

    const newWf = engine.createFromTemplate(template!.id, 'New Workflow');
    expect(newWf?.name).toBe('New Workflow');
    expect(engine.createFromTemplate('invalid_tmpl', 'Fail')).toBeNull();
  });

  it('should serialize and deserialize', () => {
    const wf = engine.createWorkflow('Test', 'test');
    const json = engine.serialize(wf.id);
    expect(json).toBeDefined();
    expect(engine.serialize('invalid_wf')).toBeNull();

    const imported = engine.deserialize(json!);
    expect(imported?.name).toBe('Test');
    expect(engine.deserialize('invalid json string {')).toBeNull();
  });
});
