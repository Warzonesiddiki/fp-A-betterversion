export type ApprovalState =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'locked';
export type StepType = 'sequential' | 'parallel';

export interface ApprovalCondition {
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  value: number;
  value2?: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  approvers: string[];
  condition?: ApprovalCondition;
  timeoutHours?: number;
  delegateTo?: string[];
  order: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdBy: string;
  createdAt: string;
  isTemplate: boolean;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  requester: string;
  state: ApprovalState;
  currentStepIndex: number;
  amount?: number;
  entity?: string;
  period?: string;
  createdAt: string;
  updatedAt: string;
  history: ApprovalEvent[];
  changeRequests: ChangeRequest[];
}

export interface ApprovalEvent {
  id: string;
  action: 'submit' | 'approve' | 'reject' | 'delegate' | 'escalate' | 'lock' | 'unlock' | 'comment';
  actor: string;
  stepId?: string;
  comment?: string;
  delegatedTo?: string;
  timestamp: string;
}

export interface ChangeRequest {
  id: string;
  requestId: string;
  requester: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Delegation {
  fromUser: string;
  toUser: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface WorkflowStats {
  pending: number;
  approved: number;
  rejected: number;
  locked: number;
  avgApprovalTimeHours: number;
  bottlenecks: Record<string, number>;
  slaBreaches: ApprovalRequest[];
}

export class WorkflowEngine {
  private workflows = new Map<string, WorkflowDefinition>();
  private requests = new Map<string, ApprovalRequest>();
  private delegations: Delegation[] = [];

  createWorkflow(def: Omit<WorkflowDefinition, 'id' | 'createdAt'>): WorkflowDefinition {
    const id = 'wf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const workflow: WorkflowDefinition = { ...def, id, createdAt: new Date().toISOString() };
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

  submitRequest(
    workflowId: string,
    title: string,
    description: string,
    requester: string,
    amount?: number,
    entity?: string,
    period?: string
  ): ApprovalRequest | null {
    if (!workflowId || !title || !requester) return null;
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.steps.length === 0) return null;
    const id = 'apr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();
    const request: ApprovalRequest = {
      id,
      workflowId,
      title,
      description,
      requester,
      state: 'submitted',
      currentStepIndex: 0,
      amount,
      entity,
      period,
      createdAt: now,
      updatedAt: now,
      history: [{ id: 'evt-' + Date.now(), action: 'submit', actor: requester, timestamp: now }],
      changeRequests: [],
    };
    this.requests.set(id, request);
    const firstStep = workflow.steps[0];
    if (
      firstStep!.condition &&
      amount !== undefined &&
      !this.evaluateCondition(firstStep!.condition, amount)
    ) {
      request.state = 'approved';
      request.history.push({
        id: 'evt-' + (Date.now() + 1),
        action: 'approve',
        actor: 'system',
        comment: 'Auto-approved: condition not met',
        timestamp: new Date().toISOString(),
      });
    }
    return request;
  }

  approve(requestId: string, approver: string, comment?: string): ApprovalRequest | null {
    const request = this.requests.get(requestId);
    if (!request || !['submitted', 'in_review'].includes(request.state)) return null;
    const workflow = this.workflows.get(request.workflowId);
    if (!workflow) return null;
    const currentStep = workflow.steps[request.currentStepIndex];
    if (!currentStep) return null;
    const effectiveApprover = this.getEffectiveApprover(approver);
    const isAuthorized =
      currentStep.approvers.includes(effectiveApprover) ||
      (currentStep.delegateTo?.includes(effectiveApprover) ?? false);
    if (!isAuthorized) return null;
    const now = new Date().toISOString();
    request.history.push({
      id: 'evt-' + Date.now(),
      action: 'approve',
      actor: effectiveApprover,
      stepId: currentStep.id,
      comment,
      timestamp: now,
    });
    if (currentStep.type === 'parallel') {
      const approvedActors = request.history
        .filter((e) => e.action === 'approve' && e.stepId === currentStep.id)
        .map((e) => e.actor);
      if (!currentStep.approvers.every((a) => approvedActors.includes(a))) {
        request.state = 'in_review';
        request.updatedAt = now;
        return request;
      }
    }
    if (request.currentStepIndex < workflow.steps.length - 1) {
      request.currentStepIndex += 1;
      request.state = 'submitted';
    } else {
      request.state = 'approved';
    }
    request.updatedAt = now;
    return request;
  }

  reject(requestId: string, approver: string, comment?: string): ApprovalRequest | null {
    const request = this.requests.get(requestId);
    if (!request || !['submitted', 'in_review'].includes(request.state)) return null;
    request.state = 'rejected';
    const now = new Date().toISOString();
    request.history.push({
      id: 'evt-' + Date.now(),
      action: 'reject',
      actor: approver,
      stepId: this.getCurrentStepId(request),
      comment,
      timestamp: now,
    });
    request.updatedAt = now;
    return request;
  }

  delegate(
    requestId: string,
    fromUser: string,
    toUser: string,
    comment?: string
  ): ApprovalRequest | null {
    const request = this.requests.get(requestId);
    if (!request || !['submitted', 'in_review'].includes(request.state)) return null;
    const now = new Date().toISOString();
    request.history.push({
      id: 'evt-' + Date.now(),
      action: 'delegate',
      actor: fromUser,
      stepId: this.getCurrentStepId(request),
      delegatedTo: toUser,
      comment,
      timestamp: now,
    });
    request.updatedAt = now;
    return request;
  }

  lock(requestId: string, actor: string): ApprovalRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.state !== 'approved') return null;
    request.state = 'locked';
    const now = new Date().toISOString();
    request.history.push({ id: 'evt-' + Date.now(), action: 'lock', actor, timestamp: now });
    request.updatedAt = now;
    return request;
  }

