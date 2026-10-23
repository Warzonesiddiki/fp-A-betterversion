/**
 * Energy sector overview — every metric is derived from the posted GL and EnergyEngine.
 *
 * CORRECTNESS CONTRACT:
 * 1. Sector KPIs come from `EnergyEngine.calculateStats` and `EnergyEngine.getProductionBySource`
 *    (pure, money-primitive-backed). This page previously rendered a generic debit/credit reskin
 *    while the engine and store sat unwired.
 * 2. Energy assets and operational generation metrics reflect recorded data in `useEnergyStore`.
 * 3. Revenue is derived from posted energy generation and utility accounts (4xxx), and operating
 *    costs from posted power plant O&M / fuel accounts (5xxx/6xxx).
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  DollarSign,
  FileSpreadsheet,
  Layers,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { useEnergyStore } from '@/store/energyStore';
import { EnergyEngine } from '@/engines/EnergyEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { aggregateAccounts } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';

export function EnergySectorPage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const assets = useEnergyStore((s) => s.assets);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Energy Sector';
  }, []);

  const stats = useMemo(() => EnergyEngine.calculateStats(entries), [entries]);
  const sourceProduction = useMemo(() => EnergyEngine.getProductionBySource(entries), [entries]);
  const accountBreakdown = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value', 'Basis'],
        rows: [
          ['Total Revenue', fmt.currency0(stats.totalRevenue), 'Posted 4xxx energy accounts'],
          [
            'Operating Cost',
            fmt.currency0(stats.operatingCost),
            'Posted 5xxx/6xxx generation costs',
          ],
          ['Net Operating Income', fmt.currency0(stats.netIncome), 'Revenue − Operating Cost'],
          [
            'Production Volume',
            `${fmt.number(stats.productionVolume)} MWh`,
            'GL revenue ÷ estimated market price',
          ],
          ['Avg Realized Price', fmt.currency(stats.avgMarketPrice), 'Revenue ÷ MWh'],
          [
            'Carbon Intensity',
            `${fmt.number(stats.carbonIntensity)} gCO2/kWh`,
            'Estimated fleet emission rate',
          ],
          [
            'Registered Renewable Assets',
            fmt.number(assets.length),
            'Assets recorded in energyStore',
          ],
        ],
      },
      { title: 'Energy_Sector_Overview_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Source / Metric', 'Value', 'Unit'],
        rows: [
          ['Revenue', stats.totalRevenue, 'USD'],
          ['Operating Cost', stats.operatingCost, 'USD'],
          ['Net Income', stats.netIncome, 'USD'],
          ...sourceProduction.map((sp) => [sp.name, sp.value, 'MWh']),
        ],
      },
      { title: 'Energy_Production_Financials' }
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
      <main className="p-12 text-center" role="main" aria-label="Energy Sector - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Zap className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Energy Sector Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view energy sector.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view energy sector"
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
      aria-label="Energy Sector Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="Energy Sector"
        titleId="energy-heading"
        purpose="Sector KPIs derived from posted GL accounts (4xxx energy revenue, 5xxx/6xxx generation costs) via EnergyEngine."
        status={
          <span className="text-sm text-[var(--text-muted)]">
            {fmt.number(entries.length)} entries imported · {assets.length} renewable assets
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
              <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
        }
      />
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Energy KPIs"
        aria-labelledby="energy-heading"
      >
        <KPIValue
          label="Total Revenue"
          value={fmt.currency0(stats.totalRevenue)}
          icon={<Zap className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted 4xxx energy revenue accounts"
        />
        <KPIValue
          label="Operating Cost"
          value={fmt.currency0(stats.operatingCost)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted 5xxx/6xxx generation costs"
        />
        <KPIValue
          label="Net Operating Income"
          value={fmt.currency0(stats.netIncome)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Revenue − Operating Cost"
        />
        <KPIValue
          label="Renewable Assets"
          value={fmt.number(assets.length)}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Assets tracked in energy store"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-label="Generation by Energy Source" aria-live="polite">
          <CardHeader>
            <CardTitle>Generation by Energy Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceProduction.length === 0 ? (
              <p className="text-[var(--text-muted)]">
                No generation-source accounts (41xx Solar, 42xx Wind, 43xx Hydro, 44xx Thermal, 45xx
                Nuclear) found.
              </p>
            ) : (
              <ul className="space-y-3">
                {sourceProduction.map((sp) => (
                  <li key={sp.name} className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sp.color }}
                        aria-hidden="true"
                      />
                      {sp.name}
                    </span>
                    <span className="font-mono tabular-nums">{fmt.number(sp.value)} MWh</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <AccountOverviewCard rows={accountBreakdown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Lineage & Grid Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[var(--text-muted)]">
          <p className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#16A34A]" aria-hidden="true" />
            <span>
              Revenue, operating cost, and production metrics are derived via
              EnergyEngine.calculateStats over {fmt.number(entries.length)} posted ledger rows.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
            <span>
              Real-time SCADA telemetry, turbine availability, and grid interconnect frequency
              require operational IoT feeds; non-ledger facts are not estimated.
            </span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default EnergySectorPage;
