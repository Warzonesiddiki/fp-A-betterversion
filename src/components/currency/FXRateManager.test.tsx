import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FXRateManager } from './FXRateManager';

describe('FXRateManager', () => {
  it('renders without crashing', () => {
    const { container } = render(<FXRateManager />);
    expect(container).toBeDefined();
  });
});
