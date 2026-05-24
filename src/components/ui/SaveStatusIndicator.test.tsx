import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { SaveStatusIndicator } from './SaveStatusIndicator';

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    status: 'saved',
    lastSavedAt: new Date('2024-01-15T10:00:00'),
    forceSave: vi.fn(),
  }),
}));

describe('SaveStatusIndicator', () => {
  it('renders saved status', () => {
    render(<SaveStatusIndicator data={{ test: 'value' }} onSave={vi.fn()} />);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });
});
