/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ReportBookBuilder } from '../ReportBookBuilder';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {};
});
vi.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/engines/ReportBookEngine', () => ({
  ReportBookEngine: class {
    createBook() {
      return { id: 'book-1', name: 'Board Pack', entries: [] };
    }
    getBook() {
      return { id: 'book-1', name: 'Board Pack', entries: [] };
    }
    addEntry() {}
    updateEntry() {}
    removeEntry() {}
    reorderEntries() {}
    getAvailableVariables() {
      return [];
    }
    async generateReports() {
      return [];
    }
  },
  REPORT_TEMPLATE_PRESETS: {},
}));

describe('ReportBookBuilder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders template catalog', () => {
    render(<ReportBookBuilder />);
    expect(screen.getByText('Report Templates')).toBeTruthy();
  });
});
