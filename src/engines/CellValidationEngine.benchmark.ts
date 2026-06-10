import { describe, bench } from 'vitest';
import { CellValidationEngine, type ValidationRule } from './CellValidationEngine';

describe('CellValidationEngine Benchmark', () => {
  const numericRule: ValidationRule = {
    id: 'numeric-rule',
    cellRef: 'A1',
    type: 'range',
    params: { min: 0, max: 100 },
    message: 'Must be between 0 and 100',
    severity: 'error',
    blockSave: true,
  };

  const listRule: ValidationRule = {
    id: 'list-rule',
    cellRef: 'A1',
    type: 'allowed',
    params: { values: ['USD', 'EUR', 'GBP'] },
    message: 'Must be a valid currency',
    severity: 'error',
    blockSave: true,
  };

  const requiredRule: ValidationRule = {
    id: 'required-rule',
    cellRef: 'A1',
    type: 'required',
    params: {},
    message: 'Field is required',
    severity: 'error',
    blockSave: true,
  };

  CellValidationEngine.addRule(numericRule);
  CellValidationEngine.addRule(listRule);
  CellValidationEngine.addRule(requiredRule);

  bench(
    'validate 1,000,000 times (should be < 500ms)',
    () => {
      for (let i = 0; i < 1000000; i++) {
        CellValidationEngine.validate('A1', 50);
      }
    },
    { time: 500 }
  );
});
