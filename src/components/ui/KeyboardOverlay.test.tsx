import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { KeyboardOverlay } from './KeyboardOverlay';

vi.mock('@/engines/ExcelKeyboardShortcuts', () => {
  const mockShortcuts = [
    {
      id: 's1',
      key: 'ArrowUp',
      description: 'Move up one cell',
      category: 'Navigation' as const,
      action: 'moveUp',
    },
    {
      id: 's2',
      key: 'c',
      ctrl: true,
      description: 'Copy selection',
      category: 'Clipboard' as const,
      action: 'copy',
    },
  ];
  return {
    ExcelKeyboardShortcuts: {
      loadCustom: vi.fn(),
      getGrouped: vi.fn(() => [
        { category: 'Navigation' as const, shortcuts: [mockShortcuts[0]] },
        { category: 'Clipboard' as const, shortcuts: [mockShortcuts[1]] },
      ]),
      getAll: vi.fn(() => mockShortcuts),
      search: vi.fn((q: string) =>
        mockShortcuts.filter((s) => s.description.toLowerCase().includes(q))
      ),
      formatKeys: vi.fn(() => 'Ctrl+C'),
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

describe('KeyboardOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shortcut groups when open', () => {
    render(<KeyboardOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<KeyboardOverlay isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onClose when background backdrop clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardOverlay isOpen={true} onClose={onClose} />);
    const backdrop = screen.getByText('Keyboard Shortcuts').closest('.fixed.inset-0')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows shortcut count', () => {
    render(<KeyboardOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/2 shortcuts/)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<KeyboardOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Search shortcuts/)).toBeInTheDocument();
  });

  it('renders Custom button', () => {
    render(<KeyboardOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
