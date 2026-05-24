import { describe, it, expect, beforeEach } from 'vitest';
import { APIDocumentation } from '../apiDocumentation';

describe('APIDocumentation', () => {
  beforeEach(() => {
    // Reset engines before each test
    (APIDocumentation as any).engines = new Map();
  });

  it('registerEngine and generateEngineDoc', () => {
    APIDocumentation.registerEngine({
      name: 'TestEngine',
      description: 'A test engine',
      methods: [
        {
          name: 'run',
          description: 'Runs the engine',
          params: [],
          returns: { type: 'void', description: 'nothing' },
        },
      ],
      properties: [
        { name: 'version', type: 'string', description: 'Engine version', default: '1.0' },
      ],
      examples: ['const e = new TestEngine()'],
    });

    const doc = APIDocumentation.generateEngineDoc('TestEngine');
    expect(doc).toContain('# TestEngine');
    expect(doc).toContain('A test engine');
    expect(doc).toContain('`run`');
    expect(doc).toContain('`version`');
  });

  it('generateEngineDoc returns not found for missing engine', () => {
    const doc = APIDocumentation.generateEngineDoc('Missing');
    expect(doc).toContain('Documentation not found');
  });

  it('generateIndex returns formatted index', () => {
    APIDocumentation.registerEngine({
      name: 'FinancialEngine',
      description: 'Financial calculations',
      methods: [],
      properties: [],
      examples: [],
    });
    APIDocumentation.registerEngine({
      name: 'BudgetEngine',
      description: 'Budget calculations',
      methods: [],
      properties: [],
      examples: [],
    });

    const index = APIDocumentation.generateIndex();
    expect(index).toContain('FinPlan Pro API Reference');
    expect(index).toContain('FinancialEngine');
    expect(index).toContain('BudgetEngine');
  });

  it('getEngines returns all registered engines', () => {
    APIDocumentation.registerEngine({
      name: 'Engine1',
      description: 'desc',
      methods: [],
      properties: [],
      examples: [],
    });
    expect(APIDocumentation.getEngines()).toHaveLength(1);
  });
});
