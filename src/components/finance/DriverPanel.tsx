import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Sliders,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useDriverStore } from '@/store/driverStore';
import type { Driver, ImpactAnalysis } from '@/engines/DriverCascadeEngine';
interface DriverPanelProps {
  readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined;
  writeCell: (cube: string, coords: Record<string, string>, measure: string, value: number) => void;
  onClose?: () => void;
}
export function DriverPanel({ readCell, writeCell, onClose }: DriverPanelProps) {
  const { t } = useTranslation();
  const { engine, isRecalculating, lastCascadeResult } = useDriverStore();
  const drivers = useMemo(() => engine.listDrivers(), [engine]);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<Record<string, number>>({});
  const [impactPreview, setImpactPreview] = useState<Record<string, ImpactAnalysis>>({});
  const categories = useMemo(() => {
    const cats = new Map<string, Driver[]>();
    for (const driver of drivers) {
      const list = cats.get(driver.category) ?? [];
      list.push(driver);
      cats.set(driver.category, list);
    }
    return cats;
  }, [drivers]);
  const handleSliderChange = (driver: Driver, value: number) => {
    setPendingValues((prev) => ({ ...prev, [driver.id]: value }));
    try {
      const impact = engine.analyzeImpact(driver.id, value, readCell);
      setImpactPreview((prev) => ({ ...prev, [driver.id]: impact }));
    } catch {
      // Impact analysis failed, clear preview
      setImpactPreview((prev) => {
        const next = { ...prev };
        delete next[driver.id];
        return next;
      });
    }
  };
  const handleApply = (driverId: string) => {
    const value = pendingValues[driverId];
    if (value === undefined) return;
    const result = engine.calculateCascade(driverId, value, readCell);
    engine.applyCascade(result, writeCell);
    setPendingValues((prev) => {
      const next = { ...prev };
      delete next[driverId];
      return next;
    });
    setImpactPreview((prev) => {
      const next = { ...prev };
      delete next[driverId];
      return next;
    });
  };
  const handleReset = (driver: Driver) => {
    setPendingValues((prev) => ({ ...prev, [driver.id]: driver.baseValue }));
    handleSliderChange(driver, driver.baseValue);
  };
  const formatValue = (value: number, unit: string): string => {
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
  };
  const formatImpact = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };
  return (
    <div
      className="w-80 border-l flex flex-col h-full"
      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Drivers
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Driver List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from(categories.entries()).map(([category, categoryDrivers]) => (
          <div key={category}>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {category}
            </h3>
            <div className="space-y-2">
              {categoryDrivers.map((driver) => {
                const isExpanded = expandedDriver === driver.id;
                const pendingValue = pendingValues[driver.id] ?? driver.currentValue;
                const impact = impactPreview[driver.id];
                const hasChanges = pendingValue !== driver.currentValue;
                return (
                  <Card key={driver.id} className="overflow-hidden">
                    <button
                      className="w-full text-left p-3 flex items-center justify-between"
                      onClick={() => setExpandedDriver(isExpanded ? null : driver.id)}
                    >
                      <div>
                        <div
                          className="font-medium text-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {driver.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {formatValue(driver.currentValue, driver.unit)}
                          {hasChanges && (
                            <span className="ml-2" style={{ color: 'var(--accent)' }}>
                              → {formatValue(pendingValue, driver.unit)}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <ChevronDown
                          className="w-4 h-4"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                      )}
                    </button>
                    {isExpanded && (
                      <CardContent className="pt-0 pb-3 px-3 space-y-3">
                        {/* Slider */}
                        <div>
                          <input
                            type="range"
                            min={driver.minValue}
                            max={driver.maxValue}
                            step={driver.step}
                            value={pendingValue}
                            onChange={(e) => handleSliderChange(driver, Number(e.target.value))}
                            className="w-full accent-blue-500"
                          />
                          <div
                            className="flex justify-between text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span>{formatValue(driver.minValue, driver.unit)}</span>
                            <span>{formatValue(driver.maxValue, driver.unit)}</span>
                          </div>
                        </div>
                        {/* Impact Preview */}
                        {impact && hasChanges && (
                          <div
                            className="p-2 rounded text-xs"
                            style={{ background: 'var(--bg-secondary)' }}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Zap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                              <span
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                Impact Preview
                              </span>
                            </div>
                            <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                              <div>Affected cells: {impact.affectedCellCount}</div>
                              <div>Total impact: {formatImpact(impact.totalImpact)}</div>
                              {Object.entries(impact.impactByCube).map(([cube, data]) => (
                                <div key={cube}>
                                  {cube}: {data.count} cells
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApply(driver.id)}
                            disabled={!hasChanges || isRecalculating}
                            className="flex-1"
                          >
                            {isRecalculating ? 'Applying...' : 'Apply'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReset(driver)}
                            disabled={!hasChanges}
                            aria-label="Reset driver"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            <Sliders className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('drivers.notConfigured')}</p>
            <p className="text-xs mt-1">Add drivers in the forecast builder</p>
          </div>
        )}
      </div>
      {/* Footer */}
      {lastCascadeResult && (
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {lastCascadeResult.totalImpact >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span>
              Last cascade: {lastCascadeResult.affectedCells.length} cells in{' '}
              {lastCascadeResult.duration.toFixed(1)}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
