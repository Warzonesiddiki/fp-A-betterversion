/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FinPlanGrid } from './FinPlanGrid';

describe('FinPlanGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(<FinPlanGrid columns={[]} rows={[]} />);
    expect(container).toBeDefined();
  });
});
