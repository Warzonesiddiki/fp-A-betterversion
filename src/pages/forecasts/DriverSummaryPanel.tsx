import { Plus, Copy, BookTemplate, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import type { Driver, CascadeRule } from '@/engines/DriverCascadeEngine';
import { formatImpact } from './DriverCard';

export interface DriverSummaryPanelProps {
  drivers: Driver[];
  allRules: CascadeRule[];
  lastCascadeResult: {
    driverName: string;
    oldValue: number;
    newValue: number;
    affectedCells: unknown[];
    totalImpact: number;
    duration: number;
  } | null;
  pendingValues: Record<string, number>;
  getRulesForDriver: (driverId: string) => CascadeRule[];
  onCreateSnapshot: () => void;
  onShowAddForm: () => void;
  onToggleTemplates: () => void;
  showTemplates: boolean;
}

export function DriverSummaryPanel({
  drivers,
  allRules,
  lastCascadeResult,
  pendingValues,
  getRulesForDriver,
  onCreateSnapshot,
  onShowAddForm,
  onToggleTemplates,
  showTemplates: _showTemplates,
}: DriverSummaryPanelProps) {
  return (
    <div className="space-y-4">
      {/* Cascade Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cascade Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {drivers.map((driver) => {
            const rules = getRulesForDriver(driver.id);
            if (rules.length === 0) return null;
            return (
              <div
                key={driver.id}
                className="p-2 rounded text-xs"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {driver.name}
                </div>
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>
                      {rule.targetCube} / {rule.targetCoords.Account}
                    </span>
                    <span className="ml-auto">{rule.weight}x</span>
                  </div>
                ))}
              </div>
            );
          })}
          {allRules.length === 0 && (
            <div className="text-center py-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
              No cascade rules defined yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Cascade Result */}
      {lastCascadeResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Cascade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Driver</span>
              <span style={{ color: 'var(--text-primary)' }}>{lastCascadeResult.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Old Value</span>
              <span style={{ color: 'var(--text-primary)' }}>{lastCascadeResult.oldValue}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>New Value</span>
              <span style={{ color: 'var(--accent)' }}>{lastCascadeResult.newValue}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Affected Cells</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {lastCascadeResult.affectedCells.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Total Impact</span>
              <span style={{ color: lastCascadeResult.totalImpact >= 0 ? '#16a34a' : '#dc2626' }}>
                {formatImpact(lastCascadeResult.totalImpact)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {lastCascadeResult.duration.toFixed(2)}ms
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Impact Heatmap */}
      {drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Driver Impact Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapChart
              data={drivers.flatMap((d) =>
                getRulesForDriver(d.id).map((r) => ({
                  x: d.name,
                  y: r.targetCoords.Account || r.targetCube,
                  value: r.weight * (pendingValues[d.id] ?? d.currentValue),
                }))
              )}
              cellSize={32}
              formatValue={(v) => `${v.toFixed(1)}x`}
              ariaLabel="Driver impact heatmap"
            />
            {allRules.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                Add cascade rules to see impact matrix
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={onShowAddForm}
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Driver
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={onToggleTemplates}
          >
            <BookTemplate className="w-3 h-3 mr-2" />
            Load Template
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={onCreateSnapshot}
          >
            <Copy className="w-3 h-3 mr-2" />
            Create Snapshot
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
