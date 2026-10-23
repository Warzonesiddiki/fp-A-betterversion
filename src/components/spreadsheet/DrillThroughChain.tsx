import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { DrillBreadcrumb, type DrillLevel } from './DrillBreadcrumb';
import { SummaryTable, DetailTable, JournalEntryTable } from './DrillTables';

// --- Types ---

export interface SummaryRow {
  readonly id: string;
  readonly category: string;
  readonly actual: number;
  readonly budget: number;
  readonly variance: number;
  readonly variancePct: number;
  readonly children?: readonly DetailRow[];
}

export interface DetailRow {
  readonly id: string;
  readonly lineItem: string;
  readonly accountCode: string;
  readonly actual: number;
  readonly budget: number;
  readonly variance: number;
  readonly variancePct: number;
  readonly entries?: readonly JournalEntry[];
}

export interface JournalEntry {
  readonly id: string;
  readonly date: string;
  readonly accountCode: string;
  readonly description: string;
  readonly debit: number;
  readonly credit: number;
  readonly reference: string;
}

interface DrillThroughChainProps {
  summaryData: readonly SummaryRow[];
  period: string;
  className?: string;
}

type DrillView = 'summary' | 'detail' | 'journal-entry';

// --- Main Component ---

export function DrillThroughChain({
  summaryData = [],
  period = '',
  className,
}: DrillThroughChainProps) {
  const [currentView, setCurrentView] = useState<DrillView>('summary');
  const [selectedSummary, setSelectedSummary] = useState<SummaryRow | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailRow | null>(null);

  const drillLevels = useMemo((): DrillLevel[] => {
    const levels: DrillLevel[] = [{ id: 'summary', label: `${period} Summary`, type: 'summary' }];
    if (selectedSummary) {
      levels.push({
        id: selectedSummary.id,
        label: selectedSummary.category,
        type: 'section',
        data: { ...selectedSummary },
      });
    }
    if (selectedDetail) {
      levels.push({
        id: selectedDetail.id,
        label: selectedDetail.lineItem,
        type: 'line-item',
        data: { ...selectedDetail },
      });
    }
    return levels;
  }, [period, selectedSummary, selectedDetail]);

  const handleSelectSummary = useCallback((row: SummaryRow) => {
    setSelectedSummary(row);
    setSelectedDetail(null);
    setCurrentView('detail');
  }, []);

  const handleSelectDetail = useCallback((row: DetailRow) => {
    setSelectedDetail(row);
    setCurrentView('journal-entry');
  }, []);

  const handleNavigate = useCallback((levelIndex: number) => {
    if (levelIndex === 0) {
      setSelectedSummary(null);
      setSelectedDetail(null);
      setCurrentView('summary');
    } else if (levelIndex === 1) {
      setSelectedDetail(null);
      setCurrentView('detail');
    }
  }, []);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <DrillBreadcrumb levels={drillLevels} onNavigate={handleNavigate} />

      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)]">
        {currentView === 'summary' && (
          <SummaryTable data={summaryData} onSelect={handleSelectSummary} />
        )}

        {currentView === 'detail' && selectedSummary && (
          <DetailTable
            data={selectedSummary.children ?? []}
            category={selectedSummary.category}
            onSelect={handleSelectDetail}
          />
        )}

        {currentView === 'journal-entry' && selectedDetail && (
          <JournalEntryTable
            data={selectedDetail.entries ?? []}
            lineItem={selectedDetail.lineItem}
          />
        )}
      </div>
    </div>
  );
}
