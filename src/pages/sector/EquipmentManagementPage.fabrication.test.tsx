/**
 * Vertical truthfulness sweep (wave 2) — fabrication regression lock for the
 * routed sector copy of EquipmentManagementPage.
 *
 * This copy kept real ledger derivations but decorated them with invented
 * operational figures: an OEE percentage, a utilisation rate, an average
 * asset age, a "replacement value" produced by multiplying posted value by
 * a magic 1.3 factor, and monthly downtime hours. Machine telemetry and a
 * fixed-asset register are required for all of those and do not exist here.
 * This lock pins the post-sweep contract: only arithmetic on posted amounts,
 * `—` (never `0%`) when no denominator is posted, and disclosure rows for
 * telemetry/register metrics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EquipmentManagementPage from './EquipmentManagementPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString('en-US')}`,
  formatNumber: (v: number) => v.toLocaleString('en-US'),
}));

const seededEntries = [
  {
    id: 'q1',
    accountId: 'a1',
    accountCode: '1500',
    accountName: 'Equipment Purchases',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 80000,
    credit: 0,
    netChange: 80000,
    amount: 80000,
    date: '2026-01-15',
    description: 'Equipment',
    reference: 'REF-Q1',
  },
  {
    id: 'q2',
    accountId: 'a2',
    accountCode: '1600',
    accountName: 'Accumulated Depreciation',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 16000,
    credit: 0,
    netChange: 16000,
    amount: 16000,
    date: '2026-01-15',
    description: 'Depreciation',
    reference: 'REF-Q2',
  },
  {
    id: 'q3',
    accountId: 'a3',
    accountCode: '6300',
    accountName: 'Maintenance Repairs',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 8000,
    credit: 0,
    netChange: 8000,
    amount: 8000,
    date: '2026-01-15',
    description: 'Maintenance',
    reference: 'REF-Q3',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <EquipmentManagementPage />
    </MemoryRouter>
  );
}

describe('EquipmentManagementPage sector copy (fabrication regression lock)', () => {
  it('does not render invented OEE/utilisation/age/replacement/downtime literals', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toContain('82.4%');
    expect(text).not.toContain('78.6%');
    expect(text).not.toContain('4.2 years');
    expect(text).not.toContain('24.5 hrs');
    expect(text).not.toContain('OEE');
    expect(text).not.toContain('Utilization Rate');
    expect(text).not.toContain('Avg Asset Age');
    expect(text).not.toContain('Replacement Value');
    expect(text).not.toContain('Downtime');
  });

  it('renders ratios that are arithmetic on posted amounts', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    // maintenance 8k / value 80k = 10% · depreciation 16k / 80k = 20% · NBV 64k
    expect(text).toContain('10.0%');
    expect(text).toContain('20.0%');
    expect(text).toContain('$64,000');
    expect(text).toMatch(/Net Book Value/i);
  });

  it('shows — instead of 0% when no equipment value is posted (absence is not zero)', () => {
    useGLStore.setState({
      entries: [seededEntries[1]] as never,
    });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('—');
    expect(text).not.toContain('0%');
  });

  it('discloses that telemetry and a fixed-asset register are required', () => {
    useGLStore.setState({ entries: seededEntries as never });
    renderPage();
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/machine telematics/i);
    expect(text).toMatch(/fixed-asset register/i);
    expect(text).toMatch(/omitted rather than estimated/i);
  });

  it('source guard: the ×1.3 replacement-value invention cannot return', () => {
    const source = readFileSync(path.resolve(__dirname, './EquipmentManagementPage.tsx'), 'utf8');
    expect(source).not.toMatch(/totalValue\),\s*1\.3\s*\)/);
    expect(source).not.toMatch(/OEE|Utilization Rate|Avg Asset Age|Downtime Hours/);
  });
});
