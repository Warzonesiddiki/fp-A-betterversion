/**
 * Tests for BudgetCollectionEngine
 * Covers: createTemplate, submit, approve, reject, getProgress
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetCollectionEngine } from './BudgetCollectionEngine';

describe('BudgetCollectionEngine', () => {
  let engine: BudgetCollectionEngine;

  beforeEach(() => {
    engine = new BudgetCollectionEngine();
  });

  describe('createTemplate', () => {
    it('should create a budget template', () => {
      const template = engine.createTemplate({
        name: 'FY2024 Budget',
        entities: ['Corp'],
        departments: ['Marketing', 'Sales'],
        period: 'FY2024',
        accounts: [{ code: 'ADV', name: 'Advertising', required: true }],
        deadline: '2024-12-31',
      });
      expect(template.name).toBe('FY2024 Budget');
      expect(template.departments).toContain('Marketing');
      expect(template.status).toBe('draft');
      expect(template.id).toBeDefined();
    });

    it('should activate a template', () => {
      const template = engine.createTemplate({
        name: 'FY2024 Budget',
        entities: ['Corp'],
        departments: ['Marketing'],
        period: 'FY2024',
        accounts: [{ code: 'ADV', name: 'Advertising', required: true }],
        deadline: '2024-12-31',
      });
      const activated = engine.activateTemplate(template.id);
      expect(activated?.status).toBe('active');
    });
  });

  describe('submit', () => {
    it('should submit a budget entry', () => {
      engine.createTemplate({
        name: 'FY2024 Budget',
        entities: ['Corp'],
        departments: ['Marketing'],
        period: 'FY2024',
        accounts: [{ code: 'ADV', name: 'Advertising', required: true }],
        deadline: '2024-12-31',
      });
      const result = engine.submit({
        entity: 'Corp',
        department: 'Marketing',
        period: 'FY2024',
        submittedBy: 'manager@company.com',
        lineItems: [{ accountCode: 'ADV', accountName: 'Advertising', amount: 50000 }],
      });
      expect(result.status).toBe('submitted');
      expect(result.id).toBeDefined();
      expect(result.totalAmount).toBe(50000);
    });
  });

  describe('approve and reject', () => {
    it('should approve a submission', () => {
      const submission = engine.submit({
        entity: 'Corp',
        department: 'Marketing',
        period: 'FY2024',
        submittedBy: 'manager@company.com',
        lineItems: [{ accountCode: 'ADV', accountName: 'Advertising', amount: 50000 }],
      });
      const result = engine.approve(submission.id, 'director@company.com', 'Looks good');
      expect(result?.status).toBe('approved');
    });

    it('should reject a submission', () => {
      const submission = engine.submit({
        entity: 'Corp',
        department: 'Marketing',
        period: 'FY2024',
        submittedBy: 'manager@company.com',
        lineItems: [{ accountCode: 'ADV', accountName: 'Advertising', amount: 50000 }],
      });
      const result = engine.reject(submission.id, 'director@company.com', 'Too high');
      expect(result?.status).toBe('rejected');
    });
  });

  describe('getProgress', () => {
    it('should track submission progress', () => {
      engine.createTemplate({
        name: 'FY2024 Budget',
        entities: ['Corp'],
        departments: ['Marketing', 'Sales'],
        period: 'FY2024',
        accounts: [{ code: 'ADV', name: 'Advertising', required: true }],
        deadline: '2024-12-31',
      });
      engine.submit({
        entity: 'Corp',
        department: 'Marketing',
        period: 'FY2024',
        submittedBy: 'manager@company.com',
        lineItems: [{ accountCode: 'ADV', accountName: 'Advertising', amount: 50000 }],
      });
      const templates = engine.getTemplates();
      const progress = engine.getProgress(templates[0].id);
      expect(progress.total).toBe(2); // 2 depts * 1 entity
      expect(progress.submitted).toBe(1);
      expect(progress.pending).toBe(1);
    });
  });

  describe('getSubmissions', () => {
    it('should filter submissions by entity', () => {
      engine.submit({
        entity: 'Corp',
        department: 'Marketing',
        period: 'FY2024',
        submittedBy: 'manager@company.com',
        lineItems: [{ accountCode: 'ADV', accountName: 'Advertising', amount: 50000 }],
      });
      const subs = engine.getSubmissions({ entity: 'Corp' });
      expect(subs.length).toBe(1);
    });
  });
});
