import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GLDropZone } from './GLDropZone';

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ accept }: { accept?: string }) => (
    <div data-testid="file-drop-zone" data-accept={accept} />
  ),
}));

describe('GLDropZone', () => {
  it('renders without crashing', () => {
    render(<GLDropZone />);
  });

  it('renders FileDropZone component', () => {
    render(<GLDropZone />);
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('passes correct accept attribute to FileDropZone', () => {
    render(<GLDropZone />);
    expect(screen.getByTestId('file-drop-zone').getAttribute('data-accept')).toBe('.csv,.xlsx');
  });

  it('displays expected columns heading', () => {
    render(<GLDropZone />);
    expect(screen.getByText('Expected columns:')).toBeInTheDocument();
  });

  it('displays expected column names', () => {
    render(<GLDropZone />);
    expect(
      screen.getByText('accountCode, postDate, debit, credit, entityId, departmentId, description')
    ).toBeInTheDocument();
  });
});
