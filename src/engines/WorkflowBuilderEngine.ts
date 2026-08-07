import { randomId } from '@/utils/cryptoId';
// =============================================================================
// WORKFLOW BUILDER ENGINE
// Visual workflow designer with nodes, edges, validation
// Pure TypeScript, deterministic, testable
// =============================================================================

export type NodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'decision'
  | 'parallel'
  | 'notification'
  | 'timer';
export type EdgeType = 'sequential' | 'conditional' | 'parallel';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, unknown>;
  x: number;
  y: number;
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
  label?: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class WorkflowBuilderEngine {
  private workflows = new Map<string, WorkflowDefinition>();
  private templates = new Map<string, WorkflowDefinition>();

  // ---------------------------------------------------------------------------
  // Workflow CRUD
  // ---------------------------------------------------------------------------

  createWorkflow(name: string, description: string): WorkflowDefinition {
    const id = randomId('wf');
    const now = new Date().toISOString();
    const workflow: WorkflowDefinition = {
      id,
      name,
      description,
      nodes: [
        { id: 'start', type: 'start', label: 'Start', config: {}, x: 0, y: 0 },
        { id: 'end', type: 'end', label: 'End', config: {}, x: 400, y: 0 },
      ],
      edges: [],
      variables: {},
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Node Management
  // ---------------------------------------------------------------------------

  addNode(workflowId: string, node: WorkflowNode): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    workflow.nodes.push(node);
    workflow.updatedAt = new Date().toISOString();
    workflow.version++;
    return true;
  }

  removeNode(workflowId: string, nodeId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    workflow.nodes = workflow.nodes.filter((n) => n.id !== nodeId);
    workflow.edges = workflow.edges.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId);
    workflow.updatedAt = new Date().toISOString();
    workflow.version++;
    return true;
  }

  updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    Object.assign(node, updates);
    workflow.updatedAt = new Date().toISOString();
    workflow.version++;
    return true;
  }

  moveNode(workflowId: string, nodeId: string, x: number, y: number): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    node.x = x;
    node.y = y;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Edge Management
  // ---------------------------------------------------------------------------

  addEdge(workflowId: string, edge: WorkflowEdge): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    // Validate source and target exist
    if (!workflow.nodes.find((n) => n.id === edge.sourceId)) return false;
    if (!workflow.nodes.find((n) => n.id === edge.targetId)) return false;
    workflow.edges.push(edge);
    workflow.updatedAt = new Date().toISOString();
    workflow.version++;
    return true;
  }

  removeEdge(workflowId: string, edgeId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    const idx = workflow.edges.findIndex((e) => e.id === edgeId);
    if (idx === -1) return false;
    workflow.edges.splice(idx, 1);
    workflow.updatedAt = new Date().toISOString();
    workflow.version++;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  validate(workflowId: string): ValidationResult {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { valid: false, errors: ['Workflow not found'], warnings: [] };

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for start and end nodes
    const startNodes = workflow.nodes.filter((n) => n.type === 'start');
    const endNodes = workflow.nodes.filter((n) => n.type === 'end');
    if (startNodes.length === 0) errors.push('Workflow must have a start node');
    if (startNodes.length > 1) errors.push('Workflow must have exactly one start node');
    if (endNodes.length === 0) errors.push('Workflow must have at least one end node');

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    for (const edge of workflow.edges) {
      connectedNodes.add(edge.sourceId);
      connectedNodes.add(edge.targetId);
    }
    for (const node of workflow.nodes) {
      if (node.type !== 'start' && node.type !== 'end' && !connectedNodes.has(node.id)) {
        warnings.push(`Node "${node.label}" is disconnected`);
      }
    }

    // Check for cycles
    if (this.hasCycle(workflow)) {
      errors.push('Workflow contains a cycle');
    }

    // Check decision nodes have conditions
    for (const node of workflow.nodes) {
      if (node.type === 'decision') {
        const outEdges = workflow.edges.filter((e) => e.sourceId === node.id);
        if (outEdges.length < 2) {
          warnings.push(`Decision node "${node.label}" should have at least 2 outgoing edges`);
        }
        for (const edge of outEdges) {
          if (!edge.condition) {
            warnings.push(
              `Edge from "${node.label}" to "${workflow.nodes.find((n) => n.id === edge.targetId)?.label}" has no condition`
            );
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private hasCycle(workflow: WorkflowDefinition): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outEdges = workflow.edges.filter((e) => e.sourceId === nodeId);
      for (const edge of outEdges) {
        if (!visited.has(edge.targetId)) {
          if (dfs(edge.targetId)) return true;
        } else if (recursionStack.has(edge.targetId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  saveAsTemplate(workflowId: string, name: string): WorkflowDefinition | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    const template: WorkflowDefinition = {
      ...workflow,
      id: 'tmpl-' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): WorkflowDefinition | undefined {
    return this.templates.get(id);
  }

  listTemplates(): WorkflowDefinition[] {
    return Array.from(this.templates.values());
  }

  createFromTemplate(templateId: string, name: string): WorkflowDefinition | null {
    const template = this.templates.get(templateId);
    if (!template) return null;
    const workflow = this.createWorkflow(name, template.description);
    workflow.nodes = template.nodes.map((n) => ({ ...n }));
    workflow.edges = template.edges.map((e) => ({ ...e }));
    workflow.variables = { ...template.variables };
    return workflow;
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  serialize(workflowId: string): string | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    return JSON.stringify(workflow, null, 2);
  }

  deserialize(json: string): WorkflowDefinition | null {
    try {
      const workflow = JSON.parse(json) as WorkflowDefinition;
      workflow.id = 'wf-' + Date.now();
      workflow.createdAt = new Date().toISOString();
      workflow.updatedAt = new Date().toISOString();
      this.workflows.set(workflow.id, workflow);
      return workflow;
    } catch {
      return null;
    }
  }
}
