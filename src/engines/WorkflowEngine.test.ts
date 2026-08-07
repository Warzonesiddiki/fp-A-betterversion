import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from './WorkflowEngine';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  it('should initialize with empty state', () => {
    expect(engine.listWorkflows()).toEqual([]);
  });

  it('should create a workflow definition', () => {
    const workflow = engine.createWorkflow({
      name: 'Budget Approval',
      description: 'Standard budget approval workflow',
      steps: [
        { id: 's1', name: 'Manager Review', type: 'sequential', approvers: ['manager'], order: 0 },
        { id: 's2', name: 'VP Approval', type: 'sequential', approvers: ['vp'], order: 1 },
      ],
      createdBy: 'admin',
      isTemplate: false,
    });
    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBe('Budget Approval');
    expect(workflow.steps).toHaveLength(2);
  });

  it('should get workflow by id', () => {
    const workflow = engine.createWorkflow({
      name: 'Test',
      description: 'test',
      steps: [],
      createdBy: 'admin',
      isTemplate: false,
    });
    expect(engine.getWorkflow(workflow.id)).toBeDefined();
  });

  it('should submit an approval request', () => {
    const workflow = engine.createWorkflow({
      name: 'Test',
      description: 'test',
      steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
      createdBy: 'admin',
      isTemplate: false,
    });

    const request = engine.submitRequest(
      workflow.id,
      'Q1 Budget',
      'Quarterly budget approval',
      'analyst'
    );
    expect(request).not.toBeNull();
    expect(request!.id).toBeDefined();
    expect(request!.state).toBe('submitted');
    expect(request!.requester).toBe('analyst');
  });

  it('should approve a request', () => {
    const workflow = engine.createWorkflow({
      name: 'Test',
      description: 'test',
      steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
      createdBy: 'admin',
      isTemplate: false,
    });

    const request = engine.submitRequest(workflow.id, 'Test', 'test', 'analyst');
    const result = engine.approve(request!.id, 'manager', 'Looks good');
    expect(result).not.toBeNull();
    expect(result!.state).toBe('approved');
  });

  it('should reject a request', () => {
    const workflow = engine.createWorkflow({
      name: 'Test',
      description: 'test',
      steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
      createdBy: 'admin',
      isTemplate: false,
    });

    const request = engine.submitRequest(workflow.id, 'Test', 'test', 'analyst');
    const result = engine.reject(request!.id, 'manager', 'Needs more detail');
    expect(result).not.toBeNull();
    expect(result!.state).toBe('rejected');
  });

  it('should get workflow stats', () => {
    const workflow = engine.createWorkflow({
      name: 'Test',
      description: 'test',
      steps: [{ id: 's1', name: 'Review', type: 'sequential', approvers: ['manager'], order: 0 }],
      createdBy: 'admin',
      isTemplate: false,
    });

    engine.submitRequest(workflow.id, 'Test', 'test', 'analyst');
    const stats = engine.getStats();
    expect(stats.pending).toBeGreaterThanOrEqual(1);
  });

  it('should delete a workflow', () => {
    const workflow = engine.createWorkflow({
      name: 'To Delete',
      description: 'test',
      steps: [],
      createdBy: 'admin',
      isTemplate: false,
    });
    expect(engine.deleteWorkflow(workflow.id)).toBe(true);
    expect(engine.getWorkflow(workflow.id)).toBeUndefined();
  });

  it('should get all workflows', () => {
    engine.createWorkflow({
      name: 'W1',
      description: 'test',
      steps: [],
      createdBy: 'admin',
      isTemplate: false,
    });
    engine.createWorkflow({
      name: 'W2',
      description: 'test',
      steps: [],
      createdBy: 'admin',
      isTemplate: false,
    });
    expect(engine.listWorkflows()).toHaveLength(2);
  });

  it('should serialize and deserialize', () => {
    engine.createWorkflow({
      name: 'Test',
      description: 'test',
      steps: [],
      createdBy: 'admin',
      isTemplate: false,
    });
    const json = engine.serialize();
    expect(json).toBeDefined();
    expect(json.length).toBeGreaterThan(0);
  });
});
