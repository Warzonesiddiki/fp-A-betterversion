/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportToolbar } from './ReportToolbar';

describe('ReportToolbar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportToolbar />);
    expect(container).toBeDefined();
  });
});
