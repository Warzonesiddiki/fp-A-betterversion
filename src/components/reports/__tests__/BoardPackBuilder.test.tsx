import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { BoardPackBuilder } from '../BoardPackBuilder';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    Download: makeIcon('Download'),
    FileText: makeIcon('FileText'),
    Table: makeIcon('Table'),
  };
});
vi.mock('@/components/ui/Card', () => {
  const Card = ({ children, ...p }: any) => <div {...p}>{children}</div>;
  Card.displayName = 'Card';
  return { Card };
});
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

describe('BoardPackBuilder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders sections list', () => {
    render(<BoardPackBuilder />);
    expect(screen.getByText('Sections')).toBeTruthy();
    expect(screen.getByText('Generate PDF')).toBeTruthy();
    expect(screen.getAllByText('Executive Summary')).toHaveLength(2);
  });
});
