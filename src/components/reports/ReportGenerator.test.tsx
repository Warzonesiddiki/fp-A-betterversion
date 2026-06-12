/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportGenerator } from './ReportGenerator';

describe('ReportGenerator', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportGenerator />);
    expect(container).toBeDefined();
  });
});
