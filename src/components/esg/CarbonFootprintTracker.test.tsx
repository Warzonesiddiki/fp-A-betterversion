import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CarbonFootprintTracker } from './CarbonFootprintTracker';

describe('CarbonFootprintTracker', () => {
  it('renders without crashing', () => {
    const { container } = render(<CarbonFootprintTracker />);
    expect(container).toBeDefined();
  });
});
