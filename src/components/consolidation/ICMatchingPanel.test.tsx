import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ICMatchingPanel } from './ICMatchingPanel';

describe('ICMatchingPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ICMatchingPanel />);
    expect(container).toBeDefined();
  });
});
