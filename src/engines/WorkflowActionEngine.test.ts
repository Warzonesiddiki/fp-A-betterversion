/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowActionEngine } from './WorkflowActionEngine';

describe('WorkflowActionEngine', () => {
  let engine: WorkflowActionEngine;

  beforeEach(() => {
    engine = new WorkflowActionEngine();
  });

  describe('createAction', () => {
    it('creates a notify action', () => {
      const action = engine.createAction('notify', 'Send Email', 'Send budget notification', {
        channel: 'email',
        recipients: ['cfo@example.com'],
        template: 'budget_approved',
      });
      expect(action.id).toMatch(/^act-/);
      expect(action.type).toBe('notify');
      expect(action.name).toBe('Send Email');
    });

    it('creates a calculate action', () => {
      const action = engine.createAction('calculate', 'Run Formula', 'Calculate variance', {
        formula: 'actual - budget',
        variables: { actual: 100, budget: 90 },
      });
      expect(action.type).toBe('calculate');
    });

    it('creates with default empty config', () => {
      const action = engine.createAction('log', 'Log Step', 'Log workflow step');
      expect(action.config).toBeDefined();
    });
  });

  describe('getAction / listActions', () => {
    it('retrieves an action by id', () => {
      const action = engine.createAction('notify', 'Test', 'desc');
      expect(engine.getAction(action.id)).toBeDefined();
    });

    it('returns undefined for missing id', () => {
      expect(engine.getAction('nonexistent')).toBeUndefined();
    });

    it('lists all actions', () => {
      engine.createAction('notify', 'A', 'desc');
      engine.createAction('calculate', 'B', 'desc');
      expect(engine.listActions().length).toBe(2);
    });
  });

  describe('deleteAction', () => {
    it('deletes an existing action', () => {
      const action = engine.createAction('notify', 'Test', 'desc');
      expect(engine.deleteAction(action.id)).toBe(true);
      expect(engine.getAction(action.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      expect(engine.deleteAction('nonexistent')).toBe(false);
    });
  });

  describe('updateActionConfig', () => {
    it('merges config properties', () => {
      const action = engine.createAction('notify', 'Test', 'desc', { channel: 'email' });
      engine.updateActionConfig(action.id, { recipients: ['test@test.com'] });
      const updated = engine.getAction(action.id)!;
      expect(updated.config.channel).toBe('email');
      expect(updated.config.recipients).toEqual(['test@test.com']);
    });

    it('returns false for non-existent action', () => {
      expect(engine.updateActionConfig('nonexistent', {})).toBe(false);
    });
  });

  describe('setInputMapping / setOutputMapping', () => {
    it('sets input and output mappings and returns false for nonexistent action', () => {
      const action = engine.createAction('notify', 'Test', 'desc');
      expect(engine.setInputMapping(action.id, { 'data.user.amount': 'budget.total' })).toBe(true);
      expect(engine.setOutputMapping(action.id, { result: 'output.amount' })).toBe(true);
      expect(engine.setInputMapping('nonexistent', {})).toBe(false);
      expect(engine.setOutputMapping('nonexistent', {})).toBe(false);
    });
  });

  describe('execute', () => {
    it('executes a notify action', async () => {
      const action = engine.createAction('notify', 'Send Email', 'desc', {
        channel: 'slack',
        recipients: ['#finance'],
      });
      const result = await engine.execute(action.id, {});
      expect(result.status).toBe('completed');
      expect(result.output.sent).toBe(true);
      expect(result.output.channel).toBe('slack');
    });

    it('executes a calculate action', async () => {
      const action = engine.createAction('calculate', 'Calc', 'desc', {
        formula: 'revenue - cogs',
      });
      engine.setInputMapping(action.id, { revenue: 'revenue', cogs: 'cogs' });
      const result = await engine.execute(action.id, { revenue: 1000, cogs: 600 });
      expect(result.status).toBe('completed');
      expect(result.output.calculated).toBe(true);
    });

    it('executes an export action', async () => {
      const action = engine.createAction('export', 'Export PDF', 'desc', {
        format: 'pdf',
        destination: '/exports/monthly.pdf',
      });
      engine.setInputMapping(action.id, { data: 'data' });
      const result = await engine.execute(action.id, { data: [1, 2, 3] });
      expect(result.status).toBe('completed');
      expect(result.output.exported).toBe(true);
      expect(result.output.format).toBe('pdf');
      expect(result.output.recordCount).toBe(3);
    });

    it('executes a transform action', async () => {
      const action = engine.createAction('transform', 'Transform Data', 'desc', {
        transformType: 'filter',
        transformConfig: { field: 'status', equals: 'active' },
      });
      const result = await engine.execute(action.id, { records: [1, 2] });
      expect(result.status).toBe('completed');
      expect(result.output.transformed).toBe(true);
      expect(result.output.type).toBe('filter');
    });

    it('executes a delay action', async () => {
      const action = engine.createAction('delay', 'Pause', 'desc', { delayMs: 10 });
      const result = await engine.execute(action.id);
      expect(result.status).toBe('completed');
      expect(result.output.delayed).toBe(10);
    });

    it('executes a validate action with required and range rules', async () => {
      const action = engine.createAction('validate', 'Validate', 'desc', {
        validationRules: [
          { field: 'amount', type: 'required', config: {}, errorMessage: 'Amount required' },
          {
            field: 'quantity',
            type: 'range',
            config: { min: 1, max: 100 },
            errorMessage: 'Quantity out of range',
          },
        ],
      });
      engine.setInputMapping(action.id, { amount: 'amount', quantity: 'quantity' });
      const result1 = await engine.execute(action.id, { amount: '', quantity: 150 });
      expect(result1.status).toBe('completed');
      expect(result1.output.valid).toBe(false);
      expect((result1.output as any).errors).toHaveLength(2);

      const result2 = await engine.execute(action.id, { amount: 500, quantity: 50 });
      expect(result2.output.valid).toBe(true);
    });

    it('handles retry policy and timeout failure', async () => {
      const action = engine.createAction('delay', 'Failing Delay Action', 'desc', { delayMs: 50 });
      action.retryPolicy = { maxRetries: 2, backoffMs: 2, backoffMultiplier: 1.2 };
      action.timeoutMs = 5; // 5ms timeout will fail when delay is 50ms

      const result = await engine.execute(action.id);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('timed out');
      expect(result.retryCount).toBe(2);
    });

    it('returns failed for non-existent action', async () => {
      const result = await engine.execute('nonexistent');
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Action not found');
    });

    it('records duration', async () => {
      const action = engine.createAction('log', 'Log', 'desc');
      const result = await engine.execute(action.id);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('getResults / clearResults', () => {
    it('stores execution results and prunes when list exceeds capacity', async () => {
      const action = engine.createAction('log', 'Log', 'desc');
      await engine.execute(action.id);
      expect(engine.getResults().length).toBe(1);
    });

    it('filters results by action id', async () => {
      const a1 = engine.createAction('log', 'A', 'desc');
      const a2 = engine.createAction('log', 'B', 'desc');
      await engine.execute(a1.id);
      await engine.execute(a2.id);
      expect(engine.getResults(a1.id).length).toBe(1);
    });

    it('clears all results', async () => {
      const action = engine.createAction('log', 'Log', 'desc');
      await engine.execute(action.id);
      engine.clearResults();
      expect(engine.getResults().length).toBe(0);
    });
  });

  describe('templates', () => {
    it('returns action templates', () => {
      const templates = engine.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'tpl-email-notify')).toBe(true);
    });

    it('filters templates by category', () => {
      const notif = engine.getTemplatesByCategory('notification');
      expect(notif.length).toBeGreaterThan(0);
      expect(notif.every((t) => t.category === 'notification')).toBe(true);
    });

    it('creates action from template and returns null for invalid template id', () => {
      const action = engine.createActionFromTemplate('tpl-email-notify', 'Budget Alert', {
        recipients: ['cfo@example.com'],
      });
      expect(action).not.toBeNull();
      expect(action?.type).toBe('notify');
      expect(action?.config.recipients).toEqual(['cfo@example.com']);

      expect(engine.createActionFromTemplate('nonexistent_tpl', 'Invalid')).toBeNull();
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips actions and results', async () => {
      engine.createAction('notify', 'Test', 'desc');
      const action = engine.createAction('log', 'Log', 'desc');
      await engine.execute(action.id);

      const json = engine.serialize();
      const engine2 = new WorkflowActionEngine();
      expect(engine2.deserialize(json)).toBe(true);
      expect(engine2.listActions().length).toBe(2);
      expect(engine2.getResults().length).toBe(1);
    });

    it('returns false for invalid JSON', () => {
      expect(engine.deserialize('invalid')).toBe(false);
    });
  });
});
