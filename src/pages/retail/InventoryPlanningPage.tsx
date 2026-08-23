// =============================================================================
// INVENTORY PLANNING — stock planning from GL inventory accounts + recorded
// products (W-FAB remediation, phase0-exit amendment item 3).
// -----------------------------------------------------------------------------
// The previous revision fabricated its planning dataset in module scope:
//   - categoryBreakdown: five departments with invented value ($3.2M Apparel,
//     $4.8M Electronics …), turnover (5.2x …) and margin strings ('54%'),
//     rendered as a "Category Summary" of measured department economics;
//   - inventoryItems: two invented SKUs ('SKU-4401' 'Denim Jacket',
//     'SKU-2180' 'Wireless Earbuds') with stock, turnover, days-on-hand and
//     an 'Optimal'/'Overstock' status, rendered as a live SKU table;
//   - KPI cards decorated with invented deltas (change={4.2} "at cost basis",
//     {8.2} "annualized rate", {-12.4} "target 35 days") and fabricated
//     sparkline histories;
//   - a per-period `stockouts: 4` constant plotted as a trend series, plus a
//     "Stockout Incidents" KPI fed by InventoryEngine's `stockouts: 4 //
//     Mocked` placeholder.
// The GL carries no SKU or department dimension; stockout incidents need an
// operations feed. What IS available and used now:
//   - GL-derived totals via InventoryEngine.calculateGLInventoryStats()
//     (value / turnover / days on hand), shown without invented deltas;
//   - the retail workspace's user-recorded products (retailStore.products):
//     units on hand, reorder level and a derived below-reorder status,
//     aggregated by the categories the user actually assigned.
// =============================================================================

import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { useRetailStore, type RetailProduct } from '@/store/retailStore';
import { InventoryEngine } from '@/engines/InventoryEngine';
import { addMoney, compareMoney, multiplyMoney, roundTo } from '@/utils/money';
import { formatNumber } from '@/utils/financialFormatting';

const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

interface ProductRow {
  id: string;
  product: string;
  sku: string;
  category: string;
  stock: number;
  reorderLevel: number;
  status: 'Reorder' | 'OK';
}

function toProductRows(products: readonly RetailProduct[]): ProductRow[] {
  return products.map((p) => ({
    id: p.id,
    product: p.name,
    sku: p.sku,
    category: p.category,
    stock: p.stock,
    reorderLevel: p.reorderLevel,
    // Derived status: at/below the user's own reorder level.
    status: p.stock <= p.reorderLevel ? 'Reorder' : 'OK',
  }));
}

const productColumns: Column<ProductRow>[] = [
  { key: 'product', header: 'Product', sortable: true },
  { key: 'sku', header: 'SKU' },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'stock', header: 'Units On Hand', align: 'right', sortable: true },
  { key: 'reorderLevel', header: 'Reorder Level', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (v) =>
      v === 'Reorder' ? (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
          Reorder
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
          OK
        </span>
      ),
  },
];

export default function InventoryPlanningPage() {
  const fmtCurrency = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  // Array.isArray guard keeps this honest under partial store hydration too
  // (same idiom as SectorDriverDashboard's glState.entries guard).
  const productsState = useRetailStore((s) => s.products);
  const products = useMemo<readonly RetailProduct[]>(
    () => (Array.isArray(productsState) ? productsState : []),
    [productsState]
  );

  const stats = useMemo(() => {
    return InventoryEngine.calculateGLInventoryStats(entries);
  }, [entries]);

  const inventoryTrend = useMemo(() => {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const pStats = InventoryEngine.calculateGLInventoryStats(pEntries);
      return {
        month: period,
        turnover: pStats.turnover,
        daysOnHand: pStats.daysOnHand,
      };
    });
  }, [entries]);

  // Stock on hand by the categories the user assigned to their recorded
  // products: units summed, value at recorded cost (units × unit cost).
  const categoryRows = useMemo(() => {
    const map = new Map<string, { units: number; valueAtCost: number }>();
    for (const p of products) {
      const cur = map.get(p.category) ?? { units: 0, valueAtCost: 0 };
      cur.units += p.stock;
      cur.valueAtCost = roundTo(addMoney(cur.valueAtCost, multiplyMoney(p.stock, p.cost)), 2);
      map.set(p.category, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => compareMoney(b.valueAtCost, a.valueAtCost));
  }, [products]);

  const productRows = useMemo(() => toProductRows(products), [products]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Package className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold mb-2">No Inventory Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import your Inventory General Ledger (121x accounts) to view stock valuation and turnover
          analysis. Department economics and SKU positions are not invented here.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Inventory Planning"
          purpose="Stock valuation and efficiency from posted GL inventory accounts, plus stock positions for products recorded in the retail workspace."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
        </div>
      </div>

      <div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        data-testid="inventory-planning-kpis"
      >
        <KPIValue
          label="Total Inventory Value"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(stats.totalValue)}
        />
        <KPIValue label="Inventory Turnover" value={`${formatNumber(stats.turnover, 1)}x`} />
        <KPIValue label="Days on Hand" value={Math.round(stats.daysOnHand).toString()} />
        {/* Not derivable: disclosed instead of rendering InventoryEngine's
            `stockouts: 4 // Mocked` placeholder as incidents. */}
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Stockout Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--text-muted)]">
              Needs an operations/incident feed. This card previously showed a fixed placeholder
              value of 4 — it is now omitted rather than estimated.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Turnover & Days on Hand</CardTitle>
            </div>
            <CardDescription>Per posted month, derived from GL inventory activity</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryTrend.length >= 2 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={inventoryTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 60]}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="top" align="right" />
                    <Bar
                      yAxisId="left"
                      dataKey="turnover"
                      name="Turnover Rate"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="daysOnHand"
                      name="Days on Hand"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                A monthly efficiency trend needs posted activity in at least two periods. A demo
                curve is not invented.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock on hand by category</CardTitle>
            <CardDescription>
              Units and value at cost, from products recorded in your retail workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {categoryRows.length > 0 ? (
              categoryRows.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{cat.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {formatNumber(cat.units, 0)} units on hand
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {fmtCurrency.custom({ maxDecimals: 1, compact: true })(cat.valueAtCost)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">value at cost</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                No products recorded yet. The ledger does not tag stock by department, so department
                figures are not invented here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded product stock</CardTitle>
          <CardDescription>
            Units on hand and reorder status for products recorded in the retail workspace. SKU
            turnover and days-on-hand need SKU-level movement history and are omitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={productColumns}
            data={productRows}
            caption="Recorded product stock: units on hand and derived reorder status"
            ariaLabel="Recorded product stock table"
            emptyMessage="No products recorded in the retail workspace yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
