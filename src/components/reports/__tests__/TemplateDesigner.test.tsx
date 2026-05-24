import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { TemplateDesigner } from '../TemplateDesigner';

describe('TemplateDesigner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders template name input', () => {
    render(<TemplateDesigner onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByDisplayValue('New Template')).toBeTruthy();
  });

  it('renders section list', () => {
    render(<TemplateDesigner onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Sections')).toBeTruthy();
    expect(screen.getByText('Add Section')).toBeTruthy();
  });
});
