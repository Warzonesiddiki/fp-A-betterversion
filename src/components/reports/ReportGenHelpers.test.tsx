/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { reportToCsv, ProgressPanel } from './ReportGenHelpers';

describe('ReportGenHelpers', () => {
  it('renders without crashing', () => {
    const { container } = render(<reportToCsv />);
    expect(container).toBeDefined();
  });
});
