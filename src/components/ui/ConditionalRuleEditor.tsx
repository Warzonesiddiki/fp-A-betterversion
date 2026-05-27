import type {
  ConditionalFormatRule,
  RuleType,
  Operator,
  VisualType,
  IconSetType,
  ColorScaleType,
  DataBarStyle,
} from '@/engines/ConditionalFormattingEngine';
import { evaluateRule } from '@/engines/ConditionalFormattingEngine';
import { ConditionalCellRenderer } from './ConditionalFormattingRenderers';
import { cn } from '@/utils/cn';

// ── Types ───────────────────────────────────────────────────────────

export interface ConditionalRuleEditorProps {
  rule: ConditionalFormatRule;
  onChange: (_rule: ConditionalFormatRule) => void;
  onCancel: () => void;
  onSave: () => void;
}

// ── Constants ───────────────────────────────────────────────────────

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'cellValue', label: 'Cell Value' },
  { value: 'text', label: 'Text' },
  { value: 'formula', label: 'Formula' },
  { value: 'rank', label: 'Rank' },
  { value: 'average', label: 'Average' },
];

const OPERATORS: { value: Operator; label: string; needsValue: boolean; needsValue2: boolean }[] = [
  { value: 'greaterThan', label: 'Greater Than', needsValue: true, needsValue2: false },
  {
    value: 'greaterThanOrEqual',
    label: 'Greater Than or Equal',
    needsValue: true,
    needsValue2: false,
  },
  { value: 'lessThan', label: 'Less Than', needsValue: true, needsValue2: false },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal', needsValue: true, needsValue2: false },
  { value: 'between', label: 'Between', needsValue: true, needsValue2: true },
  { value: 'equal', label: 'Equal To', needsValue: true, needsValue2: false },
  { value: 'notEqual', label: 'Not Equal To', needsValue: true, needsValue2: false },
  { value: 'contains', label: 'Contains', needsValue: false, needsValue2: false },
  { value: 'startsWith', label: 'Starts With', needsValue: false, needsValue2: false },
  { value: 'endsWith', label: 'Ends With', needsValue: false, needsValue2: false },
  { value: 'topN', label: 'Top N', needsValue: false, needsValue2: false },
  { value: 'bottomN', label: 'Bottom N', needsValue: false, needsValue2: false },
  { value: 'aboveAverage', label: 'Above Average', needsValue: false, needsValue2: false },
  { value: 'belowAverage', label: 'Below Average', needsValue: false, needsValue2: false },
];

const VISUAL_TYPES: { value: VisualType; label: string }[] = [
  { value: 'backgroundColor', label: 'Background Color' },
  { value: 'textColor', label: 'Text Color' },
  { value: 'dataBar', label: 'Data Bar' },
  { value: 'iconSet', label: 'Icon Set' },
  { value: 'colorScale', label: 'Color Scale' },
];

const ICON_SET_TYPES: { value: IconSetType; label: string }[] = [
  { value: '3-arrows', label: '3 Arrows' },
  { value: '3-traffic-lights', label: '3 Traffic Lights' },
  { value: '3-stars', label: '3 Stars' },
  { value: '4-traffic-lights', label: '4 Traffic Lights' },
  { value: '5-ratings', label: '5 Ratings' },
];

const PRESET_COLORS = [
  '#fee2e2',
  '#fef9c3',
  '#dcfce7',
  '#dbeafe',
  '#f3e8ff',
  '#fce7f3',
  '#ffedd5',
  '#e0f2fe',
  '#d1fae5',
  '#fef3c7',
];

// ── Rule Editor Component ───────────────────────────────────────────

