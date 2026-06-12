/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartShowcasePage } from './ChartShowcasePage';

describe('ChartShowcasePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChartShowcasePage />);
    expect(container).toBeDefined();
  });
});
