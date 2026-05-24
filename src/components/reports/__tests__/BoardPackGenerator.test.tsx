import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { BoardPackGenerator } from '../BoardPackGenerator';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return { Download: makeIcon('Download') };
});
vi.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
vi.mock('@/engines/ReportBookEngine', () => ({
  BoardPackGenerator: class {
    async generateBoardPack() {
      return { sections: [] };
    }
  },
  ReportBookEngine: class {
    createBook() {
      return { id: 'book-1', entries: [] };
    }
    listBooks() {
      return [];
    }
    addEntry() {}
  },
}));

describe('BoardPackGenerator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders configuration form', () => {
    render(<BoardPackGenerator />);
    expect(screen.getByText('Board Pack Configuration')).toBeTruthy();
    expect(screen.getByLabelText('Title')).toBeTruthy();
  });
});
