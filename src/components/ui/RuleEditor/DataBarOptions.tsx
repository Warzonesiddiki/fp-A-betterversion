import type { ConditionalFormatRule, DataBarStyle } from '@/engines/ConditionalFormattingEngine';

interface DataBarOptionsProps {
  rule: ConditionalFormatRule;
  onChange: (rule: ConditionalFormatRule) => void;
}

export function DataBarOptions({ rule, onChange }: DataBarOptionsProps) {
  return (
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
  );
}
