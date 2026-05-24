import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ChatPanel } from './ChatPanel';

describe('ChatPanel', () => {
  it('renders chat panel', () => {
    render(<ChatPanel />);
    expect(screen.getByText('Financial Assistant')).toBeInTheDocument();
  });
});
