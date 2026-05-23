import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileDropZone } from './FileDropZone';

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
});
