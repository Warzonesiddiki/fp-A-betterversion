import type { ConditionalFormatRule, ColorScaleType } from '@/engines/ConditionalFormattingEngine';

interface ColorScaleOptionsProps {
  rule: ConditionalFormatRule;
  onChange: (rule: ConditionalFormatRule) => void;
}

export function ColorScaleOptions({ rule, onChange }: ColorScaleOptionsProps) {
  return (
    <div className="space-y-3" role="region" aria-label="ColorScaleOptions">
      <div>
        <label
          htmlFor="scale-type"
          className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
        >
          Scale Type
        </label>
        <select
          id="scale-type"
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
          <label
            htmlFor="min"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            Min
          </label>
          <input
            id="min"
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
            <label
              htmlFor="mid"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Mid
            </label>
            <input
              id="mid"
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
          <label
            htmlFor="max"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            Max
          </label>
          <input
            id="max"
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
  );
}
