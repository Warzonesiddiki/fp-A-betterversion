import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartShowcasePage } from './ChartShowcasePage';

describe('ChartShowcasePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChartShowcasePage />);
    expect(container).toBeDefined();
  });
});
