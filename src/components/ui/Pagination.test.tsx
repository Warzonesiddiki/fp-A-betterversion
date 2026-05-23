import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders page numbers', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('renders previous and next buttons', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByTitle('Previous Page')).toBeInTheDocument();
    expect(screen.getByTitle('Next Page')).toBeInTheDocument();
  });

  it('calls onPageChange when page clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByTitle('Previous Page')).toBeDisabled();
    expect(screen.getByTitle('First Page')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByTitle('Next Page')).toBeDisabled();
    expect(screen.getByTitle('Last Page')).toBeDisabled();
  });

  it('renders totalItems info when provided', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} totalItems={100} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('renders page size selector when onPageSizeChange provided', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByText('Rows per page:')).toBeInTheDocument();
  });

  it('calls onPageSizeChange when page size changed', () => {
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        pageSize={10}
        onPageSizeChange={onPageSizeChange}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '25' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
