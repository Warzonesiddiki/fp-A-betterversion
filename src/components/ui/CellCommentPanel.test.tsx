import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { CellCommentPanel } from './CellCommentPanel';
import { CellCommentEngine } from '@/engines/CellCommentEngine';

vi.mock('@/engines/CellCommentEngine', () => ({
  CellCommentEngine: vi.fn().mockImplementation(function () {
    return {
      getThreads: vi.fn().mockReturnValue([]),
      getReplies: vi.fn().mockReturnValue([]),
      addComment: vi.fn(),
      replyTo: vi.fn(),
      resolveComment: vi.fn(),
      unresolveComment: vi.fn(),
    };
  }),
}));

describe('CellCommentPanel', () => {
  const mockEngine = new CellCommentEngine();

  it('renders panel for active cell', () => {
    render(
      <CellCommentPanel
        engine={mockEngine}
        cellKey="B2"
        currentUser="Test User"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Comments on/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <CellCommentPanel
        engine={mockEngine}
        cellKey="B2"
        currentUser="Test User"
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByLabelText('Close comments'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
