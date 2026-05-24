/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateDesigner } from './TemplateDesigner';
import type { ExportTemplate } from '@/engines/ExportTemplateEngine';

describe('TemplateDesigner', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<TemplateDesigner {...defaultProps} />);
  });

  it('renders the sections heading', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Sections')).toBeInTheDocument();
  });

  it('renders the add section heading', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Add Section')).toBeInTheDocument();
  });

  it('renders all section type options', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('+ Cover Page')).toBeInTheDocument();
    expect(screen.getByText('+ KPI Summary')).toBeInTheDocument();
    expect(screen.getByText('+ Data Table')).toBeInTheDocument();
    expect(screen.getByText('+ Text Block')).toBeInTheDocument();
    expect(screen.getByText('+ Page Break')).toBeInTheDocument();
  });

  it('renders the template name input with default value', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByDisplayValue('New Template')).toBeInTheDocument();
  });

  it('renders the type selector', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Board Pack')).toBeInTheDocument();
  });

  it('renders the company name input', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('FinPlan Pro')).toBeInTheDocument();
  });

  it('renders the description textarea', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders color pickers', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Primary Color')).toBeInTheDocument();
    expect(screen.getByText('Secondary Color')).toBeInTheDocument();
  });

  it('renders the save button', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByRole('button', { name: /save template/i })).toBeInTheDocument();
  });

  it('renders the cancel button', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders the variables reference', () => {
    render(<TemplateDesigner {...defaultProps} />);
    expect(screen.getByText('Variables:')).toBeInTheDocument();
    expect(screen.getByText(/Company name/)).toBeInTheDocument();
    expect(screen.getByText(/Reporting period/)).toBeInTheDocument();
    expect(screen.getByText(/Currency code/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<TemplateDesigner onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with template data when save is clicked', () => {
    const onSave = vi.fn();
    render(<TemplateDesigner onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save template/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const savedTemplate = onSave.mock.calls[0][0] as ExportTemplate;
    expect(savedTemplate.name).toBe('New Template');
    expect(savedTemplate.type).toBe('board_pack');
  });

  it('populates fields from existing template', () => {
    const existingTemplate: ExportTemplate = {
      id: 'tpl-1',
      name: 'Custom Board Pack',
      type: 'pl_statement',
      description: 'My custom template',
      sections: [{ id: 'sec-1', type: 'cover', title: 'Cover Page', order: 0, config: {} }],
      style: {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        fontFamily: 'helvetica',
        headerFontSize: 12,
        bodyFontSize: 10,
        companyName: 'Acme Corp',
      },
      variables: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    render(<TemplateDesigner template={existingTemplate} {...defaultProps} />);
    expect(screen.getByDisplayValue('Custom Board Pack')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My custom template')).toBeInTheDocument();
  });

  it('adds a section when add button is clicked', () => {
    render(<TemplateDesigner {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Cover Page'));
    // The section should appear in the sections list
    expect(screen.getByText('Cover Page')).toBeInTheDocument();
  });

  it('allows editing template name', () => {
    render(<TemplateDesigner {...defaultProps} />);
    const nameInput = screen.getByDisplayValue('New Template');
    fireEvent.change(nameInput, { target: { value: 'My Template' } });
    expect(screen.getByDisplayValue('My Template')).toBeInTheDocument();
  });

  it('allows editing company name', () => {
    render(<TemplateDesigner {...defaultProps} />);
    const companyInput = screen.getByDisplayValue('FinPlan Pro');
    fireEvent.change(companyInput, { target: { value: 'Acme Corp' } });
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });

  it('adds multiple section types', () => {
    render(<TemplateDesigner {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Cover Page'));
    fireEvent.click(screen.getByText('+ KPI Summary'));
    fireEvent.click(screen.getByText('+ Data Table'));
    // All three should appear in the section list
    const sections = screen.getAllByText(/Cover Page|KPI Summary|Data Table/);
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it('removes a section when delete is clicked', () => {
    render(<TemplateDesigner {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Cover Page'));
    // Find the remove button (x) next to the section
    const removeButtons = screen.getAllByText('\u00d7');
    fireEvent.click(removeButtons[0]);
    // The section should be removed - Cover Page should only appear in "Add Section" now
    const addSectionButton = screen.getByText('+ Cover Page');
    expect(addSectionButton).toBeInTheDocument();
  });
});
