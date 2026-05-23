// Data Masking Engine - Mask sensitive data based on role
// Pure TypeScript, no external dependencies

export type FieldType =
  | 'ssn'
  | 'salary'
  | 'email'
  | 'phone'
  | 'account_number'
  | 'credit_card'
  | 'name'
  | 'address'
  | 'custom';

export interface MaskingRule {
  id: string;
  fieldType: FieldType;
  roles: string[]; // roles that can see unmasked data
  maskPattern: string; // e.g., 'XXX-XX-XXXX' for SSN
  showLast: number; // show last N characters
  enabled: boolean;
}

export interface MaskedResult {
  masked: boolean;
  value: string;
  originalType: FieldType;
}

const DEFAULT_RULES: MaskingRule[] = [
  {
    id: 'ssn',
    fieldType: 'ssn',
    roles: ['admin', 'hr'],
    maskPattern: 'XXX-XX-',
    showLast: 4,
    enabled: true,
  },
  {
    id: 'salary',
    fieldType: 'salary',
    roles: ['admin', 'hr', 'finance'],
    maskPattern: '$***,***',
    showLast: 0,
    enabled: true,
  },
  {
    id: 'email',
    fieldType: 'email',
    roles: ['admin'],
    maskPattern: '***@***.***',
    showLast: 0,
    enabled: true,
  },
  {
    id: 'phone',
    fieldType: 'phone',
    roles: ['admin'],
    maskPattern: '(***) ***-',
    showLast: 4,
    enabled: true,
  },
  {
    id: 'account_number',
    fieldType: 'account_number',
    roles: ['admin', 'finance'],
    maskPattern: '****',
    showLast: 4,
    enabled: true,
  },
  {
    id: 'credit_card',
    fieldType: 'credit_card',
    roles: ['admin'],
    maskPattern: '**** **** **** ',
    showLast: 4,
    enabled: true,
  },
];

export class DataMaskingEngine {
  private rules: MaskingRule[];

  constructor(rules?: MaskingRule[]) {
    this.rules = rules ?? DEFAULT_RULES.map((r) => ({ ...r }));
  }

  mask(value: unknown, fieldType: FieldType, userRole: string): MaskedResult {
    const rule = this.rules.find((r) => r.fieldType === fieldType && r.enabled);
    if (!rule) return { masked: false, value: String(value), originalType: fieldType };
    if (rule.roles.includes(userRole))
      return { masked: false, value: String(value), originalType: fieldType };

    const str = String(value);
    if (!str) return { masked: true, value: '', originalType: fieldType };

    if (rule.showLast > 0 && str.length > rule.showLast) {
      const visible = str.slice(-rule.showLast);
      const masked = rule.maskPattern + visible;
      return { masked: true, value: masked, originalType: fieldType };
    }

    return { masked: true, value: rule.maskPattern, originalType: fieldType };
  }

  maskSSN(value: string, userRole: string): MaskedResult {
    return this.mask(value, 'ssn', userRole);
  }

  maskSalary(value: number | string, userRole: string): MaskedResult {
    return this.mask(value, 'salary', userRole);
  }

  maskEmail(value: string, userRole: string): MaskedResult {
    return this.mask(value, 'email', userRole);
  }

  maskPhone(value: string, userRole: string): MaskedResult {
    return this.mask(value, 'phone', userRole);
  }

  maskObject(
    obj: Record<string, unknown>,
    fieldTypes: Record<string, FieldType>,
    userRole: string
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      const fieldType = fieldTypes[key];
      if (fieldType) {
        result[key] = this.mask(val, fieldType, userRole);
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  addRule(rule: MaskingRule): void {
    this.rules = this.rules.filter((r) => r.id !== rule.id);
    this.rules.push(rule);
  }

  removeRule(ruleId: string): boolean {
    const before = this.rules.length;
    this.rules = this.rules.filter((r) => r.id !== ruleId);
    return this.rules.length < before;
  }

  getRules(): MaskingRule[] {
    return [...this.rules];
  }

  getRule(fieldType: FieldType): MaskingRule | undefined {
    return this.rules.find((r) => r.fieldType === fieldType);
  }

  serialize(): string {
    return JSON.stringify(this.rules);
  }

  deserialize(json: string): void {
    this.rules = JSON.parse(json);
  }
}
