import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette, type CommandItem } from './CommandPalette';

// Mock scrollIntoView (not available in JSDOM)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: any) => (open ? <>{children}</> : null),
  Portal: ({ children }: any) => <>{children}</>,
  Overlay: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

const items: CommandItem[] = [
  { id: '1', label: 'New Project', category: 'File', onSelect: vi.fn() },
  { id: '2', label: 'Open File', category: 'File', onSelect: vi.fn() },
  { id: '3', label: 'Run Report', category: 'Reports', onSelect: vi.fn() },
  { id: '4', label: 'Export Data', category: 'Reports', onSelect: vi.fn() },
];

describe('CommandPalette', () => {
  it('does not render when isOpen is false', () => {
    render(<CommandPalette items={items} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Run Report')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search commands...');
    expect(input).toBeInTheDocument();
  });

  it('filters items based on search query', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(input, { target: { value: 'Export' } });
    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
  });

  it('shows empty state when no items match', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
  });

  it('shows category headers', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('shows item count in footer', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('4 results')).toBeInTheDocument();
  });

  it('shows ESC shortcut hint', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('ESC')).toBeInTheDocument();
  });

  it('calls item onSelect and onClose when item is clicked', () => {
    const onClose = vi.fn();
    render(<CommandPalette items={items} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Open File'));
    expect(items[1].onSelect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('restores all items when search is cleared', () => {
    render(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(input, { target: { value: 'Export' } });
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <CommandPalette
        items={items}
        isOpen={true}
        onClose={vi.fn()}
        placeholder="Type to search..."
      />
    );
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
  });
});
