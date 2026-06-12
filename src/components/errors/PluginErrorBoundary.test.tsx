/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginErrorBoundary } from './PluginErrorBoundary';

describe('PluginErrorBoundary', () => {
  it('renders without crashing', () => {
    const { container } = render(<PluginErrorBoundary />);
    expect(container).toBeDefined();
  });
});
