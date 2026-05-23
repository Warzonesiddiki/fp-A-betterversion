import { describe, it, expect, beforeEach } from 'vitest';
import {
  DataClassificationEngine,
  createPIIDetectionRules,
  type ClassificationTag,
  type PIIType,
} from './DataClassificationEngine';

// =============================================================================
// DataClassificationEngine Tests
// =============================================================================

describe('DataClassificationEngine', () => {
  let engine: DataClassificationEngine;

  beforeEach(() => {
    engine = new DataClassificationEngine();
    // Reset global regex lastIndex state (shared DEFAULT_PII_TYPES regex objects
    // retain lastIndex across engine instances due to shallow copy)
    const piiTypes = (engine as unknown as { piiTypes: PIIType[] }).piiTypes;
    for (const pii of piiTypes) {
      pii.pattern.lastIndex = 0;
    }
  });

  describe('tags', () => {
    it('should add a tag', () => {
      const tag: ClassificationTag = {
        id: 't1',
        name: 'PII',
        sensitivity: 'confidential',
        description: 'Personal data',
        color: '#ff0000',
        autoDetect: true,
      };
      engine.addTag(tag);
      expect(engine.getTags()).toHaveLength(1);
      expect(engine.getTags()[0].name).toBe('PII');
    });

    it('should remove a tag', () => {
      engine.addTag({
        id: 't1',
        name: 'PII',
        sensitivity: 'confidential',
        description: '',
        color: '',
        autoDetect: true,
      });
      expect(engine.removeTag('t1')).toBe(true);
      expect(engine.getTags()).toHaveLength(0);
    });

    it('should return false when removing non-existent tag', () => {
      expect(engine.removeTag('nonexistent')).toBe(false);
    });

    it('should list all tags', () => {
      engine.addTag({
        id: 't1',
        name: 'A',
        sensitivity: 'public',
        description: '',
        color: '',
        autoDetect: false,
      });
      engine.addTag({
        id: 't2',
        name: 'B',
        sensitivity: 'internal',
        description: '',
        color: '',
        autoDetect: false,
      });
      expect(engine.getTags()).toHaveLength(2);
    });
  });

  describe('rules', () => {
    it('should add a rule', () => {
      engine.addRule({
        id: 'r1',
        name: 'Email rule',
        fieldPattern: /email/i,
        sensitivity: 'confidential',
        reason: 'Email field',
      });
      expect(engine.getRules()).toHaveLength(1);
    });

    it('should remove a rule', () => {
      engine.addRule({ id: 'r1', name: 'R', fieldPattern: /x/, sensitivity: 'public', reason: '' });
      expect(engine.removeRule('r1')).toBe(true);
      expect(engine.getRules()).toHaveLength(0);
    });

    it('should return false when removing non-existent rule', () => {
      expect(engine.removeRule('nonexistent')).toBe(false);
    });

    it('should support string field patterns', () => {
      engine.addRule({
        id: 'r1',
        name: 'R',
        fieldPattern: 'email',
        sensitivity: 'confidential',
        reason: '',
      });
      const result = engine.classifyField('user_email', ['test@example.com']);
      expect(result.matchedRules).toContain('r1');
    });

    it('should support RegExp field patterns', () => {
      engine.addRule({
        id: 'r1',
        name: 'R',
        fieldPattern: /ssn|social/i,
        sensitivity: 'top_secret',
        reason: '',
      });
      const result = engine.classifyField('employee_ssn', ['123-45-6789']);
      expect(result.matchedRules).toContain('r1');
    });
  });

  describe('PII detection', () => {
    it('should detect email addresses', () => {
      const result = engine.detectPII('Contact john@example.com for details');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('email');
    });

    it('should detect phone numbers', () => {
      const result = engine.detectPII('Call 555-123-4567');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('phone');
    });

    it('should detect SSN', () => {
      const result = engine.detectPII('SSN: 123-45-6789');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('ssn');
    });

    it('should detect credit card numbers', () => {
      const result = engine.detectPII('Card: 4111-1111-1111-1111');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('credit_card');
    });

    it('should detect IP addresses', () => {
      const result = engine.detectPII('Server at 192.168.1.1');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('ip_address');
    });

    it('should detect date of birth', () => {
      const result = engine.detectPII('DOB: 01/15/1990');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('date_of_birth');
    });

    it('should detect street addresses', () => {
      const result = engine.detectPII('123 Main St');
      expect(result.detected).toBe(true);
      expect(result.types).toContain('address');
    });

    it('should return no PII for clean text', () => {
      const result = engine.detectPII('Revenue is $1,000,000');
      expect(result.detected).toBe(false);
      expect(result.types).toHaveLength(0);
    });

    it('should detect multiple PII types in one string', () => {
      const result = engine.detectPII('Email john@test.com, phone 555-123-4567');
      expect(result.detected).toBe(true);
      expect(result.types.length).toBeGreaterThanOrEqual(2);
    });

    it('should deduplicate PII types', () => {
      const result = engine.detectPII('a@b.com and c@d.com');
      const emailCount = result.types.filter((t) => t === 'email').length;
      expect(emailCount).toBe(1);
    });
  });

  describe('addPIIType', () => {
    it('should add custom PII type', () => {
      engine.addPIIType({
        name: 'passport',
        pattern: /\b[A-Z]{2}\d{7}\b/g,
        sensitivity: 'top_secret',
        description: 'Passport number',
      });
      const result = engine.detectPII('Passport: AB1234567');
      expect(result.types).toContain('passport');
    });
  });

  describe('classifyField', () => {
    it('should classify a field with matching rule', () => {
      engine.addRule({
        id: 'r1',
        name: 'Email field',
        fieldPattern: /email/i,
        sensitivity: 'confidential',
        reason: 'Contains emails',
      });
      const result = engine.classifyField('user_email', ['john@test.com']);
      expect(result.field).toBe('user_email');
      expect(result.sensitivity).toBe('confidential');
      expect(result.matchedRules).toContain('r1');
      expect(result.piiDetected).toBe(true);
    });

    it('should use highest sensitivity from rules and PII', () => {
      engine.addRule({
        id: 'r1',
        name: 'Internal field',
        fieldPattern: /data/i,
        sensitivity: 'internal',
        reason: '',
      });
      // SSN has top_secret sensitivity, which is higher than internal
      const result = engine.classifyField('user_data', ['SSN: 123-45-6789']);
      expect(result.sensitivity).toBe('top_secret');
    });

    it('should default to public when no rules match', () => {
      const result = engine.classifyField('description', ['Just a description']);
      expect(result.sensitivity).toBe('public');
      expect(result.matchedRules).toHaveLength(0);
    });

    it('should include tags matching sensitivity level', () => {
      engine.addTag({
        id: 't1',
        name: 'Low',
        sensitivity: 'public',
        description: '',
        color: '',
        autoDetect: false,
      });
      engine.addTag({
        id: 't2',
        name: 'High',
        sensitivity: 'top_secret',
        description: '',
        color: '',
        autoDetect: false,
      });

      engine.addRule({
        id: 'r1',
        name: 'R',
        fieldPattern: /ssn/i,
        sensitivity: 'top_secret',
        reason: '',
      });
      const result = engine.classifyField('employee_ssn', ['123-45-6789']);

      // Tags with sensitivity <= field sensitivity are included
      expect(result.tags).toContain('Low');
      expect(result.tags).toContain('High');
    });

    it('should not include tags above field sensitivity', () => {
      engine.addTag({
        id: 't1',
        name: 'Top',
        sensitivity: 'top_secret',
        description: '',
        color: '',
        autoDetect: false,
      });

      const result = engine.classifyField('name', ['John']);
      // Field is public, tag is top_secret, so it should NOT be included
      expect(result.tags).not.toContain('Top');
    });

    it('should handle value patterns in rules', () => {
      engine.addRule({
        id: 'r1',
        name: 'Numeric only',
        fieldPattern: /amount/i,
        valuePattern: /^\d+$/,
        sensitivity: 'internal',
        reason: 'Numeric amount',
      });
      const result = engine.classifyField('total_amount', ['12345', '67890']);
      expect(result.matchedRules).toContain('r1');
    });
  });

  describe('classifyDataset', () => {
    it('should classify all fields in a dataset', () => {
      engine.addRule({
        id: 'r1',
        name: 'Email',
        fieldPattern: /email/i,
        sensitivity: 'confidential',
        reason: '',
      });

      const data = [
        { email: 'john@test.com', name: 'John' },
        { email: 'jane@test.com', name: 'Jane' },
      ];
      const results = engine.classifyDataset(data);
      expect(results).toHaveLength(2);
      expect(results.find((r) => r.field === 'email')!.sensitivity).toBe('confidential');
    });

    it('should return empty for empty dataset', () => {
      expect(engine.classifyDataset([])).toEqual([]);
    });

    it('should sample all rows for PII detection', () => {
      const data = [{ notes: 'No PII here' }, { notes: 'Contact john@test.com' }];
      const results = engine.classifyDataset(data);
      const notesResult = results.find((r) => r.field === 'notes')!;
      expect(notesResult.piiDetected).toBe(true);
    });
  });

  describe('getSensitiveFields', () => {
    it('should return only fields above minimum sensitivity', () => {
      engine.addRule({
        id: 'r1',
        name: 'SSN',
        fieldPattern: /ssn/i,
        sensitivity: 'top_secret',
        reason: '',
      });
      engine.addRule({
        id: 'r2',
        name: 'Name',
        fieldPattern: /name/i,
        sensitivity: 'internal',
        reason: '',
      });

      const data = [{ ssn: '123-45-6789', name: 'John', city: 'NYC' }];
      const sensitive = engine.getSensitiveFields(data, 'confidential');
      expect(sensitive.some((r) => r.field === 'ssn')).toBe(true);
      expect(sensitive.some((r) => r.field === 'name')).toBe(false); // internal < confidential
    });

    it('should default to confidential minimum', () => {
      const data = [{ city: 'NYC' }];
      const results = engine.getSensitiveFields(data);
      // city is public, below confidential threshold
      expect(results).toHaveLength(0);
    });
  });

  describe('maskValue', () => {
    it('should mask email', () => {
      const masked = engine.maskValue('john@example.com', 'email');
      expect(masked).toBe('j***@example.com');
    });

    it('should mask phone', () => {
      const masked = engine.maskValue('555-123-4567', 'phone');
      expect(masked).toBe('***-***-****');
    });

    it('should mask SSN', () => {
      const masked = engine.maskValue('123-45-6789', 'ssn');
      expect(masked).toBe('***-**-6789');
    });

    it('should mask credit card', () => {
      const masked = engine.maskValue('4111-1111-1111-1111', 'credit_card');
      expect(masked).toBe('****-****-****-1111');
    });

    it('should mask unknown types with ***', () => {
      const masked = engine.maskValue('secret data', 'unknown');
      expect(masked).toBe('***');
    });

    it('should return non-string values unchanged', () => {
      expect(engine.maskValue(12345, 'ssn')).toBe(12345);
      expect(engine.maskValue(null, 'email')).toBe(null);
    });

    it('should mask email without @ gracefully', () => {
      const masked = engine.maskValue('noatsign', 'email');
      expect(masked).toBe('***');
    });
  });

  describe('preset PII detection rules', () => {
    it('should create preset rules', () => {
      const rules = createPIIDetectionRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.id === 'email-field')).toBe(true);
      expect(rules.some((r) => r.id === 'ssn-field')).toBe(true);
      expect(rules.some((r) => r.id === 'salary-field')).toBe(true);
    });

    it('should work with engine when loaded', () => {
      for (const rule of createPIIDetectionRules()) {
        engine.addRule(rule);
      }

      const result = engine.classifyField('employee_email', ['john@test.com']);
      expect(result.matchedRules).toContain('email-field');
      expect(result.sensitivity).toBe('confidential');
    });
  });
});
