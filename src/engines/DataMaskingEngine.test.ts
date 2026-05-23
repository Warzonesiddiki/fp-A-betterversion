import { describe, it, expect } from 'vitest';
import { DataMaskingEngine } from './DataMaskingEngine';

describe('DataMaskingEngine', () => {
  describe('mask', () => {
    it('should mask SSN for unauthorized role', () => {
      const engine = new DataMaskingEngine();
      const result = engine.mask('123-45-6789', 'ssn', 'viewer');
      expect(result.masked).toBe(true);
      expect(result.value).not.toBe('123-45-6789');
    });

    it('should not mask SSN for authorized role', () => {
      const engine = new DataMaskingEngine();
      const result = engine.mask('123-45-6789', 'ssn', 'admin');
      expect(result.masked).toBe(false);
      expect(result.value).toBe('123-45-6789');
    });

    it('should mask email for unauthorized role', () => {
      const engine = new DataMaskingEngine();
      const result = engine.mask('user@example.com', 'email', 'viewer');
      expect(result.masked).toBe(true);
    });

    it('should mask salary for unauthorized role', () => {
      const engine = new DataMaskingEngine();
      const result = engine.mask('100000', 'salary', 'viewer');
      expect(result.masked).toBe(true);
    });

    it('should not mask unknown field types', () => {
      const engine = new DataMaskingEngine();
      const result = engine.mask('hello', 'custom', 'viewer');
      expect(result.masked).toBe(false);
    });
  });

  describe('addRule', () => {
    it('should add a custom masking rule', () => {
      const engine = new DataMaskingEngine();
      engine.addRule({
        id: 'custom-rule',
        fieldType: 'custom',
        roles: ['admin'],
        maskPattern: '***',
        showLast: 0,
        enabled: true,
      });
      const result = engine.mask('secret', 'custom', 'viewer');
      expect(result.masked).toBe(true);
    });
  });
});
