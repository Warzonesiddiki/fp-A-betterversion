import { randomId } from '@/utils/cryptoId';
// =============================================================================
// VISUAL WORKFLOW ENGINE
// DAG-based visual workflow builder with nodes, edges, validation, and execution
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type NodeType = 'trigger' | 'condition' | 'action' | 'delay' | 'split' | 'merge' | 'end';
export type EdgeConditionType = 'always' | 'if_true' | 'if_false' | 'error';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  conditionType: EdgeConditionType;
  label?: string;
  conditionExpression?: string;
}

export interface VisualWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExecutionContext {
  workflowId: string;
  currentNodeId: string;
  variables: Record<string, unknown>;
  history: ExecutionStep[];
  startedAt: string;
}

export interface ExecutionStep {
  nodeId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: string;
  durationMs: number;
}

export class VisualWorkflowEngine {
  private workflows = new Map<string, VisualWorkflow>();

  createWorkflow(name: string, description: string): VisualWorkflow {
    const id = randomId('vwf');
    const now = new Date().toISOString();
    const workflow: VisualWorkflow = {
      id,
      name,
      description,
      nodes: [],
      edges: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  getWorkflow(id: string): VisualWorkflow | undefined {
    return this.workflows.get(id);
  }

  listWorkflows(): VisualWorkflow[] {
    return Array.from(this.workflows.values());
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  addNode(
    workflowId: string,
    type: NodeType,
    label: string,
    x: number,
    y: number,
    config: Record<string, unknown> = {}
  ): WorkflowNode | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;
    const node: WorkflowNode = {
      id: randomId('node'),
      type,
      label,
      x,
      y,
      config,
    };
    wf.nodes.push(node);
    wf.updatedAt = new Date().toISOString();
    wf.version++;
    return node;
  }

  removeNode(workflowId: string, nodeId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    const idx = wf.nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return false;
    wf.nodes.splice(idx, 1);
    wf.edges = wf.edges.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId);
    wf.updatedAt = new Date().toISOString();
    wf.version++;
    return true;
  }

  addEdge(
    workflowId: string,
    sourceId: string,
    targetId: string,
    conditionType: EdgeConditionType = 'always',
    label?: string
  ): WorkflowEdge | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;
    if (!wf.nodes.some((n) => n.id === sourceId) || !wf.nodes.some((n) => n.id === targetId))
      return null;
    if (this.wouldCreateCycle(wf, sourceId, targetId)) return null;
    const edge: WorkflowEdge = {
      id: randomId('edge'),
      sourceId,
      targetId,
      conditionType,
      label,
    };
    wf.edges.push(edge);
    wf.updatedAt = new Date().toISOString();
    wf.version++;
    return edge;
  }

  removeEdge(workflowId: string, edgeId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    const idx = wf.edges.findIndex((e) => e.id === edgeId);
    if (idx === -1) return false;
    wf.edges.splice(idx, 1);
    wf.updatedAt = new Date().toISOString();
    wf.version++;
    return true;
  }

  validate(workflowId: string): ValidationResult {
    const wf = this.workflows.get(workflowId);
    if (!wf) return { valid: false, errors: ['Workflow not found'], warnings: [] };

    const errors: string[] = [];
    const warnings: string[] = [];

    const triggers = wf.nodes.filter((n) => n.type === 'trigger');
    if (triggers.length === 0) errors.push('Workflow must have at least one trigger node');
    if (triggers.length > 1) warnings.push('Multiple trigger nodes detected');

    const ends = wf.nodes.filter((n) => n.type === 'end');
    if (ends.length === 0) errors.push('Workflow must have at least one end node');

    for (const node of wf.nodes) {
      const outEdges = wf.edges.filter((e) => e.sourceId === node.id);
      const inEdges = wf.edges.filter((e) => e.targetId === node.id);
      if (node.type !== 'end' && outEdges.length === 0)
        errors.push(`Node "${node.label}" has no outgoing edges`);
      if (node.type !== 'trigger' && inEdges.length === 0)
        errors.push(`Node "${node.label}" has no incoming edges`);
      if (node.type === 'split' && outEdges.length < 2)
        warnings.push(`Split node "${node.label}" should have at least 2 outgoing edges`);
      if (node.type === 'merge' && inEdges.length < 2)
        warnings.push(`Merge node "${node.label}" should have at least 2 incoming edges`);
    }

    const visited = new Set<string>();
    const triggers0 = triggers[0];
    if (triggers0) this.dfs(triggers0.id, wf, visited);
    for (const node of wf.nodes) {
      if (!visited.has(node.id)) warnings.push(`Node "${node.label}" is unreachable from trigger`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getExecutionOrder(workflowId: string): string[] | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    for (const node of wf.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }
    for (const edge of wf.edges) {
      inDegree.set(edge.targetId, (inDegree.get(edge.targetId) ?? 0) + 1);
      adjacency.get(edge.sourceId)?.push(edge.targetId);
    }
    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }
    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }
    return order.length === wf.nodes.length ? order : null;
  }

  getDownstreamNodes(workflowId: string, nodeId: string): string[] {
    const wf = this.workflows.get(workflowId);
    if (!wf) return [];
    const downstream: string[] = [];
    const queue = [nodeId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of wf.edges.filter((e) => e.sourceId === current)) {
        downstream.push(edge.targetId);
        queue.push(edge.targetId);
      }
    }
    return downstream;
  }

  getUpstreamNodes(workflowId: string, nodeId: string): string[] {
    const wf = this.workflows.get(workflowId);
    if (!wf) return [];
    const upstream: string[] = [];
    const queue = [nodeId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of wf.edges.filter((e) => e.targetId === current)) {
        upstream.push(edge.sourceId);
        queue.push(edge.sourceId);
      }
    }
    return upstream;
  }

  serialize(workflowId: string): string | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;
    return JSON.stringify(wf, null, 2);
  }

  deserialize(json: string): VisualWorkflow {
    const wf = JSON.parse(json) as VisualWorkflow;
    this.workflows.set(wf.id, wf);
    return wf;
  }

  private wouldCreateCycle(wf: VisualWorkflow, sourceId: string, targetId: string): boolean {
    const visited = new Set<string>();
    const stack = [targetId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === sourceId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of wf.edges.filter((e) => e.sourceId === current)) {
        stack.push(edge.targetId);
      }
    }
    return false;
  }

  private dfs(nodeId: string, wf: VisualWorkflow, visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const edge of wf.edges.filter((e) => e.sourceId === nodeId)) {
      this.dfs(edge.targetId, wf, visited);
    }
  }
}
