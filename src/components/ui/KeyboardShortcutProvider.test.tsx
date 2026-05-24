import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { KeyboardShortcutProvider } from './KeyboardShortcutProvider';

vi.mock('./CommandPalette', () => ({
  CommandPalette: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="command-palette" /> : null,
}));

vi.mock('./ShortcutHelpModal', () => ({
  ShortcutHelpModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="shortcut-help" /> : null,
}));

describe('KeyboardShortcutProvider', () => {
  it('renders children', () => {
    render(
      <KeyboardShortcutProvider>
        <div>Child Content</div>
      </KeyboardShortcutProvider>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
