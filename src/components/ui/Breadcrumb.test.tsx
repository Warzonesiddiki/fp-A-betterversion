import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from './Breadcrumb';

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Breadcrumb', () => {
  it('renders breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Reports', href: '/reports' },
      { label: 'Q1 Summary' },
    ];
    renderWithRouter(<Breadcrumb items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Q1 Summary')).toBeInTheDocument();
  });

  it('shows separator between items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
    ];
    const { container } = renderWithRouter(<Breadcrumb items={items} />);
    const chevrons = container.querySelectorAll('svg');
    expect(chevrons.length).toBe(1);
  });

  it('handles single item', () => {
    const items = [{ label: 'Dashboard', href: '/' }];
    renderWithRouter(<Breadcrumb items={items} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('handles multiple items', () => {
    const items = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C', href: '/c' },
      { label: 'D' },
    ];
    const { container } = renderWithRouter(<Breadcrumb items={items} />);
    const chevrons = container.querySelectorAll('svg');
    expect(chevrons.length).toBe(3);
  });

  it('last item is not a link', () => {
    const items = [{ label: 'Home', href: '/' }, { label: 'Current Page' }];
    renderWithRouter(<Breadcrumb items={items} />);
    const lastItem = screen.getByText('Current Page');
    expect(lastItem.tagName).toBe('SPAN');
  });

  it('items with href are rendered as links', () => {
    const items = [{ label: 'Home', href: '/' }, { label: 'Page' }];
    renderWithRouter(<Breadcrumb items={items} />);
    const link = screen.getByText('Home');
    expect(link.tagName).toBe('A');
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('last item has aria-current="page"', () => {
    const items = [{ label: 'Home', href: '/' }, { label: 'Page' }];
    renderWithRouter(<Breadcrumb items={items} />);
    expect(screen.getByText('Page')).toHaveAttribute('aria-current', 'page');
  });

  it('renders nav with aria-label', () => {
    const items = [{ label: 'Home', href: '/' }];
    const { container } = renderWithRouter(<Breadcrumb items={items} />);
    expect(container.querySelector('nav')).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  it('returns null for empty items', () => {
    const { container } = renderWithRouter(<Breadcrumb items={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
