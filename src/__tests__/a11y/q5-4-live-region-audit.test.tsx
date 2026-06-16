// src/__tests__/a11y/q5-4-live-region-audit.test.tsx
// Q5.4 LIVE_REGION_AUDIT — LiveRegion component ARIA attribute test
// Author: Artemis (handoff to Mnemosyne DRI) — T+3d 2026-06-25
// Reference: docs/a11y/Q5_4_LIVE_REGION_AUDIT_v0.1.md

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from '../../components/ui/LiveRegion';

describe('Q5.4 LiveRegion ARIA attributes', () => {
  test('renders with role="status"', () => {
    render(<LiveRegion message="Test status" />);
    const el = screen.getByRole('status');
    expect(el).toBeInTheDocument();
  });

  test('renders with aria-live="polite"', () => {
    render(<LiveRegion message="Test status" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  test('renders with aria-atomic="true"', () => {
    render(<LiveRegion message="Test status" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-atomic', 'true');
  });

  test('has sr-only class for screen-reader only visibility', () => {
    render(<LiveRegion message="Test status" />);
    const el = screen.getByRole('status');
    expect(el).toHaveClass('sr-only');
  });

  test('displays the message text', () => {
    render(<LiveRegion message="Connection restored" />);
    expect(screen.getByText('Connection restored')).toBeInTheDocument();
  });
});