  checkEscalations(): string[] {
    const escalated: string[] = [];
    const now = Date.now();
    for (const request of this.requests.values()) {
      if (!['submitted', 'in_review'].includes(request.state)) continue;
      const workflow = this.workflows.get(request.workflowId);
      if (!workflow) continue;
      const currentStep = workflow.steps[request.currentStepIndex];
      if (!currentStep?.timeoutHours) continue;
      const lastEvent = request.history[request.history.length - 1];
      if (!lastEvent) continue;
      const elapsedHours = (now - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60);
      if (elapsedHours >= currentStep.timeoutHours) {
        const nowStr = new Date().toISOString();
        request.history.push({
          id: 'evt-' + Date.now(),
          action: 'escalate',
          actor: 'system',
          stepId: currentStep.id,
          comment: 'Auto-escalated after ' + currentStep.timeoutHours + 'h timeout',
          timestamp: nowStr,
        });
        if (request.currentStepIndex < workflow.steps.length - 1) {
          request.currentStepIndex += 1;
          request.state = 'submitted';
        }
        request.updatedAt = nowStr;
        escalated.push(request.id);
      }
    }
    return escalated;
  }

  submitChangeRequest(
    requestId: string,
    requester: string,
    description: string
  ): ChangeRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;
    const cr: ChangeRequest = {
      id: 'cr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      requestId,
      requester,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    request.changeRequests.push(cr);
    request.updatedAt = cr.createdAt;
    return cr;
  }

  resolveChangeRequest(
    requestId: string,
    changeRequestId: string,
    resolver: string,
    accepted: boolean
  ): boolean {
    const request = this.requests.get(requestId);
    if (!request) return false;
    const cr = request.changeRequests.find((c) => c.id === changeRequestId);
    if (!cr || cr.status !== 'pending') return false;
    cr.status = accepted ? 'accepted' : 'rejected';
    cr.resolvedAt = new Date().toISOString();
    cr.resolvedBy = resolver;
    request.updatedAt = cr.resolvedAt;
    if (accepted) {
      request.state = 'draft';
      request.history.push({
        id: 'evt-' + Date.now(),
        action: 'submit',
        actor: 'system',
        comment: 'Reset to draft due to accepted change request',
        timestamp: cr.resolvedAt,
      });
    }
    return true;
  }

