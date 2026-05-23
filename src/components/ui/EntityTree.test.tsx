import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityTree } from './EntityTree';
import type { Entity } from '@/types';

const entities: Entity[] = [
  {
    id: '1',
    name: 'Global Corp',
    code: 'GC',
    currency: 'USD',
    country: 'US',
    isParent: true,
    parentId: null,
  },
  {
    id: '2',
    name: 'North America',
    code: 'NA',
    currency: 'USD',
    country: 'US',
    isParent: false,
    parentId: '1',
  },
  {
    id: '3',
    name: 'Europe',
    code: 'EU',
    currency: 'EUR',
    country: 'DE',
    isParent: false,
    parentId: '1',
  },
  {
    id: '4',
    name: 'UK Branch',
    code: 'UK',
    currency: 'GBP',
    country: 'GB',
    isParent: false,
    parentId: '3',
  },
];

describe('EntityTree', () => {
  it('renders root entities', () => {
    render(<EntityTree entities={entities} onSelect={vi.fn()} />);
    expect(screen.getByText('Global Corp')).toBeInTheDocument();
  });

  it('shows organization hierarchy heading', () => {
    render(<EntityTree entities={entities} onSelect={vi.fn()} />);
    expect(screen.getByText('Organization Hierarchy')).toBeInTheDocument();
  });

  it('shows entity codes', () => {
    render(<EntityTree entities={entities} onSelect={vi.fn()} />);
    expect(screen.getByText('GC')).toBeInTheDocument();
  });

  it('calls onSelect when entity clicked', () => {
    const onSelect = vi.fn();
    render(<EntityTree entities={[entities[0]]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Global Corp'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('handles empty entities', () => {
    render(<EntityTree entities={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No entities found')).toBeInTheDocument();
  });

  it('renders expandable entities with children', () => {
    render(<EntityTree entities={entities} onSelect={vi.fn()} />);
    expect(screen.getByText('Global Corp')).toBeInTheDocument();
  });
});
