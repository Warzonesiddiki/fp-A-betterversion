import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// Lane R34 (W-A11Y-002 M5): hoisted-mutable store ref so specs can drive the
// page into its import-status branches without re-importing modules.
const glState = vi.hoisted(() => ({
  value: {
    entries: [] as unknown[],
    importProgress: 0,
    importStatus: 'idle' as string,
    importError: null as string | null,
    importHistory: [] as unknown[],
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    ...glState.value,
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

// W-A11Y-002 M5 announce-once (lane R34): the hoisted-mutable glStore ref
// flips importStatus to 'parsing'; the skeleton must own exactly ONE polite
// status announcement with all bars aria-hidden.
describe('GLUploadPage — loading branch announce-once', () => {
  beforeEach(() => {
    glState.value.importStatus = 'idle';
  });

  it('parsing skeleton announces exactly once via srLabel, bars decorative', () => {
    glState.value.importStatus = 'parsing';
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true');
    expect(statuses[0]).toHaveTextContent('Loading GL upload…');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('validating skeleton announces exactly once via srLabel, bars decorative', () => {
    glState.value.importStatus = 'validating';
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveTextContent('Loading GL upload…');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
