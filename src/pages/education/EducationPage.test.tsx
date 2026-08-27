import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EducationPage from '@/pages/education/EducationPage';
import { useGLStore } from '@/store/glStore';
import { useEducationStore } from '@/store/educationStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockEntries: GLEntry[] = [
  {
    id: 'entry-1',
    accountId: 'acc-4010',
    accountCode: '4010',
    accountName: 'Undergraduate Tuition Revenue',
    debit: 0,
    credit: 420000,
    netChange: -420000,
    amount: -420000,
    date: '2026-02-01',
    period: '2026-02',
  },
  {
    id: 'entry-2',
    accountId: 'acc-5010',
    accountCode: '5010',
    accountName: 'Faculty & Instructional Salaries',
    debit: 260000,
    credit: 0,
    netChange: 260000,
    amount: 260000,
    date: '2026-02-15',
    period: '2026-02',
  },
];

describe('EducationPage (store-wired & exports)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useEducationStore.setState({
      programs: [],
      scholarships: [],
      enrollmentTrends: [],
    });
  });

  it('renders empty state when GL entries are empty', () => {
    render(
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No Education Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /import gl data to view education/i })
    ).toBeInTheDocument();
  });

  it('renders education KPIs from GL store and educationStore', () => {
    useGLStore.setState({ entries: mockEntries });
    useEducationStore.setState({
      programs: [
        {
          id: 'prog-1',
          name: 'Computer Science BS',
          department: 'Engineering',
          enrollment: 450,
          budget: 1200000,
          revenue: 1800000,
          status: 'Active',
        },
        {
          id: 'prog-2',
          name: 'Data Science MS',
          department: 'Engineering',
          enrollment: 180,
          budget: 600000,
          revenue: 950000,
          status: 'Active',
        },
      ],
      scholarships: [
        { id: 'sch-1', name: 'Dean Merit Award', awarded: 45, amount: 90000, recipients: 45 },
      ],
      enrollmentTrends: [{ semester: 'Fall 2025', undergraduate: 450, graduate: 180, total: 630 }],
    });

    render(
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('2 entries imported')).toBeInTheDocument();

    // Top KPIs
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Debit')).toBeInTheDocument();
    expect(screen.getByText('Active Accounts')).toBeInTheDocument();
    expect(screen.getAllByText('Net Change').length).toBeGreaterThanOrEqual(1);

    // Academic KPIs
    expect(screen.getByText('Enrolled Students')).toBeInTheDocument();
    expect(screen.getByText('Degree Programs')).toBeInTheDocument();
    expect(screen.getByText('Scholarships')).toBeInTheDocument();
    expect(screen.getByText('Tracked Semesters')).toBeInTheDocument();

    // Account Breakdown
    expect(screen.getByText('Account Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Undergraduate Tuition Revenue')).toBeInTheDocument();
    expect(screen.getByText('Faculty & Instructional Salaries')).toBeInTheDocument();
  });

  it('exports a PDF report with education KPIs and disclosures', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Education_Institutional_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with education reviews and GL accounts', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Education_Institutional_Review');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
