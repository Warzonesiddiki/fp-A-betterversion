import { Sliders, Trash2, RotateCcw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DriverSlider } from '@/components/ui/DriverSlider';
import { CascadeRuleBuilder } from '@/components/finance/CascadeRuleBuilder';
import type { Driver, ImpactAnalysis, CascadeRule } from '@/engines/DriverCascadeEngine';

export function formatImpact(value: number): string {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatDriverValue(value: number, unit: string): string {
  switch (unit) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'index':
      return value.toFixed(1);
    case 'ratio':
      return value.toFixed(2);
    default:
      return value.toLocaleString();
  }
}

export interface DriverCardProps {
  driver: Driver;
  isExpanded: boolean;
  pendingValue: number;
  impact: ImpactAnalysis | undefined;
  hasChanges: boolean;
  driverRules: CascadeRule[];
  isRecalculating: boolean;
  onToggleExpand: () => void;
  onSliderChange: (value: number) => void;
  onApply: () => void;
  onReset: () => void;
  onRemove: () => void;
}

export function DriverCard({
  driver,
  isExpanded,
  pendingValue,
  impact,
  hasChanges,
  driverRules,
  isRecalculating,
  onToggleExpand,
  onSliderChange,
  onApply,
  onReset,
  onRemove,
}: DriverCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Driver Header */}
      <button
        className="w-full text-left p-4 flex items-center justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {driver.name}
            </span>
            {driverRules.length > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                {driverRules.length} rule{driverRules.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {formatDriverValue(driver.currentValue, driver.unit)}
            </span>
            {hasChanges && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  →
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                  {formatDriverValue(pendingValue, driver.unit)}
                </span>
              </>
            )}
            {driver.description && (
              <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                {driver.description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              disabled={isRecalculating}
            >
              {isRecalculating ? 'Applying...' : 'Apply'}
            </Button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={`Remove ${driver.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          <DriverSlider
            label={driver.name}
            value={pendingValue}
            min={driver.minValue}
            max={driver.maxValue}
            step={driver.step}
            unit={driver.unit}
            onChange={onSliderChange}
          />

          {/* Impact Preview */}
          {impact && hasChanges && (
            <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-1 mb-2">
                <Zap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Impact Preview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <div className="font-medium">Affected Cells</div>
                  <div>{impact.affectedCellCount}</div>
                </div>
                <div>
                  <div className="font-medium">Total Impact</div>
                  <div>{formatImpact(impact.totalImpact)}</div>
                </div>
                <div>
                  <div className="font-medium">Change</div>
                  <div>{impact.percentageChange.toFixed(1)}%</div>
                </div>
              </div>
              {Object.entries(impact.impactByCube).length > 0 && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  {Object.entries(impact.impactByCube).map(([cube, data]) => (
                    <div key={cube} className="flex justify-between">
                      <span>{cube}</span>
                      <span>
                        {data.count} cells | {formatImpact(data.totalImpact)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onApply}
              disabled={!hasChanges || isRecalculating}
              className="flex-1"
            >
              {isRecalculating ? 'Applying...' : 'Apply Changes'}
            </Button>
            <Button size="sm" variant="outline" onClick={onReset} disabled={!hasChanges}>
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>

          <CascadeRuleBuilder driver={driver} />
        </CardContent>
      )}
    </Card>
  );
}
