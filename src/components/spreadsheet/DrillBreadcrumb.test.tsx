/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrillBreadcrumb } from './DrillBreadcrumb';

describe('DrillBreadcrumb', () => {
  it('renders without crashing', () => {
    const { container } = render(<DrillBreadcrumb />);
    expect(container).toBeDefined();
  });
});
