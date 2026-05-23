/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './Table';

function renderFullTable() {
  return render(
    <Table>
      <TableCaption>Quarterly Revenue</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Expenses</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Q1 2026</TableCell>
          <TableCell>$1,200,000</TableCell>
          <TableCell>$800,000</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q2 2026</TableCell>
          <TableCell>$1,500,000</TableCell>
          <TableCell>$900,000</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>$2,700,000</TableCell>
          <TableCell>$1,700,000</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  // Rendering
  it('renders a table element', () => {
    renderFullTable();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderFullTable();
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders data cells', () => {
    renderFullTable();
    expect(screen.getByText('Q1 2026')).toBeInTheDocument();
    expect(screen.getByText('$1,200,000')).toBeInTheDocument();
    expect(screen.getByText('$800,000')).toBeInTheDocument();
  });

  it('renders multiple rows', () => {
    renderFullTable();
    expect(screen.getByText('Q1 2026')).toBeInTheDocument();
    expect(screen.getByText('Q2 2026')).toBeInTheDocument();
  });

  it('renders footer content', () => {
    renderFullTable();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$2,700,000')).toBeInTheDocument();
  });

  it('renders caption', () => {
    renderFullTable();
    expect(screen.getByText('Quarterly Revenue')).toBeInTheDocument();
  });

  // Subcomponent structure
  it('wraps table in overflow container', () => {
    const { container } = renderFullTable();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('overflow-auto');
  });

  it('renders thead element', () => {
    const { container } = renderFullTable();
    expect(container.querySelector('thead')).toBeInTheDocument();
  });

  it('renders tbody element', () => {
    const { container } = renderFullTable();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('renders tfoot element', () => {
    const { container } = renderFullTable();
    expect(container.querySelector('tfoot')).toBeInTheDocument();
  });

  it('renders caption element', () => {
    const { container } = renderFullTable();
    expect(container.querySelector('caption')).toBeInTheDocument();
  });

  // Custom className
  it('applies custom className to Table', () => {
    const { container } = render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>Data</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(container.querySelector('table')).toHaveClass('custom-table');
  });

  it('applies custom className to TableRow', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow className="highlight-row">
            <td>Data</td>
          </TableRow>
        </tbody>
      </table>
    );
    expect(container.querySelector('tr')).toHaveClass('highlight-row');
  });

  it('applies custom className to TableHead', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead className="bold-header">Head</TableHead>
          </tr>
        </thead>
      </table>
    );
    expect(container.querySelector('th')).toHaveClass('bold-header');
  });

  it('applies custom className to TableCell', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell className="right-align">Cell</TableCell>
          </tr>
        </tbody>
      </table>
    );
    expect(container.querySelector('td')).toHaveClass('right-align');
  });

  // Ref forwarding
  it('forwards ref to table element', () => {
    let refEl: HTMLTableElement | null = null;
    render(
      <Table
        ref={(el) => {
          refEl = el;
        }}
      >
        <tbody>
          <tr>
            <td>Data</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(refEl).toBeInstanceOf(HTMLTableElement);
  });

  // Empty table
  it('renders empty table gracefully', () => {
    const { container } = render(
      <Table>
        <TableBody></TableBody>
      </Table>
    );
    expect(container.querySelector('table')).toBeInTheDocument();
  });
});
