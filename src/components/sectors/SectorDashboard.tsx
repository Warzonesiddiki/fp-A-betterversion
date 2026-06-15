import { useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { getAllSectors, getSectorConfig } from '@/config/sectors';
import { SectorSelector } from './SectorSelector';
import { SectorKPIs } from './SectorKPIs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export interface SectorDashboardProps {
  /** Force a specific sector ID instead of reading from settings store. */
  sectorId?: string;
  /** Show the full sector picker grid instead of just the KPIs. */
  showSelector?: boolean;
  /** Real KPI values keyed by KPI id. */
  values?: Record<string, number>;
  /** Real sparkline data keyed by KPI id. */
  sparklines?: Record<string, number[]>;
  /** Loading skeleton state. */
  loading?: boolean;
  /** Optional extra class names. */
  className?: string;
}

/**
 * SectorDashboard — generic sector-aware dashboard.
 *
 * Reads the active sector from settings store (or accepts a `sectorId` override).
 * Renders sector metadata, enabled modules, and the full KPI grid.
 *
 * Pass `showSelector` to display the 16-sector picker grid (useful in settings pages).
 */
export function SectorDashboard({
  sectorId,
  showSelector = false,
  values,
  sparklines,
  loading = false,
  className,
}: SectorDashboardProps) {
  const activeSector = useSettingsStore((s) => s.preferences.activeSector);
  const updatePreferences = useSettingsStore((s) => s.updatePreferences);

  const resolvedId = sectorId ?? activeSector;
  const config = useMemo(() => getSectorConfig(resolvedId), [resolvedId]);
  const allSectors = useMemo(() => getAllSectors(), []);

  const handleSectorChange = useCallback(
    (id: string) => {
      updatePreferences({ activeSector: id });
    },
    [updatePreferences]
  );

  if (!config) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <p className="text-sm text-[var(--text-muted)]">
          Sector &quot;{resolvedId}&quot; not found. Select a sector below.
        </p>
        <SectorSelector
          sectors={allSectors}
          value={resolvedId}
          onChange={handleSectorChange}
          className="mt-6"
        />
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Sector Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>{config.name}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <Badge variant="secondary">{config.defaultCurrency}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {config.enabledModules.map((mod) => (
              <Badge key={mod} variant="outline">
                {mod}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Picker (optional) */}
      {showSelector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Switch Sector</CardTitle>
            <CardDescription>Select an industry to load its KPIs and modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <SectorSelector sectors={allSectors} value={resolvedId} onChange={handleSectorChange} />
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
          Key Performance Indicators
        </h2>
        <SectorKPIs config={config} values={values} sparklines={sparklines} loading={loading} />
      </div>
    </div>
  );
}
