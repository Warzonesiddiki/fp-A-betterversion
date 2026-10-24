import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type {
  ConditionalFormatRule,
  RuleType,
  Operator,
  VisualType,
  IconSetType,
  ColorScaleType,
  DataBarStyle,
  FormattingStyle,
  DataBarConfig,
  IconSetConfig,
  ColorScaleConfig,
} from '@/engines/ConditionalFormattingEngine';
import { generateRuleId } from '@/engines/ConditionalFormattingEngine';

// ── Option Constants ─────────────────────────────────────────────

const RULE_TYPE_OPTIONS: { value: RuleType; label: string }[] = [
  { value: 'cellValue', label: 'Cell Value' },
  { value: 'formula', label: 'Formula' },
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'rank', label: 'Rank' },
  { value: 'average', label: 'Above/Below Average' },
];

const OPERATOR_OPTIONS: { value: Operator; label: string }[] = [
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
  { value: 'equal', label: 'Equal To' },
  { value: 'notEqual', label: 'Not Equal To' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'topN', label: 'Top N' },
  { value: 'bottomN', label: 'Bottom N' },
  { value: 'aboveAverage', label: 'Above Average' },
  { value: 'belowAverage', label: 'Below Average' },
];

const VISUAL_TYPE_OPTIONS: { value: VisualType; label: string }[] = [
  { value: 'backgroundColor', label: 'Background Color' },
  { value: 'textColor', label: 'Text Color' },
  { value: 'dataBar', label: 'Data Bar' },
  { value: 'iconSet', label: 'Icon Set' },
  { value: 'colorScale', label: 'Color Scale' },
];

const ICON_SET_OPTIONS: { value: IconSetType; label: string }[] = [
  { value: '3-arrows', label: '3 Arrows' },
  { value: '3-traffic-lights', label: '3 Traffic Lights' },
  { value: '3-stars', label: '3 Stars' },
  { value: '5-ratings', label: '5 Ratings' },
  { value: '4-traffic-lights', label: '4 Traffic Lights' },
];

const VARIANCE_COLORS = {
  favorable: '#16A34A',
  unfavorable: '#DC2626',
  favorableBg: '#dcfce7',
  unfavorableBg: '#fee2e2',
};

// ── Props ────────────────────────────────────────────────────────

export interface ConditionalFormatRulesProps {
  rule?: ConditionalFormatRule;
  onSave: (rule: ConditionalFormatRule) => void;
  onCancel: () => void;
}

// ── Component ────────────────────────────────────────────────────

