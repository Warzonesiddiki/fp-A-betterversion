export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'formula'
  | 'select'
  | 'boolean';

export type FieldValue = string | number | boolean | null;

export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue?: FieldValue;
  options?: string[];
  formula?: string;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  appliesTo: string[];
}

class SafeMathParser {
  private pos = 0;
  private input = '';

  parse(expression: string): number {
    this.input = expression.replace(/\s+/g, '');
    this.pos = 0;
    if (this.input.length === 0) return 0;
    const result = this.parseExpression();
    if (this.pos !== this.input.length) {
      throw new Error(`Unexpected character at position ${this.pos}`);
    }
    return result;
  }

  private parseExpression(): number {
    let left = this.parseTerm();
    while (this.pos < this.input.length) {
      const op = this.input[this.pos];
      if (op === '+' || op === '-') {
        this.pos++;
        const right = this.parseTerm();
        left = op === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();
    while (this.pos < this.input.length) {
      const op = this.input[this.pos];
      if (op === '*' || op === '/') {
        this.pos++;
        const right = this.parseFactor();
        if (op === '/') {
          if (right === 0) throw new Error('Division by zero');
          left = left / right;
        } else {
          left = left * right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  private parseFactor(): number {
    if (this.input[this.pos] === '(') {
      this.pos++;
      const result = this.parseExpression();
      if (this.input[this.pos] === ')') {
        this.pos++;
      }
      return result;
    }
    if (this.input[this.pos] === '-') {
      this.pos++;
      return -this.parseFactor();
    }
    const start = this.pos;
    while (
      this.pos < this.input.length &&
      ((this.input[this.pos] >= '0' && this.input[this.pos] <= '9') || this.input[this.pos] === '.')
    ) {
      this.pos++;
    }
    if (this.pos === start) {
      throw new Error(`Expected number at position ${this.pos}`);
    }
    return parseFloat(this.input.slice(start, this.pos));
  }
}

export class CustomFieldEngine {
  private definitions: FieldDefinition[] = [];
  private mathParser = new SafeMathParser();

  defineField(definition: FieldDefinition): void {
    this.definitions.push(Object.freeze(definition));
  }

  getValue(fieldId: string, context: Record<string, FieldValue>): FieldValue {
    const field = this.definitions.find((f) => f.id === fieldId);
    if (!field) return null;

    if (field.type === 'formula' && field.formula) {
      return this.evaluateFormula(field.formula, context);
    }

    return context[fieldId] ?? field.defaultValue ?? null;
  }

  validateField(fieldId: string, value: FieldValue): boolean {
    const field = this.definitions.find((f) => f.id === fieldId);
    if (!field) return true;

    if (field.required && (value === null || value === undefined || value === '')) return false;

    if (field.validation) {
      const { min, max, pattern } = field.validation;
      if (typeof value === 'number') {
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
      }
      if (typeof value === 'string' && pattern) {
        return new RegExp(pattern).test(value);
      }
    }

    if (field.type === 'select' && field.options) {
      return field.options.includes(String(value));
    }

    return true;
  }

  getFieldDefinitions(): FieldDefinition[] {
    return [...this.definitions];
  }

  private evaluateFormula(formula: string, context: Record<string, FieldValue>): number | null {
    try {
      let resolved = formula;
      const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        const value = context[key];
        if (typeof value === 'number') {
          resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        } else {
          return null;
        }
      }
      return this.mathParser.parse(resolved);
    } catch {
      return null;
    }
  }
}
