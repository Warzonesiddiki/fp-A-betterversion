import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useLogisticsStore } from '@/store/logisticsStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { aggregateAccounts, type AccountBreakdownRow } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { roundTo, sumMoney } from '@/utils/money';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Download,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export default function LogisticsPage() {
  const { entries } = useGLStore();
  const logisticsStore = useLogisticsStore();
  const shipments = useMemo(() => logisticsStore?.shipments ?? [], [logisticsStore?.shipments]);
  const carrierPerformance = useMemo(
    () => logisticsStore?.carrierPerformance ?? [],
    [logisticsStore?.carrierPerformance]
  );
  const routeCosts = useMemo(() => logisticsStore?.routeCosts ?? [], [logisticsStore?.routeCosts]);
  const getActiveShipmentCount = logisticsStore?.getActiveShipmentCount;
  const getOnTimeRate = logisticsStore?.getOnTimeRate;

  const navigate = useNavigate();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Logistics';
  }, []);

  const totalDebit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.debit ?? 0)), 2),
    [entries]
  );
  const totalCredit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.credit ?? 0)), 2),
    [entries]
  );
  const netChange = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.netChange ?? 0)), 2),
    [entries]
  );
  const uniqueAccounts = useMemo(() => new Set(entries.map((e) => e.accountCode)).size, [entries]);

  const activeShipments = useMemo(() => {
    return typeof getActiveShipmentCount === 'function'
      ? getActiveShipmentCount()
      : shipments.length;
  }, [getActiveShipmentCount, shipments.length]);

  const onTimeRate = useMemo(() => {
    return typeof getOnTimeRate === 'function' ? getOnTimeRate() : 0;
  }, [getOnTimeRate]);

  const accountRows: AccountBreakdownRow[] = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value', 'Source / Lineage'],
        rows: [
          [
            'Total Operating Costs (Freight/Fleet)',
            fmt.currency(totalDebit),
            'GL Debit-Normal Accounts (5xxx/6xxx)',
          ],
          [
            'Total Logistics Revenue',
            fmt.currency(totalCredit),
            'GL Credit-Normal Accounts (4xxx)',
          ],
          ['Net Balance Change', fmt.currency(netChange), 'GL Balance Net Change'],
          ['Active General Accounts', fmt.number(uniqueAccounts), 'GL Chart of Accounts'],
          ['Active In-Transit Shipments', fmt.number(activeShipments), 'Logistics Store Shipments'],
          [
            'On-Time Delivery Performance',
            onTimeRate > 0 ? `${fmt.number(onTimeRate)}%` : 'N/A (No Carrier Telemetry)',
            'Carrier Performance Tracking',
          ],
          [
            'Active Carrier Partners',
            fmt.number(carrierPerformance.length),
            'Recorded Carrier Roster',
          ],
          ['Monitored Freight Corridors', fmt.number(routeCosts.length), 'Route Cost Models'],
        ],
      },
      { title: 'Logistics_Financial_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Amount', 'Notes'],
        rows: [
          ['Total Logistics Operating Costs', totalDebit, 'GL 5xxx/6xxx'],
          ['Total Logistics Revenue', totalCredit, 'GL 4xxx'],
          ['Net Change', netChange, 'GL Net Change'],
          ['Active Accounts', uniqueAccounts, 'Account count'],
          ['Active Shipments', activeShipments, 'Store records'],
          ['On-Time Delivery Rate (%)', onTimeRate, 'Carrier telemetry'],
        ],
      },
      { title: 'Logistics_Operations_Review' }
    ).catch(reportExportFailure);
  };

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Logistics - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Truck className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Logistics Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view logistics metrics.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view logistics metrics"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Logistics Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Logistics"
          titleId="logistics-heading"
          status={
            <span className="text-sm text-[var(--text-muted)]">
              {fmt.number(entries.length)} entries imported
            </span>
          }
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            aria-label="Export PDF Report"
          >
            <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
            PDF Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            aria-label="Export Excel Workbook"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Excel Export
          </Button>
        </div>
      </div>

      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Logistics KPIs"
        aria-labelledby="logistics-heading"
      >
        <KPIValue
          label="Total Debit"
          value={fmt.compact(totalDebit)}
          icon={<Package className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Credit"
          value={fmt.compact(totalCredit)}
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Active Accounts"
          value={fmt.number(uniqueAccounts)}
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Net Change"
          value={fmt.compact(netChange)}
          icon={<Truck className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Operational KPIs">
        <KPIValue
          label="Active Shipments"
          value={fmt.number(activeShipments)}
          changeLabel={activeShipments > 0 ? 'Freight in transit' : 'No active shipments'}
          icon={<Truck className="h-4 w-4 text-blue-500" aria-hidden="true" />}
        />
        <KPIValue
          label="On-Time Rate"
          value={onTimeRate > 0 ? `${fmt.number(onTimeRate)}%` : 'N/A'}
          changeLabel={onTimeRate > 0 ? 'Carrier delivery score' : 'Carrier tracking required'}
          icon={<CheckCircle2 className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />}
        />
        <KPIValue
          label="Active Carriers"
          value={fmt.number(carrierPerformance.length)}
          changeLabel={
            carrierPerformance.length > 0 ? 'Contracted fleet partners' : 'No carrier records'
          }
          icon={<Navigation className="h-4 w-4 text-purple-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Monitored Corridors"
          value={fmt.number(routeCosts.length)}
          changeLabel={routeCosts.length > 0 ? 'Freight routes modeled' : 'No route cost models'}
          icon={<MapPin className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Logistics Basis Disclosures">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Logistics Financial & Operational Basis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-1">
          <p>
            • <strong>Freight & Warehouse Cost Allocation:</strong> Operating expenditures are
            mapped from GL accounts 5xxx/6xxx for fuel, freight, third-party logistics (3PL), and
            warehouse operations.
          </p>
          <p>
            • <strong>Shipment Visibility:</strong> Operational delivery metrics (on-time rate,
            active transit volume) require TMS (Transportation Management System) feeds. Where feeds
            are not configured, operational measures remain unpopulated to prevent false reporting.
          </p>
        </CardContent>
      </Card>

      <AccountOverviewCard rows={accountRows} />
    </main>
  );
}
