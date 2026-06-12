/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WaterfallChart } from './WaterfallChart';

describe('WaterfallChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<WaterfallChart />);
    expect(container).toBeDefined();
  });
});
