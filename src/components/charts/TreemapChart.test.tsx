import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TreemapChart } from './TreemapChart';

describe('TreemapChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<TreemapChart />);
    expect(container).toBeDefined();
  });
});
