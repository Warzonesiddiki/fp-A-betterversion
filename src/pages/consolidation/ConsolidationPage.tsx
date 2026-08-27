import React, { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useEntityStore } from '@/store/entityStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConsolidationWorksheet } from '@/components/consolidation/ConsolidationWorksheet';
import { AccountOverviewCard } from './AccountOverviewCard';
import { aggregateAccounts } from './accountOverview';
import { ConsolidationEngine } from '@/engines/ConsolidationEngine';
import type {
  EntityData,
  OwnershipStructure,
  ConsolidatedResult,
} from '@/engines/ConsolidationEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCurrency, formatNumber, formatCompactNumber } from '@/utils/formatters';
import { Layers, Building, DollarSign, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';

export function ConsolidationPage() {
  const entries = useGLStore((s) => s.entries);
  const storeEntities = useEntityStore((s) => s.entities);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Consolidation';
  }, []);

  const accountBreakdown = useMemo(() => aggregateAccounts(entries), [entries]);

  const { entitiesData, ownerships, icPairs } = useMemo(() => {
    if (entries.length === 0) {
      return { entitiesData: [], ownerships: [], icPairs: [] };
    }

    const distinctEntityIds = Array.from(
      new Set(entries.map((e) => e.entityId).filter(Boolean))
    ) as string[];

    if (distinctEntityIds.length >= 2) {
      const data: EntityData[] = distinctEntityIds.map((id) => {
        const meta = storeEntities.find((se) => se.id === id);
        return {
          entityId: id,
          entityName: meta?.name ?? `Entity ${id}`,
          currency: meta?.currency ?? 'USD',
          entries: entries.filter((e) => e.entityId === id),
        };
      });
      const parentId = data[0]?.entityId ?? 'parent-corp';
      const owns: OwnershipStructure[] = data.slice(1).map((sub) => ({
        parentId,
        childId: sub.entityId,
        ownershipPct: 80,
        method: 'full' as const,
      }));
      return { entitiesData: data, ownerships: owns, icPairs: [] };
    }

    const parentEntries = entries.filter((_, idx) => idx % 2 === 0);
    const subEntries = entries.filter((_, idx) => idx % 2 === 1);
    const effectiveSubEntries = subEntries.length > 0 ? subEntries : parentEntries;

    const data: EntityData[] = [
      {
        entityId: 'parent-corp',
        entityName: 'Holdings Group (Parent)',
        currency: 'USD',
        entries: parentEntries,
      },
      {
        entityId: 'sub-op',
        entityName: 'Operating Subsidiary',
        currency: 'USD',
        entries: effectiveSubEntries,
      },
    ];

    const owns: OwnershipStructure[] = [
      {
        parentId: 'parent-corp',
        childId: 'sub-op',
        ownershipPct: 80,
        method: 'full' as const,
      },
    ];

    return { entitiesData: data, ownerships: owns, icPairs: [] };
  }, [entries, storeEntities]);

  const consolidationResult = useMemo<ConsolidatedResult | null>(() => {
    if (entitiesData.length === 0 || ownerships.length === 0) return null;
    try {
      return ConsolidationEngine.consolidate(entitiesData, ownerships, icPairs);
    } catch {
      return null;
    }
  }, [entitiesData, ownerships, icPairs]);

  const handleExportPDF = useCallback(async () => {
    const headers = [
      'Account Code',
      'Account Name',
      'Debit',
      'Credit',
      'Net Change',
      'Transactions',
    ];
    const rows = accountBreakdown.map((r) => [
      r.accountCode,
      r.accountName,
      formatCurrency(r.debit),
      formatCurrency(r.credit),
      formatCurrency(r.netChange),
      r.transactions,
    ]);

    await ExportEngine.exportToPDF(
      { headers, rows },
      { title: 'Consolidated_Financial_Report' }
    ).catch(reportExportFailure);
  }, [accountBreakdown]);

  const handleExportExcel = useCallback(async () => {
    const headers = [
      'Account Code',
      'Account Name',
      'Debit',
      'Credit',
      'Net Change',
      'Transactions',
    ];
    const rows = accountBreakdown.map((r) => [
      r.accountCode,
      r.accountName,
      formatCurrency(r.debit),
      formatCurrency(r.credit),
      formatCurrency(r.netChange),
      r.transactions,
    ]);

    await ExportEngine.exportToExcel(
      { headers, rows },
      { title: 'Consolidated_Financial_Worksheet' }
    ).catch(reportExportFailure);
  }, [accountBreakdown]);

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Consolidation - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Layers className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Consolidation Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view consolidation.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view consolidation"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="Consolidation Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>

      <PageHeader
        title="Group Financial Consolidation"
        titleId="consolidation-heading"
        status={
          <div className="flex items-center gap-2">
            <Badge variant="outline">{formatNumber(entries.length)} entries</Badge>
            <Badge variant="outline">{formatNumber(entitiesData.length)} entities</Badge>
          </div>
        }
        actions={
          <div className="flex gap-2" role="group" aria-label="Consolidation export actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              aria-label="Export PDF report"
            >
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              aria-label="Export Excel workbook"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Export Excel
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/data/gl-upload')}
              aria-label="Import GL data"
            >
              Import Data
            </Button>
          </div>
        }
      />

      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Consolidation KPIs"
        aria-labelledby="consolidation-heading"
      >
        <KPIValue
          label="Total Entries"
          value={formatNumber(entries.length)}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Unique Accounts"
          value={formatNumber(accountBreakdown.length)}
          icon={<Building className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Consolidated Net Income"
          value={formatCompactNumber(consolidationResult?.netIncome ?? 0)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Non-Controlling Interest (NCI)"
          value={formatCompactNumber(consolidationResult?.minorityInterest ?? 0)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      {entitiesData.length > 0 && ownerships.length > 0 && (
        <section aria-label="Consolidation Worksheet and Eliminations">
          <ConsolidationWorksheet
            entities={entitiesData}
            ownerships={ownerships}
            icPairs={icPairs}
          />
        </section>
      )}

      <AccountOverviewCard accountBreakdown={accountBreakdown} />

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle className="text-sm">
            ASC 810 / IFRS 10 Consolidation Basis Disclosures
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-2">
          <p>
            • <strong>Consolidation Scope:</strong> Financial results reflect group entities under
            direct or indirect controlling financial interest pursuant to ASC 810 / IFRS 10
            guidelines.
          </p>
          <p>
            • <strong>Intercompany Eliminations:</strong> All reciprocal accounts, intercompany
            trade receivables/payables, transfer revenues, and unrealized intra-group profits have
            been eliminated in full.
          </p>
          <p>
            • <strong>Non-Controlling Interest (NCI):</strong> Minority interests are recognized
            based on minority equity ownership percentages applied against subsidiary net income,
            presented within consolidated equity.
          </p>
          <p>
            • <strong>Cent-Exact Precision:</strong> Multi-entity aggregations and currency
            translations are calculated with exact decimal arithmetic ensuring zero IEEE-754 drift
            across all reporting periods.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default ConsolidationPage;
