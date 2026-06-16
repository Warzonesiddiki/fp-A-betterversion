/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Calculator, Download, Settings } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  cost: number;
  salvage: number;
  life: number;
  method: 'Straight-Line' | 'Declining Balance' | 'MACRS' | 'Units of Production';
  acquired: string;
  accumulated: number;
  currentValue: number;
}

const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Manufacturing Equipment',
    cost: 500000,
    salvage: 50000,
    life: 10,
    method: 'Straight-Line',
    acquired: '2020-01-01',
    accumulated: 225000,
    currentValue: 275000,
  },
  {
    id: '2',
    name: 'Office Building',
    cost: 2000000,
    salvage: 400000,
    life: 30,
    method: 'Straight-Line',
    acquired: '2015-06-15',
    accumulated: 373333,
    currentValue: 1626667,
  },
  {
    id: '3',
    name: 'Delivery Fleet',
    cost: 300000,
    salvage: 30000,
    life: 5,
    method: 'Declining Balance',
    acquired: '2022-03-01',
    accumulated: 189000,
    currentValue: 111000,
  },
  {
    id: '4',
    name: 'IT Infrastructure',
    cost: 150000,
    salvage: 15000,
    life: 3,
    method: 'MACRS',
    acquired: '2023-09-15',
    accumulated: 90000,
    currentValue: 60000,
  },
];

export default function DepreciationPage() {
  const [method, setMethod] = useState<string>('all');
  const assets = MOCK_ASSETS;

  const filtered = method === 'all' ? assets : assets.filter((a) => a.method === method);
  const totalCost = filtered.reduce((s, a) => s + a.cost, 0);
  const totalAccumulated = filtered.reduce((s, a) => s + a.accumulated, 0);
  const totalValue = filtered.reduce((s, a) => s + a.currentValue, 0);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const scheduleData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      year: `Y${i + 1}`,
      book: Math.max(0, totalCost - (totalCost * (i + 1)) / 10),
      tax: Math.max(0, totalCost - (totalCost * (i + 1)) / 5),
    }));
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [totalCost]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Depreciation & Amortization</h1>
          <p className="text-muted-foreground">Asset depreciation schedules and methods</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" /> Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Assets"
              value={totalCost}
              icon={<Calculator className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Accumulated Depreciation"
              value={totalAccumulated}
              icon={<TrendingDown className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Net Book Value" value={totalValue} format="currency" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Depreciation Rate"
              value={totalCost > 0 ? (totalAccumulated / totalCost) * 100 : 0}
              format="percent"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {['all', 'Straight-Line', 'Declining Balance', 'MACRS', 'Units of Production'].map((m) => (
          <Button
            key={m}
            variant={method === m ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMethod(m)}
          >
            {m === 'all' ? 'All Methods' : m}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Depreciation Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={scheduleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `$${(v / 1000).toFixed(0)}K`} />
                <Line dataKey="book" name="Book Value" stroke="#3B82F6" strokeWidth={2} />
                <Line
                  dataKey="tax"
                  name="Tax Value"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Asset Register</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" aria-label="Depreciation schedule by asset">
              <caption className="sr-only">Detailed breakdown of depreciation schedule by asset</caption>
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th scope="col" className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                    Asset
                  </th>
                  <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                    Cost
                  </th>
                  <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                    NBV
                  </th>
                  <th scope="col" className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                  >
                    <td className="px-3 py-2">{asset.name}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${(asset.cost / 1000).toFixed(0)}K
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${(asset.currentValue / 1000).toFixed(0)}K
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{asset.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
