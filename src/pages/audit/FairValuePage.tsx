/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Scale, TrendingUp, Download, Filter } from 'lucide-react';

interface FairValueItem {
  id: string;
  name: string;
  category: string;
  level: 1 | 2 | 3;
  bookValue: number;
  fairValue: number;
  gain: number;
  method: string;
}

const MOCK_ITEMS: FairValueItem[] = [
  {
    id: '1',
    name: 'US Treasury Bonds',
    category: 'Fixed Income',
    level: 1,
    bookValue: 1000000,
    fairValue: 1020000,
    gain: 20000,
    method: 'Quoted Market Price',
  },
  {
    id: '2',
    name: 'Corporate Bonds',
    category: 'Fixed Income',
    level: 2,
    bookValue: 500000,
    fairValue: 485000,
    gain: -15000,
    method: 'Yield Curve',
  },
  {
    id: '3',
    name: 'Private Equity Fund',
    category: 'Equity',
    level: 3,
    bookValue: 2000000,
    fairValue: 2400000,
    gain: 400000,
    method: 'DCF Model',
  },
  {
    id: '4',
    name: 'Real Estate Holdings',
    category: 'Real Assets',
    level: 3,
    bookValue: 3000000,
    fairValue: 3200000,
    gain: 200000,
    method: 'Comparable Sales',
  },
  {
    id: '5',
    name: 'Listed Equities',
    category: 'Equity',
    level: 1,
    bookValue: 800000,
    fairValue: 850000,
    gain: 50000,
    method: 'Stock Exchange Price',
  },
  {
    id: '6',
    name: 'Derivative Contracts',
    category: 'Derivatives',
    level: 2,
    bookValue: 150000,
    fairValue: 160000,
    gain: 10000,
    method: 'Black-Scholes',
  },
];

export default function FairValuePage() {
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const items = levelFilter ? MOCK_ITEMS.filter((i) => i.level === levelFilter) : MOCK_ITEMS;

  const levelColors = { 1: '#10B981', 2: '#F59E0B', 3: '#EF4444' };
  const levelLabels = { 1: 'Quoted Prices', 2: 'Observable Inputs', 3: 'Unobservable' };

  const totalBook = items.reduce((s, i) => s + i.bookValue, 0);
  const totalFair = items.reduce((s, i) => s + i.fairValue, 0);
  const totalGain = items.reduce((s, i) => s + i.gain, 0);

  const levelData = [1, 2, 3].map((level) => ({
    name: levelLabels[level as keyof typeof levelLabels],
    value: items.filter((i) => i.level === level).reduce((s, i) => s + i.fairValue, 0),
    color: levelColors[level as keyof typeof levelColors],
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fair Value Measurement</h1>
          <p className="text-muted-foreground">ASC 820 / IFRS 13 fair value hierarchy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Book Value"
              value={totalBook}
              icon={<Scale className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Fair Value"
              value={totalFair}
              icon={<TrendingUp className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Unrealized Gain/Loss" value={totalGain} format="currency" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Level 3 %"
              value={
                totalFair > 0
                  ? (items.filter((i) => i.level === 3).reduce((s, i) => s + i.fairValue, 0) /
                      totalFair) *
                    100
                  : 0
              }
              format="percent"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={levelFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLevelFilter(null)}
        >
          All Levels
        </Button>
        {[1, 2, 3].map((level) => (
          <Button
            key={level}
            variant={levelFilter === level ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLevelFilter(level)}
          >
            Level {level}: {levelLabels[level as keyof typeof levelLabels]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Value by Hierarchy Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={levelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `$${(v / 1000).toFixed(0)}K`} />
                <Bar dataKey="value" name="Fair Value">
                  {levelData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fair Value Roll-Forward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Opening Balance', 'Gains/Losses', 'Purchases', 'Sales', 'Closing Balance'].map(
                (item, i) => {
                  const values = [totalBook - totalGain, totalGain, 0, 0, totalFair];
                  return (
                    <div key={item} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{item}</span>
                      <span className={`font-mono ${i === 4 ? 'font-bold' : ''}`}>
                        ${(values[i]! / 1000).toFixed(0)}K
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fair Value Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm" aria-label="Fair value measurements by level">
            <caption className="sr-only">
              Fair value measurements showing asset classification, fair value hierarchy level, book
              value, and unrealized gain or loss
            </caption>
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th
                  scope="col"
                  className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Asset
                </th>
                <th
                  scope="col"
                  className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Level
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Book Value
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Fair Value
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Gain/Loss
                </th>
                <th
                  scope="col"
                  className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Method
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                >
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: levelColors[item.level] + '20',
                        color: levelColors[item.level],
                      }}
                    >
                      L{item.level}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${(item.bookValue / 1000).toFixed(0)}K
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${(item.fairValue / 1000).toFixed(0)}K
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${item.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {item.gain >= 0 ? '+' : ''}${(item.gain / 1000).toFixed(0)}K
                  </td>
                  <td className="px-3 py-2 text-center text-xs">{item.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
