import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Download, Package, TrendingUp, AlertTriangle, BarChart3, ArrowDown } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney } from '@/utils/money';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  reorderPoint: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: 'INV001',
    name: 'Steel Sheets (4x8)',
    category: 'Raw Materials',
    quantity: 450,
    unitCost: 85,
    totalValue: 38250,
    reorderPoint: 100,
    status: 'In Stock',
    lastUpdated: '2026-05-10',
  },
  {
    id: 'INV002',
    name: 'Aluminum Rods (1in)',
    category: 'Raw Materials',
    quantity: 280,
    unitCost: 42,
    totalValue: 11760,
    reorderPoint: 150,
    status: 'Low Stock',
    lastUpdated: '2026-05-12',
  },
  {
    id: 'INV003',
    name: 'Copper Wire (100ft)',
    category: 'Raw Materials',
    quantity: 620,
    unitCost: 28,
    totalValue: 17360,
    reorderPoint: 200,
    status: 'In Stock',
    lastUpdated: '2026-05-08',
  },
  {
    id: 'INV004',
    name: 'Bearing Assembly 6205',
    category: 'Components',
    quantity: 1200,
    unitCost: 12,
    totalValue: 14400,
    reorderPoint: 500,
    status: 'In Stock',
    lastUpdated: '2026-05-11',
  },
  {
    id: 'INV005',
    name: 'Motor 3-Phase 5HP',
    category: 'Components',
    quantity: 35,
    unitCost: 890,
    totalValue: 31150,
    reorderPoint: 20,
    status: 'Low Stock',
    lastUpdated: '2026-05-09',
  },
  {
    id: 'INV006',
    name: 'Control Board V2',
    category: 'Electronics',
    quantity: 0,
    unitCost: 340,
    totalValue: 0,
    reorderPoint: 50,
    status: 'Out of Stock',
    lastUpdated: '2026-05-07',
  },
  {
    id: 'INV007',
    name: 'Hydraulic Pump',
    category: 'Components',
    quantity: 18,
    unitCost: 1250,
    totalValue: 22500,
    reorderPoint: 10,
    status: 'Low Stock',
    lastUpdated: '2026-05-13',
  },
  {
    id: 'INV008',
    name: 'Paint (5gal bucket)',
    category: 'Supplies',
    quantity: 340,
    unitCost: 45,
    totalValue: 15300,
    reorderPoint: 100,
    status: 'In Stock',
    lastUpdated: '2026-05-10',
  },
  {
    id: 'INV009',
    name: 'Safety Goggles',
    category: 'Safety',
    quantity: 850,
    unitCost: 8,
    totalValue: 6800,
    reorderPoint: 200,
    status: 'In Stock',
    lastUpdated: '2026-05-12',
  },
  {
    id: 'INV010',
    name: 'Welding Rods (5lb)',
    category: 'Supplies',
    quantity: 75,
    unitCost: 32,
    totalValue: 2400,
    reorderPoint: 50,
    status: 'Low Stock',
    lastUpdated: '2026-05-11',
  },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InventoryPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro - Inventory Management';
  }, []);

  const glInventory = useMemo(
    () =>
      roundTo(
        sumMoney(
          entries
            .filter((e) => (e.accountCode || '').startsWith('13'))
            .map((e) => Math.abs(e.debit - e.credit))
        ),
        2
      ),
    [entries]
  );

  const totalValue = roundTo(sumMoney(mockInventory.map((i) => i.totalValue)), 2);
  const totalItems = roundTo(sumMoney(mockInventory.map((i) => i.quantity)), 2);
  const lowStockCount = mockInventory.filter((i) => i.status === 'Low Stock').length;
  const outOfStockCount = mockInventory.filter((i) => i.status === 'Out of Stock').length;

  const cogs = roundTo(
    sumMoney(
      entries
        .filter((e) => (e.accountCode || '').startsWith('5'))
        .map((e) => Math.abs(e.debit - e.credit))
    ),
    2
  );
  const avgInventory = totalValue > 0 ? totalValue : glInventory;
  const turnoverRatio = avgInventory > 0 && cogs > 0 ? cogs / avgInventory : 0;
  const daysInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    mockInventory.forEach((i) => {
      cats[i.category] = (cats[i.category] || 0) + i.totalValue;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, []);

  const _inventoryByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    mockInventory.forEach((i) => {
      cats[i.category] = (cats[i.category] || 0) + i.quantity;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, []);

  const itemColumns: Column<InventoryItem>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Item', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'quantity', header: 'Qty', sortable: true },
    { key: 'unitCost', header: 'Unit Cost', render: (_, r) => formatCurrency(r.unitCost) },
    {
      key: 'totalValue',
      header: 'Total Value',
      render: (_, r) => formatCurrency(r.totalValue),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            r.status === 'In Stock'
              ? 'bg-green-900/50 text-green-400'
              : r.status === 'Low Stock'
                ? 'bg-yellow-900/50 text-yellow-400'
                : 'bg-red-900/50 text-red-400'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['ID', 'Item', 'Category', 'Qty', 'Unit Cost', 'Total Value', 'Status'],
        rows: mockInventory.map((i) => [
          i.id,
          i.name,
          i.category,
          i.quantity,
          i.unitCost,
          i.totalValue,
          i.status,
        ]),
      },
      { title: 'Inventory Report' }
    ).catch(reportExportFailure);
  };

  const hasData = entries.length > 0 || mockInventory.length > 0;

  if (!hasData) {
    return (
      <div className="p-12 text-center">
        <Package className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Inventory Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view inventory levels.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-slate-400">{mockInventory.length} items tracked</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPIValue
          label="Total Value"
          value={formatCurrency(totalValue)}
          icon={<Package className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Units"
          value={totalItems.toLocaleString()}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KPIValue
          label="Turnover Ratio"
          value={formatNumber(turnoverRatio, 1) + 'x'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Days Inventory"
          value={formatNumber(daysInventory, 0) + '  days'}
          icon={<ArrowDown className="h-4 w-4" />}
        />
        <KPIValue
          label="Low Stock Alerts"
          value={String(lowStockCount + outOfStockCount)}
          icon={<AlertTriangle className="h-4 w-4" />}
          status={lowStockCount + outOfStockCount > 0 ? 'warning' : 'good'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category (Value)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reorder Point Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInventory
                .filter((i) => i.quantity <= i.reorderPoint)
                .sort((a, b) => a.quantity / a.reorderPoint - b.quantity / b.reorderPoint)
                .map((item) => {
                  const ratio = item.quantity / item.reorderPoint;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-slate-400">
                          {item.quantity} / {item.reorderPoint} reorder point
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-24 bg-slate-700 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${ratio === 0 ? 'bg-red-500' : ratio < 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatPercent(ratio * 100, 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {mockInventory.filter((i) => i.quantity <= i.reorderPoint).length === 0 && (
                <div className="text-center text-slate-400 py-4">All items above reorder point</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={mockInventory}
            columns={itemColumns}
            pageSize={8}
            caption="Inventory items table"
            ariaLabel="Inventory items data table for manufacturing inventory"
          />
        </CardContent>
      </Card>
    </div>
  );
}
