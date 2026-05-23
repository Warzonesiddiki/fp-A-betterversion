// DataClassificationEngine — Sensitivity levels, PII detection, tagging
// Pure TypeScript, deterministic, no external dependencies

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export interface ClassificationTag {
  id: string;
  name: string;
  sensitivity: SensitivityLevel;
  description: string;
  color: string;
  autoDetect: boolean;
}

export interface ClassificationRule {
  id: string;
  name: string;
  fieldPattern: RegExp | string;
  valuePattern?: RegExp;
  sensitivity: SensitivityLevel;
  reason: string;
}

export interface ClassificationResult {
  field: string;
  sensitivity: SensitivityLevel;
  tags: string[];
  piiDetected: boolean;
  piiTypes: string[];
  matchedRules: string[];
}

export interface PIIType {
  name: string;
  pattern: RegExp;
  sensitivity: SensitivityLevel;
  description: string;
}

const DEFAULT_PII_TYPES: PIIType[] = [
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    sensitivity: 'confidential',
    description: 'Email address',
  },
  {
    name: 'phone',
    pattern: /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{4})/g,
    sensitivity: 'confidential',
    description: 'Phone number',
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    sensitivity: 'top_secret',
    description: 'Social Security Number',
  },
  {
    name: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    sensitivity: 'top_secret',
    description: 'Credit card number',
  },
  {
    name: 'ip_address',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    sensitivity: 'internal',
    description: 'IP address',
  },
  {
    name: 'date_of_birth',
    pattern: /\b(?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
    sensitivity: 'confidential',
    description: 'Date of birth',
  },
  {
    name: 'address',
    pattern: /\b\d+\s+[A-Za-z\s]+(?:St|Ave|Blvd|Rd|Dr|Ln|Way|Ct|Pl)\b/gi,
    sensitivity: 'confidential',
    description: 'Street address',
  },
  {
    name: 'bank_account',
    pattern: /\b\d{8,17}\b/g,
    sensitivity: 'top_secret',
    description: 'Bank account number',
  },
];

export class DataClassificationEngine {
  private tags: ClassificationTag[] = [];
  private rules: ClassificationRule[] = [];
  private piiTypes: PIIType[] = [...DEFAULT_PII_TYPES];

  addTag(tag: ClassificationTag): void {
    this.tags.push(tag);
  }

  removeTag(id: string): boolean {
    const idx = this.tags.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tags.splice(idx, 1);
    return true;
  }

  getTags(): ClassificationTag[] {
    return [...this.tags];
  }

  addRule(rule: ClassificationRule): void {
    this.rules.push(rule);
  }

  removeRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  getRules(): ClassificationRule[] {
    return [...this.rules];
  }

  addPIIType(piiType: PIIType): void {
    this.piiTypes.push(piiType);
  }

  detectPII(value: string): { detected: boolean; types: string[] } {
    const types: string[] = [];
    for (const pii of this.piiTypes) {
      if (pii.pattern.test(value)) {
        types.push(pii.name);
      }
    }
    return { detected: types.length > 0, types: [...new Set(types)] };
  }

  classifyField(fieldName: string, sampleValues: unknown[]): ClassificationResult {
    const matchedRules: string[] = [];
    let maxSensitivity: SensitivityLevel = 'public';
    const tags: string[] = [];
    let piiDetected = false;
    const piiTypes: string[] = [];

    const sensitivityOrder: SensitivityLevel[] = [
      'public',
      'internal',
      'confidential',
      'restricted',
      'top_secret',
    ];

    const fieldLower = fieldName.toLowerCase();
    for (const rule of this.rules) {
      const pattern =
        typeof rule.fieldPattern === 'string' ? rule.fieldPattern : rule.fieldPattern.source;
      if (new RegExp(pattern, 'i').test(fieldLower)) {
        matchedRules.push(rule.id);
        if (sensitivityOrder.indexOf(rule.sensitivity) > sensitivityOrder.indexOf(maxSensitivity)) {
          maxSensitivity = rule.sensitivity;
        }
      }
    }

    for (const value of sampleValues) {
      if (typeof value === 'string') {
        const pii = this.detectPII(value);
        if (pii.detected) {
          piiDetected = true;
          for (const type of pii.types) {
            if (!piiTypes.includes(type)) piiTypes.push(type);
            const piiDef = this.piiTypes.find((p) => p.name === type);
            if (
              piiDef &&
              sensitivityOrder.indexOf(piiDef.sensitivity) >
                sensitivityOrder.indexOf(maxSensitivity)
            ) {
              maxSensitivity = piiDef.sensitivity;
            }
          }
        }
      }

      for (const r of this.rules) {
        if (r.valuePattern && typeof value === 'string' && r.valuePattern.test(value)) {
          matchedRules.push(r.id);
        }
      }
    }

    for (const tag of this.tags) {
      if (sensitivityOrder.indexOf(tag.sensitivity) <= sensitivityOrder.indexOf(maxSensitivity)) {
        tags.push(tag.name);
      }
    }

    return {
      field: fieldName,
      sensitivity: maxSensitivity,
      tags: [...new Set(tags)],
      piiDetected,
      piiTypes: [...new Set(piiTypes)],
      matchedRules: [...new Set(matchedRules)],
    };
  }

