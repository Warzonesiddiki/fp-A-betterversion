import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PersonaBadge } from './PersonaBadge';

describe('PersonaBadge', () => {
  it('renders the label text', () => {
    render(<PersonaBadge variant="cfo" label="CFO View" />);
    expect(screen.getByText('CFO View')).toBeInTheDocument();
  });

  it('has role="img" and aria-label for screen readers (WCAG 4.1.2)', () => {
    render(<PersonaBadge variant="controller" label="Controller View" />);
    const badge = screen.getByRole('img', { name: /Persona: Controller View/i });
    expect(badge).toBeInTheDocument();
  });

  it('exposes variant via data-persona attribute (WCAG 1.3.1)', () => {
    const { container } = render(<PersonaBadge variant="analyst" label="Analyst View" />);
    const badge = container.querySelector('[data-persona="analyst"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies size class for sm variant', () => {
    const { container } = render(<PersonaBadge variant="cfo" label="CFO" size="sm" />);
    const badge = container.querySelector('[data-persona="cfo"]');
    expect(badge?.className).toMatch(/text-xs/);
  });

  it('applies size class for lg variant', () => {
    const { container } = render(<PersonaBadge variant="auditor" label="Auditor" size="lg" />);
    const badge = container.querySelector('[data-persona="auditor"]');
    expect(badge?.className).toMatch(/text-base/);
  });

  it('supports all 19 persona variants without crashing', () => {
    const variants: Array<{ v: 'cfo' | 'controller' | 'analyst' | 'auditor' | 'compliance' | 'treasurer' | 'cxo' | 'board' | 'tax' | 'fp_a' | 'revenue' | 'cost' | 'capex' | 'hr' | 'it' | 'legal' | 'procurement' | 'sales' | 'compliance_officer'; l: string }> = [
      { v: 'cfo', l: 'CFO' },
      { v: 'controller', l: 'Controller' },
      { v: 'analyst', l: 'Analyst' },
      { v: 'auditor', l: 'Auditor' },
      { v: 'compliance', l: 'Compliance' },
      { v: 'treasurer', l: 'Treasurer' },
      { v: 'cxo', l: 'CXO' },
      { v: 'board', l: 'Board' },
      { v: 'tax', l: 'Tax' },
      { v: 'fp_a', l: 'FP&A' },
      { v: 'revenue', l: 'Revenue' },
      { v: 'cost', l: 'Cost' },
      { v: 'capex', l: 'CapEx' },
      { v: 'hr', l: 'HR' },
      { v: 'it', l: 'IT' },
      { v: 'legal', l: 'Legal' },
      { v: 'procurement', l: 'Procurement' },
      { v: 'sales', l: 'Sales' },
      { v: 'compliance_officer', l: 'Compliance Officer' },
    ];
    variants.forEach(({ v, l }) => {
      const { container } = render(<PersonaBadge variant={v} label={l} />);
      expect(container.querySelector(`[data-persona="${v}"]`)).toBeInTheDocument();
    });
  });

  it('falls back to cfo styling for unknown variant', () => {
    // @ts-expect-error - testing unknown variant fallback
    const { container } = render(<PersonaBadge variant="unknown" label="X" />);
    const badge = container.querySelector('[data-persona="unknown"]');
    expect(badge).toBeInTheDocument();
    expect(badge?.className).toMatch(/blue/);
  });
});
