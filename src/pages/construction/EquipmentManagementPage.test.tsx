import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  ConstructionEngine: {
    calculateStats: vi.fn(() => ({
      avgGrossMargin: 0,
      wipValue: 0,
      revenueYTD: 0,
      overUnderBilled: 0,
      totalBacklog: 0,
      billings: 0,
    })),
    getBacklogTrend: vi.fn(() => []),
    getProjectPortfolio: vi.fn(() => []),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import EquipmentManagementPage from '@/pages/construction/EquipmentManagementPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction/equipment']}>
      <EquipmentManagementPage />
    </MemoryRouter>
  );
}

describe('EquipmentManagementPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays page heading', () => {
    renderPage();
    expect(screen.getByText('Equipment Management')).toBeTruthy();
  });

  it('discloses that no fleet data is recorded (session 024)', () => {
    renderPage();
    expect(screen.getByText(/No fleet data is recorded/i)).toBeTruthy();
  });
});

describe('EquipmentManagementPage — source guards (session 024)', () => {
  const src = fs
    .readFileSync(path.resolve(__dirname, './EquipmentManagementPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');

  it('no fictional fleet fixtures survive', () => {
    expect(src).not.toMatch(/utilizationTrend/);
    expect(src).not.toMatch(/equipmentFleet/);
    expect(src).not.toMatch(/Tower Crane 550/);
  });

  it('no hardcoded KPI values survive', () => {
    expect(src).not.toMatch(/84\.2%/);
    expect(src).not.toMatch(/\$142k/);
    expect(src).not.toMatch(/18\.5%/);
    expect(src).not.toMatch(/92\.4%/);
  });
});
