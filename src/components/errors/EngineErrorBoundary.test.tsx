import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EngineErrorBoundary } from './EngineErrorBoundary';

describe('EngineErrorBoundary', () => {
  it('renders without crashing', () => {
    const { container } = render(<EngineErrorBoundary />);
    expect(container).toBeDefined();
  });
});
