// =============================================================================
// BUDGET COLLECTION ENGINE — Collect budgets from multiple departments/entities
// Multi-level collection, consolidation, tracking
// Pure TypeScript, deterministic, testable
// =============================================================================

/**
 * @fileoverview Budget collection from multiple departments/entities (multi-level consolidation + tracking)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category budget-collection
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 23rd engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */

export type CollectionStatus =
  | 'pending'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'locked';

export interface BudgetSubmission {
  id: string;
  entity: string;
  department: string;
  period: string;
  status: CollectionStatus;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
  lineItems: BudgetLineItem[];
  totalAmount: number;
}

export interface BudgetLineItem {
  accountCode: string;
  accountName: string;
  amount: number;
  note?: string;
}

export interface CollectionTemplate {
  id: string;
  name: string;
  entities: string[];
  departments: string[];
  period: string;
  accounts: Array<{ code: string; name: string; required: boolean }>;
  deadline: string;
  status: 'draft' | 'active' | 'closed';
}

export interface CollectionProgress {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  percentComplete: number;
  overdue: BudgetSubmission[];
}

export class BudgetCollectionEngine {
  private templates = new Map<string, CollectionTemplate>();
  private submissions = new Map<string, BudgetSubmission>();

  createTemplate(template: Omit<CollectionTemplate, 'id' | 'status'>): CollectionTemplate {
    const id = `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const t: CollectionTemplate = { ...template, id, status: 'draft' };
    this.templates.set(id, t);
    return t;
  }

  activateTemplate(id: string): CollectionTemplate | null {
    const t = this.templates.get(id);
    if (!t) return null;
    t.status = 'active';
    return t;
  }

  submit(data: Omit<BudgetSubmission, 'id' | 'status' | 'totalAmount'>): BudgetSubmission {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const totalAmount = data.lineItems.reduce((s, l) => s + l.amount, 0);
    const submission: BudgetSubmission = {
      ...data,
      id,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      totalAmount,
    };
    this.submissions.set(id, submission);
    return submission;
  }

  approve(id: string, reviewer: string, comment?: string): BudgetSubmission | null {
    const s = this.submissions.get(id);
    if (!s || s.status !== 'submitted') return null;
    s.status = 'approved';
    s.reviewedBy = reviewer;
    s.reviewedAt = new Date().toISOString();
    s.comment = comment;
    return s;
  }

  reject(id: string, reviewer: string, comment: string): BudgetSubmission | null {
    const s = this.submissions.get(id);
    if (!s || s.status !== 'submitted') return null;
    s.status = 'rejected';
    s.reviewedBy = reviewer;
    s.reviewedAt = new Date().toISOString();
    s.comment = comment;
    return s;
  }

  lock(id: string): BudgetSubmission | null {
    const s = this.submissions.get(id);
    if (!s || s.status !== 'approved') return null;
    s.status = 'locked';
    return s;
  }

  getProgress(templateId: string): CollectionProgress {
    const template = this.templates.get(templateId);
    const expected = template ? template.entities.length * template.departments.length : 0;
    const subs = Array.from(this.submissions.values()).filter(
      (s) =>
        template?.entities.includes(s.entity) &&
        template?.departments.includes(s.department) &&
        template?.period === s.period
    );

    const submitted = subs.filter((s) => s.status !== 'pending').length;
    const approved = subs.filter((s) => s.status === 'approved' || s.status === 'locked').length;
    const rejected = subs.filter((s) => s.status === 'rejected').length;
    const now = new Date().toISOString();
    const overdue = subs.filter(
      (s) => s.status === 'pending' && template && now > template.deadline
    );

    return {
      total: expected,
      submitted,
      approved,
      rejected,
      pending: expected - submitted,
      percentComplete: expected > 0 ? (submitted / expected) * 100 : 0,
      overdue,
    };
  }

  consolidate(entity: string, period: string): BudgetLineItem[] {
    const subs = Array.from(this.submissions.values()).filter(
      (s) =>
        s.entity === entity &&
        s.period === period &&
        (s.status === 'approved' || s.status === 'locked')
    );
    const merged = new Map<string, number>();
    for (const s of subs) {
      for (const item of s.lineItems) {
        merged.set(item.accountCode, (merged.get(item.accountCode) || 0) + item.amount);
      }
    }
    return Array.from(merged.entries()).map(([code, amount]) => ({
      accountCode: code,
      accountName: '',
      amount,
    }));
  }

  getSubmissions(filter?: { entity?: string; status?: CollectionStatus }): BudgetSubmission[] {
    return Array.from(this.submissions.values()).filter((s) => {
      if (filter?.entity && s.entity !== filter.entity) return false;
      if (filter?.status && s.status !== filter.status) return false;
      return true;
    });
  }

  getTemplates(): CollectionTemplate[] {
    return Array.from(this.templates.values());
  }
}
