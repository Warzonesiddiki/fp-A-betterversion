/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    importProgress: 0,
    importStatus: 'idle',
    importError: null,
    importHistory: [],
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    addEntry: vi.fn(),
    clearEntries: vi.fn(),
    setColumnMappings: vi.fn(),
    importData: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    analyzeAccount: vi.fn(),
    generateTrialBalance: vi.fn(),
    setImportProgress: vi.fn(),
    setImportStatus: vi.fn(),
    setImportError: vi.fn(),
    recordImport: vi.fn(),
    undoLastImport: vi.fn(),
    checkDuplicates: vi.fn(() => ({ duplicates: 0, newEntries: [] })),
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/VersionControlEngine', () => {
  class MockVersionControlEngine {
    createBranch(name: string, description: string, createdBy: string, parentId?: string) {
      return {
        id: `branch-${name}`,
        name,
        description,
        createdBy,
        parentId,
        createdAt: Date.now(),
      };
    }
    commit() {
      return { id: 'commit-1', timestamp: Date.now() };
    }
    listBranches() {
      return [
        {
          id: 'branch-main',
          name: 'main',
          description: 'Production budget',
          createdBy: 'system',
          createdAt: Date.now(),
        },
        {
          id: 'branch-draft-q2',
          name: 'draft-q2',
          description: 'Q2 budget adjustments',
          createdBy: 'analyst-1',
          createdAt: Date.now(),
        },
      ];
    }
    getBranch(id: string) {
      return this.listBranches().find((b) => b.id === id);
    }
    getBranchCommits() {
      return [
        {
          id: 'commit-1',
          message: 'Initial budget load',
          author: 'system',
          timestamp: Date.now(),
          changes: [],
        },
      ];
    }
    diff() {
      return { changes: [] };
    }
  }
  return { VersionControlEngine: MockVersionControlEngine };
});

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="mock-input" {...props} />
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({ id }: { id?: string }) => <select data-testid="mock-select" id={id} />,
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ title, message }: { title?: string; message?: string }) => (
    <div data-testid="alert">
      {title && <span>{title}</span>}
      {message && <span>{message}</span>}
    </div>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button data-testid="mock-button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ accept }: { onFile: (f: File) => void; accept?: string }) => (
    <div data-testid="file-drop-zone" data-accept={accept} />
  ),
}));

vi.mock('@/components/data/GLColumnMapper', () => ({
  GLColumnMapper: () => <div data-testid="gl-column-mapper" />,
}));

vi.mock('@/components/data/GLDataPreview', () => ({
  GLDataPreview: () => <div data-testid="gl-data-preview" />,
}));

vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: () => <div data-testid="progress-stepper" />,
}));

vi.mock('@/components/ui/VersionDiffViewer', () => ({
  VersionDiffViewer: ({ title }: { title?: string }) => (
    <div data-testid="version-diff-viewer">{title}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    BookOpen: makeIcon(),
    ChevronLeft: makeIcon(),
    ChevronRight: makeIcon(),
    Download: makeIcon(),
    Search: makeIcon(),
    FileText: makeIcon(),
    Calendar: makeIcon(),
    Filter: makeIcon(),
    BarChart3: makeIcon(),
    PieChart: makeIcon(),
    Scale: makeIcon(),
    RefreshCw: makeIcon(),
    Upload: makeIcon(),
    CheckCircle2: makeIcon(),
    AlertCircle: makeIcon(),
    Undo2: makeIcon(),
    Database: makeIcon(),
    GitBranch: makeIcon(),
    GitCommit: makeIcon(),
    ArrowLeftRight: makeIcon(),
    AlertTriangle: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import GLJournalsPage from '@/pages/data/GLJournalsPage';
import GLReportingPage from '@/pages/data/GLReportingPage';
import GLTrialBalancePage from '@/pages/data/GLTrialBalancePage';
import GLUploadPage from '@/pages/data/GLUploadPage';
import VersionDiffPage from '@/pages/data/VersionDiffPage';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Smoke Tests
// ---------------------------------------------------------------------------

describe('Page Smoke Tests — 5 Data Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  // -----------------------------------------------------------------------
  // GLJournalsPage
  // -----------------------------------------------------------------------

  describe('GLJournalsPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(GLJournalsPage, '/data/gl-journals', '/data/gl-journals');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no entries', () => {
      const { getByText } = renderPage(GLJournalsPage, '/data/gl-journals', '/data/gl-journals');
      expect(getByText(/No Journal Entries/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // GLReportingPage
  // -----------------------------------------------------------------------

  describe('GLReportingPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(GLReportingPage, '/data/gl-reporting', '/data/gl-reporting');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no entries', () => {
      const { getByText } = renderPage(GLReportingPage, '/data/gl-reporting', '/data/gl-reporting');
      expect(getByText(/No GL Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // GLTrialBalancePage
  // -----------------------------------------------------------------------

  describe('GLTrialBalancePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        GLTrialBalancePage,
        '/data/gl-trial-balance',
        '/data/gl-trial-balance'
      );
      expect(container).toBeTruthy();
    });

    it('displays empty state when no entries', () => {
      const { getByText } = renderPage(
        GLTrialBalancePage,
        '/data/gl-trial-balance',
        '/data/gl-trial-balance'
      );
      expect(getByText(/No GL Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // GLUploadPage
  // -----------------------------------------------------------------------

  describe('GLUploadPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(GLUploadPage, '/data/gl-upload', '/data/gl-upload');
      expect(container).toBeTruthy();
    });

    it('displays upload empty state', () => {
      const { getByText } = renderPage(GLUploadPage, '/data/gl-upload', '/data/gl-upload');
      expect(getByText(/Import Your Financial Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // VersionDiffPage
  // -----------------------------------------------------------------------

  describe('VersionDiffPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(VersionDiffPage, '/data/version-diff', '/data/version-diff');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(VersionDiffPage, '/data/version-diff', '/data/version-diff');
      expect(getByText(/Version Diff/i)).toBeInTheDocument();
    });
  });
});