export function ConditionalRuleEditor({
  rule,
  onChange,
  onCancel,
  onSave,
}: ConditionalRuleEditorProps) {
  const updateCondition = (patch: Partial<typeof rule.condition>) => {
    onChange({ ...rule, condition: { ...rule.condition, ...patch } });
  };

  const updateStyle = (patch: Partial<NonNullable<typeof rule.style>>) => {
    onChange({ ...rule, style: { ...rule.style, ...patch } });
  };

  const op = OPERATORS.find((o) => o.value === rule.condition.operator);
  const needsText = ['contains', 'startsWith', 'endsWith', 'equal', 'notEqual'].includes(
    rule.condition.operator
  );

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Rule Name
        </label>
        <input
          type="text"
          value={rule.name}
          onChange={(e) => onChange({ ...rule, name: e.target.value })}
          className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
          placeholder="e.g. Highlight negative variance"
        />
      </div>

      {/* Rule Type + Operator */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Rule Type
          </label>
          <select
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
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Operator
          </label>
          <select
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

      {/* Value inputs */}
      {op?.needsValue && (
        <div className={cn('grid gap-3', op.needsValue2 ? 'grid-cols-2' : 'grid-cols-1')}>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Value
            </label>
            <input
              type="number"
              value={rule.condition.value ?? ''}
              onChange={(e) => updateCondition({ value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm tabular-nums"
            />
          </div>
          {op.needsValue2 && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Value 2
              </label>
              <input
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
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Text
          </label>
          <input
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
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Formula
          </label>
          <input
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
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            N (count)
          </label>
          <input
            type="number"
            value={rule.condition.rankValue ?? 10}
            onChange={(e) => updateCondition({ rankValue: parseInt(e.target.value) || 10 })}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm tabular-nums"
            min={1}
          />
        </div>
      )}

      {/* Visual Type */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Visual Format
        </label>
        <select
          value={rule.visualType}
          onChange={(e) => onChange({ ...rule, visualType: e.target.value as VisualType })}
          className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
        >
          {VISUAL_TYPES.map((vt) => (
            <option key={vt.value} value={vt.value}>
              {vt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Style options for backgroundColor / textColor */}
      {(rule.visualType === 'backgroundColor' || rule.visualType === 'textColor') && (
        <div className="space-y-3">
          {rule.visualType === 'backgroundColor' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={rule.style?.backgroundColor ?? '#dcfce7'}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="h-8 w-8 rounded border cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateStyle({ backgroundColor: c })}
                      className={cn(
                        'h-5 w-5 rounded border border-[var(--border-default)] hover:scale-110 transition-transform',
                        rule.style?.backgroundColor === c && 'ring-2 ring-blue-500 ring-offset-1'
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {rule.visualType === 'textColor' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={rule.style?.textColor ?? '#166534'}
                  onChange={(e) => updateStyle({ textColor: e.target.value })}
                  className="h-8 w-8 rounded border cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Icon Set options */}
      {rule.visualType === 'iconSet' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Icon Set
            </label>
            <select
              value={rule.iconSet?.type ?? '3-arrows'}
              onChange={(e) =>
                onChange({
                  ...rule,
                  iconSet: {
                    type: e.target.value as IconSetType,
                    reverse: rule.iconSet?.reverse ?? false,
                    showIconOnly: rule.iconSet?.showIconOnly ?? false,
                  },
                })
              }
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
            >
              {ICON_SET_TYPES.map((ist) => (
                <option key={ist.value} value={ist.value}>
                  {ist.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rule.iconSet?.reverse ?? false}
              onChange={(e) =>
                onChange({
                  ...rule,
                  iconSet: {
                    type: rule.iconSet?.type ?? '3-arrows',
                    reverse: e.target.checked,
                    showIconOnly: rule.iconSet?.showIconOnly ?? false,
                  },
                })
              }
              className="rounded"
            />
            Reverse icon order
          </label>
        </div>
      )}

      {/* Color Scale options */}
      {rule.visualType === 'colorScale' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Scale Type
            </label>
            <select
              value={rule.colorScale?.type ?? '2-color'}
              onChange={(e) =>
                onChange({
                  ...rule,
                  colorScale: {
                    type: e.target.value as ColorScaleType,
                    minColor: rule.colorScale?.minColor ?? '#fee2e2',
                    midColor: rule.colorScale?.midColor ?? '#fef9c3',
                    maxColor: rule.colorScale?.maxColor ?? '#dcfce7',
                  },
                })
              }
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
            >
              <option value="2-color">2-Color Scale</option>
              <option value="3-color">3-Color Scale</option>
            </select>
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Min
              </label>
              <input
                type="color"
                value={rule.colorScale?.minColor ?? '#fee2e2'}
                onChange={(e) =>
                  onChange({
                    ...rule,
                    colorScale: { ...rule.colorScale!, minColor: e.target.value },
                  })
                }
                className="h-8 w-8 rounded border cursor-pointer"
              />
            </div>
            {rule.colorScale?.type === '3-color' && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Mid
                </label>
                <input
                  type="color"
                  value={rule.colorScale?.midColor ?? '#fef9c3'}
                  onChange={(e) =>
                    onChange({
                      ...rule,
                      colorScale: { ...rule.colorScale!, midColor: e.target.value },
                    })
                  }
                  className="h-8 w-8 rounded border cursor-pointer"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Max
              </label>
              <input
                type="color"
                value={rule.colorScale?.maxColor ?? '#dcfce7'}
                onChange={(e) =>
                  onChange({
                    ...rule,
                    colorScale: { ...rule.colorScale!, maxColor: e.target.value },
                  })
                }
                className="h-8 w-8 rounded border cursor-pointer"
              />
            </div>
          </div>
          {/* Preview gradient */}
          <div
            className="h-4 rounded-full"
            style={{
              background:
                rule.colorScale?.type === '3-color'
                  ? `linear-gradient(to right, ${rule.colorScale?.minColor}, ${rule.colorScale?.midColor}, ${rule.colorScale?.maxColor})`
                  : `linear-gradient(to right, ${rule.colorScale?.minColor}, ${rule.colorScale?.maxColor})`,
            }}
          />
        </div>
      )}

      {/* Data Bar options */}
      {rule.visualType === 'dataBar' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Bar Style
            </label>
            <select
              value={rule.dataBar?.style ?? 'solid'}
              onChange={(e) =>
                onChange({
                  ...rule,
                  dataBar: {
                    style: e.target.value as DataBarStyle,
                    barColor: rule.dataBar?.barColor ?? '#3b82f6',
                    showAxis: rule.dataBar?.showAxis ?? false,
                    showValue: rule.dataBar?.showValue ?? true,
                  },
                })
              }
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm"
            >
              <option value="solid">Solid</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Bar Color</label>
            <input
              type="color"
              value={rule.dataBar?.barColor ?? '#3b82f6'}
              onChange={(e) =>
                onChange({
                  ...rule,
                  dataBar: { ...rule.dataBar!, barColor: e.target.value },
                })
              }
              className="h-7 w-7 rounded border cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Priority */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Priority (higher = applied first)
        </label>
        <input
          type="number"
          value={rule.priority}
          onChange={(e) => onChange({ ...rule, priority: parseInt(e.target.value) || 0 })}
          className="w-24 rounded border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm tabular-nums"
          min={0}
          max={1000}
        />
      </div>

      {/* Preview */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Preview
        </label>
        <div className="flex gap-2">
          {[10, 0, -10].map((val) => {
            const evaluated = evaluateRule(rule, val, [10, 0, -10]);
            return (
              <div
                key={val}
                className="flex-1 rounded border border-[var(--border-subtle)] px-2 py-1 text-center text-xs"
              >
                <div className="text-[var(--text-secondary)] mb-0.5">{val}</div>
                <ConditionalCellRenderer value={val} evaluated={evaluated} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
}
