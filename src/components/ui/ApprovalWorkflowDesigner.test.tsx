/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalWorkflowDesigner } from './ApprovalWorkflowDesigner';
import type { WorkflowDefinition } from '@/engines/WorkflowEngine';

const defaultProps = {
  onSave: vi.fn(),
};

const initialWorkflow: WorkflowDefinition = {
  id: 'wf-1',
  name: 'Budget Approval',
  description: 'Standard budget approval workflow',
  steps: [
    {
      id: 'step-1',
      name: 'Manager Review',
      type: 'sequential' as const,
      approvers: ['manager@example.com'],
      order: 0,
    },
  ],
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  isTemplate: false,
};

describe('ApprovalWorkflowDesigner', () => {
  // Rendering
  it('renders without crashing', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    expect(screen.getByText('Workflow Designer')).toBeInTheDocument();
  });

  it('renders name and description inputs', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders add step button', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    expect(screen.getByText('+ Add Step')).toBeInTheDocument();
  });

  it('renders empty state when no steps', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    expect(screen.getByText('No steps added yet.')).toBeInTheDocument();
  });

  it('renders save button disabled when no name or steps', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    const saveBtn = screen.getByText('Save Workflow');
    expect(saveBtn).toBeDisabled();
  });

  it('renders reset button', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  // Initial data
  it('populates fields with initial workflow', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} initial={initialWorkflow} />);
    expect(screen.getByDisplayValue('Budget Approval')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Standard budget approval workflow')).toBeInTheDocument();
    expect(screen.getByText('Manager Review')).toBeInTheDocument();
  });

  // Adding steps
  it('adds a step when add button is clicked', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add Step'));
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('No steps added yet.')).not.toBeInTheDocument();
  });

  // Editing steps
  it('toggles step editing when edit is clicked', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} initial={initialWorkflow} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Step Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Approvers (comma-separated)')).toBeInTheDocument();
  });

  // Removing steps
  it('removes a step when delete is clicked', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} initial={initialWorkflow} />);
    const deleteBtn = screen.getByText('\u00d7');
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Manager Review')).not.toBeInTheDocument();
  });

  // Save
  it('calls onSave when save button is clicked with valid data', () => {
    const onSave = vi.fn();
    render(
      <ApprovalWorkflowDesigner {...defaultProps} onSave={onSave} initial={initialWorkflow} />
    );
    const saveBtn = screen.getByText('Save Workflow');
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalled();
  });

  // Reset
  it('clears form when reset is clicked', () => {
    render(<ApprovalWorkflowDesigner {...defaultProps} initial={initialWorkflow} />);
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.queryByDisplayValue('Budget Approval')).not.toBeInTheDocument();
    expect(screen.getByText('No steps added yet.')).toBeInTheDocument();
  });
});