  classifyDataset(data: Record<string, unknown>[]): ClassificationResult[] {
    if (data.length === 0) return [];
    const fields = Object.keys(data[0]);
    return fields.map((field) => {
      const values = data.map((row) => row[field]);
      return this.classifyField(field, values);
    });
  }

  getSensitiveFields(
    data: Record<string, unknown>[],
    minLevel: SensitivityLevel = 'confidential'
  ): ClassificationResult[] {
    const sensitivityOrder: SensitivityLevel[] = [
      'public',
      'internal',
      'confidential',
      'restricted',
      'top_secret',
    ];
    const minIdx = sensitivityOrder.indexOf(minLevel);
    return this.classifyDataset(data).filter(
      (r) => sensitivityOrder.indexOf(r.sensitivity) >= minIdx
    );
  }

  maskValue(value: unknown, piiType: string): unknown {
    if (typeof value !== 'string') return value;
    switch (piiType) {
      case 'email': {
        const parts = value.split('@');
        return parts.length === 2 ? `${parts[0][0]}***@${parts[1]}` : '***';
      }
      case 'phone':
        return value.replace(/\d/g, '*').replace(/\*{4}$/, '****');
      case 'ssn':
        return '***-**-' + value.slice(-4);
      case 'credit_card':
        return '****-****-****-' + value.slice(-4);
      default:
        return '***';
    }
  }
}

// Preset rules
export function createPIIDetectionRules(): ClassificationRule[] {
  return [
    {
      id: 'email-field',
      name: 'Email field',
      fieldPattern: /email|e_mail|mail/i,
      sensitivity: 'confidential',
      reason: 'Contains email addresses',
    },
    {
      id: 'phone-field',
      name: 'Phone field',
      fieldPattern: /phone|mobile|tel|fax/i,
      sensitivity: 'confidential',
      reason: 'Contains phone numbers',
    },
    {
      id: 'ssn-field',
      name: 'SSN field',
      fieldPattern: /ssn|social_security|national_id/i,
      sensitivity: 'top_secret',
      reason: 'Contains SSN',
    },
    {
      id: 'salary-field',
      name: 'Salary field',
      fieldPattern: /salary|wage|compensation|pay/i,
      sensitivity: 'restricted',
      reason: 'Contains compensation data',
    },
    {
      id: 'address-field',
      name: 'Address field',
      fieldPattern: /address|street|city|zip|postal/i,
      sensitivity: 'confidential',
      reason: 'Contains address data',
    },
    {
      id: 'dob-field',
      name: 'DOB field',
      fieldPattern: /dob|birth|birthday/i,
      sensitivity: 'confidential',
      reason: 'Contains date of birth',
    },
    {
      id: 'account-field',
      name: 'Account field',
      fieldPattern: /account|acct|iban|routing/i,
      sensitivity: 'top_secret',
      reason: 'Contains financial account data',
    },
    {
      id: 'name-field',
      name: 'Name field',
      fieldPattern: /name|first_name|last_name|full_name/i,
      sensitivity: 'internal',
      reason: 'Contains personal names',
    },
  ];
}
