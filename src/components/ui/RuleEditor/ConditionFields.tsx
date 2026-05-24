import type {
  ConditionalFormatRule,
  RuleType,
  Operator,
} from '@/engines/ConditionalFormattingEngine';
import { cn } from '@/utils/cn';
import { RULE_TYPES, OPERATORS } from '../ConditionalFormattingConstants';

interface ConditionFieldsProps {
  rule: ConditionalFormatRule;
  onChange: (rule: ConditionalFormatRule) => void;
}

export function ConditionFields({ rule, onChange }: ConditionFieldsProps) {
  const updateCondition = (patch: Partial<typeof rule.condition>) => {
    onChange({ ...rule, condition: { ...rule.condition, ...patch } });
  };

  const op = OPERATORS.find((o) => o.value === rule.condition.operator);
  const needsText = ['contains', 'startsWith', 'endsWith', 'equal', 'notEqual'].includes(
    rule.condition.operator
  );

  return (
    <>
      <div>
        <label
          htmlFor="rule-name"
          className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
        >
          Rule Name
        </label>
        <input
          id="rule-name"
          type="text"
          value={rule.name}
          onChange={(e) => onChange({ ...rule, name: e.target.value })}
          className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
          placeholder="e.g. Highlight negative variance"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="rule-type"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            Rule Type
          </label>
          <select
            id="rule-type"
            value={rule.condition.ruleType}
            onChange={(e) => updateCondition({ ruleType: e.target.value as RuleType })}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
          >
            {RULE_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="operator"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            Operator
          </label>
          <select
            id="operator"
            value={rule.condition.operator}
            onChange={(e) => updateCondition({ operator: e.target.value as Operator })}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
          >
            {OPERATORS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {op?.needsValue && (
        <div className={cn('grid gap-3', op.needsValue2 ? 'grid-cols-2' : 'grid-cols-1')}>
          <div>
            <label
              htmlFor="condition-value"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Value
            </label>
            <input
              id="condition-value"
              type="number"
              value={rule.condition.value ?? ''}
              onChange={(e) => updateCondition({ value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm tabular-nums"
            />
          </div>
          {op.needsValue2 && (
            <div>
              <label
                htmlFor="condition-value2"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                Value 2
              </label>
              <input
                id="condition-value2"
                type="number"
                value={rule.condition.value2 ?? ''}
                onChange={(e) => updateCondition({ value2: parseFloat(e.target.value) || 0 })}
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm tabular-nums"
              />
            </div>
          )}
        </div>
      )}

      {needsText && (
        <div>
          <label
            htmlFor="condition-text"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            Text
          </label>
          <input
            id="condition-text"
            type="text"
            value={rule.condition.text ?? ''}
            onChange={(e) => updateCondition({ text: e.target.value })}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
            placeholder="Enter text..."
          />
        </div>
      )}

      {rule.condition.ruleType === 'formula' && (
        <div>
          <label
            htmlFor="condition-formula"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            Formula
          </label>
          <input
            id="condition-formula"
            type="text"
            value={rule.condition.formula ?? ''}
            onChange={(e) => updateCondition({ formula: e.target.value })}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm font-mono"
            placeholder="=A1>100"
          />
        </div>
      )}

      {(rule.condition.operator === 'topN' || rule.condition.operator === 'bottomN') && (
        <div>
          <label
            htmlFor="condition-rank"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            N (count)
          </label>
          <input
            id="condition-rank"
            type="number"
            value={rule.condition.rankValue ?? 10}
            onChange={(e) => updateCondition({ rankValue: parseInt(e.target.value) || 10 })}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm tabular-nums"
            min={1}
          />
        </div>
      )}
    </>
  );
}