  addDelegation(d: Delegation): void {
    this.delegations.push(d);
  }
  removeDelegation(fromUser: string): void {
    this.delegations = this.delegations.filter((d) => d.fromUser !== fromUser);
  }
  getDelegations(): Delegation[] {
    return [...this.delegations];
  }

  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }
  getRequestsByState(state: ApprovalState): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.state === state);
  }
  getRequestsByRequester(requester: string): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.requester === requester);
  }

  getPendingForApprover(approver: string): ApprovalRequest[] {
    const effectiveUser = this.getEffectiveApprover(approver);
    return Array.from(this.requests.values()).filter((r) => {
      if (!['submitted', 'in_review'].includes(r.state)) return false;
      const workflow = this.workflows.get(r.workflowId);
      if (!workflow) return false;
      const step = workflow.steps[r.currentStepIndex];
      if (!step) return false;
      return (
        step.approvers.includes(effectiveUser) ||
        (step.delegateTo?.includes(effectiveUser) ?? false)
      );
    });
  }

  getStats(): WorkflowStats {
    const all = Array.from(this.requests.values());
    const pending = all.filter((r) => ['submitted', 'in_review'].includes(r.state));
    const approved = all.filter((r) => r.state === 'approved');
    const rejected = all.filter((r) => r.state === 'rejected');
    const locked = all.filter((r) => r.state === 'locked');
    let totalHours = 0;
    let count = 0;
    for (const req of approved) {
      const submit = req.history.find((e) => e.action === 'submit');
      const lastApprove = [...req.history].reverse().find((e) => e.action === 'approve');
      if (submit && lastApprove) {
        totalHours +=
          (new Date(lastApprove.timestamp).getTime() - new Date(submit.timestamp).getTime()) /
          (1000 * 60 * 60);
        count++;
      }
    }
    const bottlenecks: Record<string, number> = {};
    for (const req of pending) {
      const workflow = this.workflows.get(req.workflowId);
      if (!workflow) continue;
      const step = workflow.steps[req.currentStepIndex];
      if (!step) continue;
      for (const a of step.approvers) bottlenecks[a] = (bottlenecks[a] || 0) + 1;
    }
    const now = Date.now();
    const slaBreaches = pending.filter((req) => {
      const workflow = this.workflows.get(req.workflowId);
      if (!workflow) return false;
      const step = workflow.steps[req.currentStepIndex];
      if (!step?.timeoutHours) return false;
      const lastEvent = req.history[req.history.length - 1];
      if (!lastEvent) return false;
      return (
        (now - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60) >= step.timeoutHours
      );
    });
    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      locked: locked.length,
      avgApprovalTimeHours: count > 0 ? totalHours / count : 0,
      bottlenecks,
      slaBreaches,
    };
  }

  serialize(): string {
    return JSON.stringify({
      workflows: Array.from(this.workflows.entries()),
      requests: Array.from(this.requests.entries()),
      delegations: this.delegations,
    });
  }

  deserialize(data: string): boolean {
    try {
      const p = JSON.parse(data);
      this.workflows = new Map(p.workflows ?? []);
      this.requests = new Map(p.requests ?? []);
      this.delegations = p.delegations ?? [];
      return true;
    } catch {
      return false;
    }
  }

  private evaluateCondition(c: ApprovalCondition, v: number): boolean {
    switch (c.operator) {
      case 'gt':
        return v > c.value;
      case 'lt':
        return v < c.value;
      case 'gte':
        return v >= c.value;
      case 'lte':
        return v <= c.value;
      case 'eq':
        return v === c.value;
      case 'between':
        return v >= c.value && v <= (c.value2 ?? c.value);
      default:
        return true;
    }
  }

  private getEffectiveApprover(user: string): string {
    const now = new Date().toISOString();
    const d = this.delegations.find(
      (del) => del.fromUser === user && del.startDate <= now && del.endDate >= now
    );
    return d ? d.toUser : user;
  }

  private getCurrentStepId(r: ApprovalRequest): string | undefined {
    return this.workflows.get(r.workflowId)?.steps[r.currentStepIndex]?.id;
  }
}
