/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

// CommandPalette calls useNavigate() internally to jump to selected
// commands, so it must be mounted inside a Router in tests.
const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const items = [
  {
    id: '1',
    label: 'New Project',
    description: 'Create a new project',
    category: 'create',
    group: 'create',
  },
  { id: '2', label: 'Open File', description: 'Open a file', category: 'open', group: 'open' },
  {
    id: '3',
    label: 'Export Data',
    description: 'Export to CSV',
    category: 'export',
    group: 'export',
  },
];

describe('CommandPalette', () => {
  it('shows search input', () => {
    renderWithRouter(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    // Use getByLabelText (JSDOM does not implement role="combobox" accessibility)
    const input = screen.getByLabelText('Search commands');
    expect(input).toBeInTheDocument();
  });

  it('filters items based on search query', () => {
    renderWithRouter(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Search commands');
    fireEvent.change(input, { target: { value: 'Export' } });
    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
  });

  it('shows empty state when no items match', () => {
    renderWithRouter(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Search commands');
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText(/commands.notFound/i)).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithRouter(
      <CommandPalette items={items} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.querySelector('input')).toBeNull();
  });

  it('renders all items when opened', () => {
    renderWithRouter(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Open File')).toBeInTheDocument();
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('restores all items when search is cleared', () => {
    renderWithRouter(<CommandPalette items={items} isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Search commands');
    fireEvent.change(input, { target: { value: 'Export' } });
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });
});
