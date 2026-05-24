import type { ConditionalFormatRule } from '@/engines/ConditionalFormattingEngine';
import { cn } from '@/utils/cn';
import { PRESET_COLORS } from '../ConditionalFormattingConstants';

interface ColorStyleOptionsProps {
  rule: ConditionalFormatRule;
  onChange: (rule: ConditionalFormatRule) => void;
}

export function ColorStyleOptions({ rule, onChange }: ColorStyleOptionsProps) {
  const updateStyle = (patch: Partial<NonNullable<typeof rule.style>>) => {
    onChange({ ...rule, style: { ...rule.style, ...patch } });
  };

  return (
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
  );
}
