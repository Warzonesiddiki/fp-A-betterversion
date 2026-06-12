/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportResultsPanel } from './ReportResultsPanel';

describe('ReportResultsPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportResultsPanel />);
    expect(container).toBeDefined();
  });
});
