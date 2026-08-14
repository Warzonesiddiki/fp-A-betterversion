import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    importProgress: 0,
    importStatus: 'idle',
    importError: null,
    importHistory: [],
    setImportProgress: vi.fn(),
    setImportStatus: vi.fn(),
    setImportError: vi.fn(),
    recordImport: vi.fn(),
    undoLastImport: vi.fn(),
    checkDuplicates: vi.fn(() => []),
    setEntries: vi.fn(),
  })),
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: (props: any) => (
    <div data-testid="file-drop-zone">{props.children || 'Drop files here'}</div>
  ),
}));

vi.mock('@/components/data/GLColumnMapper', () => ({
  GLColumnMapper: () => <div data-testid="column-mapper" />,
}));

vi.mock('@/components/data/GLDataPreview', () => ({
  GLDataPreview: () => <div data-testid="data-preview" />,
}));

vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: () => <div data-testid="progress-stepper" />,
}));

import GLUploadPage from '@/pages/data/GLUploadPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/gl-upload']}>
      <GLUploadPage />
    </MemoryRouter>
  );
}

describe('GLUploadPage smoke test', () => {
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
  it('displays upload UI', () => {
    renderPage();
    expect(screen.getByText(/Import Your Financial Data/i)).toBeTruthy();
  });
});
