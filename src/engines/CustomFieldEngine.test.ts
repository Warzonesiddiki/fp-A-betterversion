import { describe, it, expect, beforeEach } from 'vitest';
import { CustomFieldEngine, type FieldDefinition } from './CustomFieldEngine';

describe('CustomFieldEngine', () => {
  let engine: CustomFieldEngine;

  beforeEach(() => {
    engine = new CustomFieldEngine();
  });

  const textField: FieldDefinition = {
    id: 'notes',
    name: 'Notes',
    type: 'text',
    required: false,
    appliesTo: ['budget'],
  };

  const numberField: FieldDefinition = {
    id: 'risk_score',
    name: 'Risk Score',
    type: 'number',
    required: true,
    validation: { min: 0, max: 100, message: 'Must be 0-100' },
    appliesTo: ['budget'],
  };

  const selectField: FieldDefinition = {
    id: 'status',
    name: 'Status',
    type: 'select',
    required: true,
    options: ['Active', 'Inactive', 'Pending'],
    appliesTo: ['forecast'],
  };

  const formulaField: FieldDefinition = {
    id: 'total',
    name: 'Total',
    type: 'formula',
    required: false,
    formula: 'a + b',
    appliesTo: ['budget'],
  };

  describe('defineField', () => {
    it('should define a new field', () => {
      engine.defineField(textField);
      const defs = engine.getFieldDefinitions();
      expect(defs).toHaveLength(1);
    });
  });

  describe('getValue', () => {
    it('should return context value for text field', () => {
      engine.defineField(textField);
      expect(engine.getValue('notes', { notes: 'hello' })).toBe('hello');
    });

    it('should return default value when context missing', () => {
      engine.defineField({ ...textField, defaultValue: 'default' });
      expect(engine.getValue('notes', {})).toBe('default');
    });

    it('should return null for undefined field', () => {
      expect(engine.getValue('nonexistent', {})).toBeNull();
    });

    it('should evaluate formula field', () => {
      engine.defineField(formulaField);
      const result = engine.getValue('total', { a: 5, b: 3 });
      expect(result).toBe(8);
    });
  });

  describe('validateField', () => {
    it('should validate required field', () => {
      engine.defineField(numberField);
      expect(engine.validateField('risk_score', null)).toBe(false);
      expect(engine.validateField('risk_score', 50)).toBe(true);
    });

    it('should validate number range', () => {
      engine.defineField(numberField);
      expect(engine.validateField('risk_score', -1)).toBe(false);
      expect(engine.validateField('risk_score', 101)).toBe(false);
      expect(engine.validateField('risk_score', 50)).toBe(true);
    });

    it('should validate select options', () => {
      engine.defineField(selectField);
      expect(engine.validateField('status', 'Active')).toBe(true);
      expect(engine.validateField('status', 'Invalid')).toBe(false);
    });

    it('should return true for undefined field', () => {
      expect(engine.validateField('unknown', 'anything')).toBe(true);
    });

    it('should validate regex pattern on string', () => {
      const pattern: FieldDefinition = {
        id: 'code',
        name: 'Code',
        type: 'text',
        required: false,
        validation: { pattern: '^[A-Z]{3}$', message: 'Invalid code' },
        appliesTo: ['budget'],
      };
      engine.defineField(pattern);
      expect(engine.validateField('code', 'ABC')).toBe(true);
      expect(engine.validateField('code', 'ab')).toBe(false);
    });
  });
});
