import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<FilterPanel />);
    expect(container).toBeDefined();
  });
});