export function ConditionalFormatRules({ rule, onSave, onCancel }: ConditionalFormatRulesProps) {
  const isEditing = !!rule;

  const [name, setName] = useState(rule?.name ?? '');
  const [ruleType, setRuleType] = useState<RuleType>(rule?.condition.ruleType ?? 'cellValue');
  const [operator, setOperator] = useState<Operator>(rule?.condition.operator ?? 'greaterThan');
  const [value, setValue] = useState<string>(String(rule?.condition.value ?? ''));
  const [value2, setValue2] = useState<string>(String(rule?.condition.value2 ?? ''));
  const [text, setText] = useState(rule?.condition.text ?? '');
  const [formula, setFormula] = useState(rule?.condition.formula ?? '');
  const [rankValue, setRankValue] = useState<string>(String(rule?.condition.rankValue ?? '10'));
  const [columnKey, setColumnKey] = useState(rule?.condition.columnKey ?? '');
  const [visualType, setVisualType] = useState<VisualType>(rule?.visualType ?? 'backgroundColor');
  const [priority, setPriority] = useState<string>(String(rule?.priority ?? 100));

  // Style state
  const [bgColor, setBgColor] = useState(rule?.style?.backgroundColor ?? '#dcfce7');
  const [textColor, setTextColor] = useState(rule?.style?.textColor ?? '#166534');

  // DataBar state
  const [barStyle, setBarStyle] = useState<DataBarStyle>(rule?.dataBar?.style ?? 'solid');
  const [barColor, setBarColor] = useState(rule?.dataBar?.barColor ?? '#3B82F6');

  // IconSet state
  const [iconType, setIconType] = useState<IconSetType>(rule?.iconSet?.type ?? '3-arrows');
  const [iconReverse, setIconReverse] = useState(rule?.iconSet?.reverse ?? false);

  // ColorScale state
  const [scaleType, setScaleType] = useState<ColorScaleType>(rule?.colorScale?.type ?? '2-color');
  const [minColor, setMinColor] = useState(rule?.colorScale?.minColor ?? '#fee2e2');
  const [midColor, setMidColor] = useState(rule?.colorScale?.midColor ?? '#fef9c3');
  const [maxColor, setMaxColor] = useState(rule?.colorScale?.maxColor ?? '#dcfce7');

  const handleSave = useCallback(() => {
    const style: FormattingStyle | undefined =
      visualType === 'backgroundColor' || visualType === 'textColor'
        ? { backgroundColor: bgColor, textColor }
        : undefined;

    const dataBar: DataBarConfig | undefined =
      visualType === 'dataBar'
        ? { style: barStyle, barColor, showAxis: false, showValue: true }
        : undefined;

    const iconSet: IconSetConfig | undefined =
      visualType === 'iconSet'
        ? { type: iconType, reverse: iconReverse, showIconOnly: false }
        : undefined;

    const colorScale: ColorScaleConfig | undefined =
      visualType === 'colorScale'
        ? {
            type: scaleType,
            minColor,
            midColor: scaleType === '3-color' ? midColor : undefined,
            maxColor,
          }
        : undefined;

    onSave({
      id: rule?.id ?? generateRuleId(),
      name: name || `${ruleType} Rule`,
      enabled: rule?.enabled ?? true,
      priority: parseInt(priority, 10) || 100,
      condition: {
        ruleType,
        operator,
        value: parseFloat(value) || undefined,
        value2: operator === 'between' ? parseFloat(value2) || undefined : undefined,
        text: text || undefined,
        formula: ruleType === 'formula' ? formula || undefined : undefined,
        rankValue: ['topN', 'bottomN'].includes(operator)
          ? parseInt(rankValue, 10) || 10
          : undefined,
        columnKey: columnKey || undefined,
      },
      visualType,
      style,
      dataBar,
      iconSet,
      colorScale,
    });
  }, [
    name,
    ruleType,
    operator,
    value,
    value2,
    text,
    formula,
    rankValue,
    columnKey,
    visualType,
    priority,
    bgColor,
    textColor,
    barStyle,
    barColor,
    iconType,
    iconReverse,
    scaleType,
    minColor,
    midColor,
    maxColor,
    rule,
    onSave,
  ]);

  const needsNumericValue = [
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'between',
    'equal',
    'notEqual',
  ].includes(operator);
  const needsTextValue = ['contains', 'startsWith', 'endsWith', 'equal', 'notEqual'].includes(
    operator
  );
  const isRankOp = ['topN', 'bottomN'].includes(operator);

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        {isEditing ? 'Edit Formatting Rule' : 'New Formatting Rule'}
      </h3>

      {/* Rule name + priority */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            label="Rule Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Variance Highlight"
          />
        </div>
        <Input
          label="Priority"
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </div>

      {/* Condition: rule type + operator */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Rule Type"
          options={RULE_TYPE_OPTIONS}
          value={ruleType}
          onChange={(v) => setRuleType(v as RuleType)}
        />
        <Select
          label="Operator"
          options={OPERATOR_OPTIONS}
          value={operator}
          onChange={(v) => setOperator(v as Operator)}
        />
      </div>

      {/* Condition values */}
      {ruleType === 'formula' ? (
        <Input
          label="Formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g. =A1>B1"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {needsNumericValue && (
            <Input
              label="Value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          )}
          {operator === 'between' && (
            <Input
              label="Value 2"
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="100"
            />
          )}
          {needsTextValue && ruleType === 'text' && (
            <Input
              label="Text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="search text"
            />
          )}
          {isRankOp && (
            <Input
              label="N"
              type="number"
              value={rankValue}
              onChange={(e) => setRankValue(e.target.value)}
              placeholder="10"
            />
          )}
        </div>
      )}

      <Input
        label="Column Key (optional)"
        value={columnKey}
        onChange={(e) => setColumnKey(e.target.value)}
        placeholder="variance"
      />

      {/* Visual type */}
      <Select
        label="Visual Format"
        options={VISUAL_TYPE_OPTIONS}
        value={visualType}
        onChange={(v) => setVisualType(v as VisualType)}
      />

      {/* Visual config per type */}
      {(visualType === 'backgroundColor' || visualType === 'textColor') && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400">Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-8 w-10 rounded cursor-pointer"
              />
              <span className="text-xs text-[var(--text-secondary)]">{bgColor}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400">Text</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-10 rounded cursor-pointer"
              />
              <span className="text-xs text-[var(--text-secondary)]">{textColor}</span>
            </div>
          </div>
          <div className="col-span-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBgColor(VARIANCE_COLORS.favorableBg);
                setTextColor(VARIANCE_COLORS.favorable);
              }}
            >
              Favorable (green)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBgColor(VARIANCE_COLORS.unfavorableBg);
                setTextColor(VARIANCE_COLORS.unfavorable);
              }}
            >
              Unfavorable (red)
            </Button>
          </div>
        </div>
      )}

      {visualType === 'dataBar' && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Bar Style"
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'gradient', label: 'Gradient' },
            ]}
            value={barStyle}
            onChange={(v) => setBarStyle(v as DataBarStyle)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400">Bar Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={barColor}
                onChange={(e) => setBarColor(e.target.value)}
                className="h-8 w-10 rounded cursor-pointer"
              />
              <span className="text-xs text-[var(--text-secondary)]">{barColor}</span>
            </div>
          </div>
        </div>
      )}

      {visualType === 'iconSet' && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Icon Set"
            options={ICON_SET_OPTIONS}
            value={iconType}
            onChange={(v) => setIconType(v as IconSetType)}
          />
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={iconReverse}
                onChange={(e) => setIconReverse(e.target.checked)}
                className="rounded"
              />
              Reverse order
            </label>
          </div>
        </div>
      )}

      {visualType === 'colorScale' && (
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Scale Type"
            options={[
              { value: '2-color', label: '2 Colors' },
              { value: '3-color', label: '3 Colors' },
            ]}
            value={scaleType}
            onChange={(v) => setScaleType(v as ColorScaleType)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400">Min</span>
            <input
              type="color"
              value={minColor}
              onChange={(e) => setMinColor(e.target.value)}
              className="h-8 w-10 rounded cursor-pointer"
            />
          </div>
          {scaleType === '3-color' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-400">Mid</span>
              <input
                type="color"
                value={midColor}
                onChange={(e) => setMidColor(e.target.value)}
                className="h-8 w-10 rounded cursor-pointer"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400">Max</span>
            <input
              type="color"
              value={maxColor}
              onChange={(e) => setMaxColor(e.target.value)}
              className="h-8 w-10 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          {isEditing ? 'Update Rule' : 'Add Rule'}
        </Button>
      </div>
    </div>
  );
}
