/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenerativeDashboard } from './GenerativeDashboard';

describe('GenerativeDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<GenerativeDashboard />);
    expect(container).toBeDefined();
  });
});
