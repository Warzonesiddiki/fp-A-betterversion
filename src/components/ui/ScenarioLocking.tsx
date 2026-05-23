import { useCallback, useState } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';
import type { ScenarioMetrics } from '@/types';
import { Lock, Unlock, Download, AlertTriangle, Shield } from 'lucide-react';

interface ScenarioLockingProps {
  scenarioId: string;
  scenarioName: string;
  isLocked: boolean;
  metrics: ScenarioMetrics;
  onLockToggle: (scenarioId: string, locked: boolean) => void;
  onExport?: (scenarioId: string) => void;
  className?: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function ScenarioLocking({
  scenarioId,
  scenarioName,
  isLocked,
  metrics,
  onLockToggle,
  onExport,
  className,
}: ScenarioLockingProps) {
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  const handleLock = useCallback(() => {
    onLockToggle(scenarioId, true);
    setShowLockConfirm(false);
  }, [scenarioId, onLockToggle]);

  const handleUnlock = useCallback(() => {
    onLockToggle(scenarioId, false);
    setShowUnlockConfirm(false);
  }, [scenarioId, onLockToggle]);

  const handleExportPdf = useCallback(() => {
    // Generate PDF export of locked scenario
    if (onExport) {
      onExport(scenarioId);
    } else {
      // Default: trigger download via browser print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${scenarioName} — Scenario Report</title></head>
            <body style="font-family: sans-serif; padding: 40px;">
              <h1>${scenarioName}</h1>
              <p style="color: #666;">Locked Scenario Report — Generated ${new Date().toLocaleDateString()}</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr style="border-bottom: 2px solid #333;">
                  <th style="text-align: left; padding: 8px;">Metric</th>
                  <th style="text-align: right; padding: 8px;">Value</th>
                </tr>
                ${Object.entries({
                  Revenue: formatCurrency(metrics.revenue),
                  EBITDA: formatCurrency(metrics.ebitda),
                  'Net Income': formatCurrency(metrics.netIncome),
                  'Cash Flow': formatCurrency(metrics.cashFlow),
                  Headcount: metrics.headcount.toString(),
                  'Burn Rate': formatCurrency(metrics.burnRate),
                  Runway: `${metrics.runway.toFixed(1)} months`,
                  'Gross Margin': `${metrics.grossMargin.toFixed(1)}%`,
                  'EBITDA Margin': `${metrics.ebitdaMargin.toFixed(1)}%`,
                })
                  .map(
                    ([k, v]) =>
                      `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${k}</td>
                    <td style="text-align: right; padding: 8px; font-family: monospace;">${v}</td>
                  </tr>`
                  )
                  .join('')}
              </table>
              <p style="margin-top: 32px; font-size: 11px; color: #999;">
                This scenario is locked and cannot be modified. Exported from FinPlan Pro.
              </p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [scenarioId, scenarioName, metrics, onExport]);

  return (
    <>
      <Card className={cn('relative', className)}>
        {/* Lock indicator overlay */}
        {isLocked && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5">
            <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
              Locked
            </span>
          </div>
        )}

        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Shield
              className={cn(
                'h-4 w-4',
                isLocked ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'
              )}
            />
            {scenarioName}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Quick metrics summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 p-2">
              <span className="text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
                Revenue
              </span>
              <div className="font-mono font-medium text-[var(--text-primary)] dark:text-gray-100">
                {formatCurrency(metrics.revenue)}
              </div>
            </div>
            <div className="rounded bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 p-2">
              <span className="text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
                EBITDA
              </span>
              <div className="font-mono font-medium text-[var(--text-primary)] dark:text-gray-100">
                {formatCurrency(metrics.ebitda)}
              </div>
            </div>
            <div className="rounded bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 p-2">
              <span className="text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
                Gross Margin
              </span>
              <div className="font-mono font-medium text-[var(--text-primary)] dark:text-gray-100">
                {metrics.grossMargin.toFixed(1)}%
              </div>
            </div>
            <div className="rounded bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 p-2">
              <span className="text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
                Runway
              </span>
              <div className="font-mono font-medium text-[var(--text-primary)] dark:text-gray-100">
                {metrics.runway.toFixed(1)} mo
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isLocked ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnlockConfirm(true)}
                  className="flex-1"
                >
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  Unlock
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf} className="flex-1">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export PDF
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLockConfirm(true)}
                className="flex-1"
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Lock Scenario
              </Button>
            )}
          </div>

          {isLocked && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 dark:text-[var(--text-muted)] text-center">
              This scenario is read-only. Unlock to make changes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lock confirmation dialog */}
      <Modal isOpen={showLockConfirm} onClose={() => setShowLockConfirm(false)}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] dark:text-gray-100">
                Lock Scenario
              </h3>
              <p className="text-xs text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
                This will prevent any modifications to "{scenarioName}"
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Revenue</span>
              <span className="font-mono">{formatCurrency(metrics.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">EBITDA</span>
              <span className="font-mono">{formatCurrency(metrics.ebitda)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Net Income</span>
              <span className="font-mono">{formatCurrency(metrics.netIncome)}</span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
            You can still export the scenario as PDF after locking. Unlock to resume editing.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLockConfirm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleLock}>
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              Lock
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unlock confirmation dialog */}
      <Modal isOpen={showUnlockConfirm} onClose={() => setShowUnlockConfirm(false)}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Unlock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] dark:text-gray-100">
                Unlock Scenario
              </h3>
              <p className="text-xs text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">
                This will allow modifications to "{scenarioName}"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Any changes made after unlocking will modify the scenario values. Consider exporting
              before unlocking.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowUnlockConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleUnlock();
                handleExportPdf();
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export & Unlock
            </Button>
            <Button size="sm" onClick={handleUnlock}>
              <Unlock className="mr-1.5 h-3.5 w-3.5" />
              Unlock
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
