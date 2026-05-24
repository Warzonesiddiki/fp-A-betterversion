import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { CommentaryTemplate } from './CommentaryTemplate';

describe('CommentaryTemplate', () => {
  it('renders built-in template names', () => {
    render(<CommentaryTemplate onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Favorable Variance')).toBeInTheDocument();
    expect(screen.getByText('Unfavorable Variance')).toBeInTheDocument();
    expect(screen.getByText('Forecast Update')).toBeInTheDocument();
  });

  it('calls onSelect with resolved text and onClose when Insert clicked after selecting template', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<CommentaryTemplate onSelect={onSelect} onClose={onClose} />);
    fireEvent.click(screen.getByText('Favorable Variance'));
    fireEvent.click(screen.getByText('Insert'));
    expect(onSelect).toHaveBeenCalledWith(expect.stringContaining('Favorable variance'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CommentaryTemplate onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom template textarea when Custom Template is selected', () => {
    render(<CommentaryTemplate onSelect={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText((content) => content.includes('Custom Template')));
    expect(screen.getByPlaceholderText('Write your own commentary...')).toBeInTheDocument();
  });

  it('disables Insert button when no template is selected', () => {
    render(<CommentaryTemplate onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Insert')).toBeDisabled();
  });

  it('resolves template with variance data when provided', () => {
    render(
      <CommentaryTemplate
        onSelect={vi.fn()}
        onClose={vi.fn()}
        varianceData={{
          actual: 1000,
          budget: 900,
          variance: 100,
          variancePct: 0.1,
          account: 'Revenue',
          period: 'Jan',
        }}
      />
    );
    expect(screen.getAllByText(/variance/i).length).toBeGreaterThan(0);
  });
});
