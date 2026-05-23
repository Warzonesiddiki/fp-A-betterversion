import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaaSCohortTable } from './SaaSCohortTable';
import type { CohortRow } from './SaaSCohortTable';

const mockData: CohortRow[] = [
  {
    cohort: 'Jan 2026',
    size: 100,
    retention: [100, 90, 85, 80, 75, 70, 68, 65, 62, 60, 58, 55],
  },
  {
    cohort: 'Feb 2026',
    size: 120,
    retention: [100, 92, 88, 82, 78, 74, 70, 67, 64, 61, 59, 56],
  },
];

describe('SaaSCohortTable', () => {
  it('renders without crashing with data', () => {
    const { container } = render(<SaaSCohortTable data={mockData} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows empty state when data is empty', () => {
    render(<SaaSCohortTable data={[]} />);
    expect(screen.getByText('No cohort data')).toBeInTheDocument();
  });

  it('renders cohort names', () => {
    render(<SaaSCohortTable data={mockData} />);
    expect(screen.getByText('Jan 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 2026')).toBeInTheDocument();
  });

  it('renders cohort sizes', () => {
    render(<SaaSCohortTable data={mockData} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SaaSCohortTable data={mockData} />);
    expect(screen.getByText('Cohort')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('renders month headers M0-M11', () => {
    render(<SaaSCohortTable data={mockData} />);
    expect(screen.getByText('M0')).toBeInTheDocument();
    expect(screen.getByText('M1')).toBeInTheDocument();
    expect(screen.getByText('M11')).toBeInTheDocument();
  });

  it('renders retention percentages', () => {
    render(<SaaSCohortTable data={mockData} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('renders a table element', () => {
    const { container } = render(<SaaSCohortTable data={mockData} />);
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('applies background color based on retention value', () => {
    const { container } = render(<SaaSCohortTable data={mockData} />);
    const cells = container.querySelectorAll('td');
    const retentionCell = Array.from(cells).find((cell) => cell.textContent === '90%');
    expect(retentionCell).toBeTruthy();
    expect(retentionCell?.getAttribute('style')).toContain('background-color');
  });

  it('renders single row data', () => {
    const singleRow: CohortRow[] = [{ cohort: 'Mar 2026', size: 50, retention: [100, 80, 60] }];
    render(<SaaSCohortTable data={singleRow} />);
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
