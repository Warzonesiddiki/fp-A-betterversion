import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    importHistory: [],
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
    setColumnMappings: vi.fn(),
    importData: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: () => <div data-testid="file-drop-zone" />,
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ title, message }: { title?: string; message?: string }) => (
    <div role="alert">
      {title && <span>{title}</span>}
      {message && <span>{message}</span>}
    </div>
  ),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    ArrowLeftRight: makeIcon(),
    Upload: makeIcon(),
    Database: makeIcon(),
    CheckCircle2: makeIcon(),
    AlertTriangle: makeIcon(),
    XCircle: makeIcon(),
    Download: makeIcon(),
  };
});

import DataImportPage from '@/pages/data/DataImportPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/import']}>
      <Routes>
        <Route path="/data/import" element={<DataImportPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DataImportPage smoke test', () => {
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

  it('displays the no data empty state', () => {
    renderPage();
    expect(screen.getByText(/No Data Imported/i)).toBeInTheDocument();
  });
});
