import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HedgeManager } from './HedgeManager';

describe('HedgeManager', () => {
  it('renders without crashing', () => {
    const { container } = render(<HedgeManager />);
    expect(container).toBeDefined();
  });
});
