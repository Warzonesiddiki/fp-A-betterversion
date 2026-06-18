/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { AlertTriangle, TrendingDown, Download, CheckCircle } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  carryingAmount: number;
  recoverableAmount: number;
  impairmentLoss: number;
  status: 'impaired' | 'not_impaired' | 'reversed';
  testDate: string;
}

const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Manufacturing Plant A',
    carryingAmount: 5000000,
    recoverableAmount: 4200000,
    impairmentLoss: 800000,
    status: 'impaired',
    testDate: '2026-03-31',
  },
  {
    id: '2',
    name: 'Office Building B',
    carryingAmount: 3000000,
    recoverableAmount: 3200000,
    impairmentLoss: 0,
    status: 'not_impaired',
    testDate: '2026-03-31',
  },
  {
    id: '3',
    name: 'IT Equipment',
    carryingAmount: 800000,
    recoverableAmount: 600000,
    impairmentLoss: 200000,
    status: 'impaired',
    testDate: '2026-03-31',
  },
  {
    id: '4',
    name: 'Goodwill',
    carryingAmount: 2000000,
    recoverableAmount: 1800000,
    impairmentLoss: 200000,
    status: 'impaired',
    testDate: '2026-03-31',
  },
  {
    id: '5',
    name: 'Delivery Fleet',
    carryingAmount: 450000,
    recoverableAmount: 470000,
    impairmentLoss: 0,
    status: 'not_impaired',
    testDate: '2026-03-31',
  },
];

export default function ImpairmentPage() {
  const assets = MOCK_ASSETS;
  const impaired = assets.filter((a) => a.status === 'impaired');
  const totalCarrying = assets.reduce((s, a) => s + a.carryingAmount, 0);
  const totalRecoverable = assets.reduce((s, a) => s + a.recoverableAmount, 0);
  const totalLoss = assets.reduce((s, a) => s + a.impairmentLoss, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Impairment Testing</h1>
          <p className="text-muted-foreground">IAS 36 / ASC 360 asset impairment analysis</p>
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
              label="Total Carrying Amount"
              value={totalCarrying}
              icon={<TrendingDown className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Total Recoverable" value={totalRecoverable} format="currency" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Impairment Loss"
              value={totalLoss}
              icon={<AlertTriangle className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Assets Impaired"
              value={impaired.length}
              icon={<CheckCircle className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Impairment Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm" aria-label="Impairment testing results">
            <caption className="sr-only">Detailed breakdown of impairment testing results</caption>
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
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Carrying Amt
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Recoverable
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Impairment
                </th>
                <th
                  scope="col"
                  className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Test Date
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                >
                  <td className="px-3 py-2">{asset.name}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${(asset.carryingAmount / 1000).toFixed(0)}K
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${(asset.recoverableAmount / 1000).toFixed(0)}K
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${asset.impairmentLoss > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {asset.impairmentLoss > 0
                      ? `($${(asset.impairmentLoss / 1000).toFixed(0)}K)`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'impaired'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : asset.status === 'reversed'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {asset.status === 'impaired'
                        ? 'Impaired'
                        : asset.status === 'reversed'
                          ? 'Reversed'
                          : 'Not Impaired'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                    {asset.testDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
