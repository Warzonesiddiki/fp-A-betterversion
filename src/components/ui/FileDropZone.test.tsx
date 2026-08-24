import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FileDropZone } from './FileDropZone';

// E-02-F: register jest-axe's matcher locally (repo harness doesn't extend it
// globally — the wcag-aa suites use a manual severity filter instead).
expect.extend(toHaveNoViolations);

const CSV_FILE = new File(['account,amount\n1000,50'], 'transactions.csv', {
  type: 'text/csv',
});

function selectCsvFile() {
  const input = document.getElementById('file-input') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [CSV_FILE] } });
}

describe('FileDropZone', () => {
  it('renders default state with heading', () => {
    render(<FileDropZone onFile={vi.fn()} />);
    expect(screen.getByText('Import Financial Data')).toBeInTheDocument();
  });

  it('shows file type labels for CSV and XLSX', () => {
    render(<FileDropZone onFile={vi.fn()} />);
    const csvLabels = screen.getAllByText('CSV');
    expect(csvLabels.length).toBeGreaterThanOrEqual(1);
    const xlsxLabels = screen.getAllByText('XLSX');
    expect(xlsxLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Data Pipeline Protocol section', () => {
    render(<FileDropZone onFile={vi.fn()} />);
    expect(screen.getByText('Data Pipeline Protocol')).toBeInTheDocument();
  });

  it('has a hidden file input', () => {
    render(<FileDropZone onFile={vi.fn()} />);
    const input = document.getElementById('file-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('file');
    expect(input.className).toContain('hidden');
  });

  it('accepts custom accept attribute', () => {
    render(<FileDropZone onFile={vi.fn()} accept=".pdf" />);
    const input = document.getElementById('file-input') as HTMLInputElement;
    expect(input.accept).toBe('.pdf');
  });

  it('shows drag active state on dragOver', () => {
    render(<FileDropZone onFile={vi.fn()} />);
    const dropZone = screen.getByRole('button');
    fireEvent.dragOver(dropZone);
    expect(screen.getByText('Drop to upload')).toBeInTheDocument();
  });

  it('reverts to default state on dragLeave', () => {
    render(<FileDropZone onFile={vi.fn()} />);
    const dropZone = screen.getByRole('button');
    fireEvent.dragOver(dropZone);
    expect(screen.getByText('Drop to upload')).toBeInTheDocument();
    fireEvent.dragLeave(dropZone);
    expect(screen.getByText('Import Financial Data')).toBeInTheDocument();
  });

  // E-02-F: file-selected state — dropzone becomes a non-interactive display;
  // Remove/Replace are sibling buttons OUTSIDE the interactive zone.
  describe('file-selected state (E-02-F)', () => {
    it('shows the selected file and sibling Replace/Remove actions', () => {
      render(<FileDropZone onFile={vi.fn()} />);
      selectCsvFile();

      expect(screen.getAllByText('transactions.csv').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: 'Replace transactions.csv' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove transactions.csv' })).toBeInTheDocument();
      // The old inline ✕ (nested inside the dropzone) is gone.
      expect(screen.queryByRole('button', { name: 'Remove file' })).toBeNull();
    });

    it('drops the button role from the dropzone once a file is selected', () => {
      const { container } = render(<FileDropZone onFile={vi.fn()} />);
      expect(screen.getByRole('button')).toBeTruthy(); // empty state: dropzone is the button
      selectCsvFile();
      const zone = container.querySelector('[role="button"]');
      expect(zone).toBeNull(); // display-only now
    });

    it('Remove returns to the empty upload state', () => {
      render(<FileDropZone onFile={vi.fn()} />);
      selectCsvFile();
      fireEvent.click(screen.getByRole('button', { name: 'Remove transactions.csv' }));
      expect(screen.getByText('Import Financial Data')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Remove transactions/ })).toBeNull();
    });

    it('Replace re-opens the file picker via the hidden input', () => {
      render(<FileDropZone onFile={vi.fn()} />);
      selectCsvFile();
      const input = document.getElementById('file-input') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
      fireEvent.click(screen.getByRole('button', { name: 'Replace transactions.csv' }));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });

    it('Enter/Space on the empty dropzone opens the picker (keyboard parity)', () => {
      render(<FileDropZone onFile={vi.fn()} />);
      const input = document.getElementById('file-input') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
      const dropZone = screen.getByRole('button');
      fireEvent.keyDown(dropZone, { key: 'Enter' });
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });
  });

  // E-02-F VERIFY gate: axe coverage across all three visual states —
  // empty / dragover / file-selected. Bar: zero violations of any severity
  // (this component is the a11y regression epicentre for upload flows).
  describe('axe coverage (E-02-F)', () => {
    it('empty state has no axe violations', async () => {
      const { container } = render(<FileDropZone onFile={vi.fn()} />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('dragover state has no axe violations', async () => {
      const { container } = render(<FileDropZone onFile={vi.fn()} />);
      fireEvent.dragOver(screen.getByRole('button'));
      expect(await axe(container)).toHaveNoViolations();
    });

    it('file-selected state has no axe violations', async () => {
      const { container } = render(<FileDropZone onFile={vi.fn()} />);
      selectCsvFile();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
