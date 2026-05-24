import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { KeyboardShortcutOverlay } from './KeyboardShortcutOverlay';

vi.mock('@/engines/ExcelKeyboardShortcuts', () => {
  const mockShortcuts = [
    {
      id: 's1',
      key: 'ArrowUp',
      description: 'Move up one cell',
      category: 'Navigation' as const,
      action: 'moveUp',
      isCustom: false,
    },
    {
      id: 's2',
      key: 'c',
      ctrl: true,
      description: 'Copy',
      category: 'Clipboard' as const,
      action: 'copy',
      isCustom: false,
    },
  ];
  return {
    ExcelKeyboardShortcuts: {
      getAll: vi.fn(() => mockShortcuts),
      formatKeys: vi.fn(() => 'Ctrl+C'),
      loadCustom: vi.fn(),
      getGrouped: vi.fn(() => []),
      subscribe: vi.fn(() => vi.fn()),
      register: vi.fn(),
      saveCustom: vi.fn(),
      removeCustom: vi.fn(),
    },
    SHORTCUT_CATEGORIES: [
      'Navigation',
      'Selection',
      'Editing',
      'Clipboard',
      'Formatting',
      'Formulas',
      'Data',
      'Sheets',
      'Application',
    ],
  };
});

describe('KeyboardShortcutOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open is true', () => {
    render(<KeyboardShortcutOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const { container } = render(<KeyboardShortcutOverlay isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutOverlay isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows search input', () => {
    render(<KeyboardShortcutOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Search/)).toBeInTheDocument();
  });

  it('shows context filter buttons', () => {
    render(<KeyboardShortcutOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Spreadsheet / Grid')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
  });
});
