import type { ConditionalFormatRule, IconSetType } from '@/engines/ConditionalFormattingEngine';
import { ICON_SET_TYPES } from '../ConditionalFormattingConstants';

interface IconSetOptionsProps {
  rule: ConditionalFormatRule;
  onChange: (rule: ConditionalFormatRule) => void;
}

export function IconSetOptions({ rule, onChange }: IconSetOptionsProps) {
  return (
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
  );
}
