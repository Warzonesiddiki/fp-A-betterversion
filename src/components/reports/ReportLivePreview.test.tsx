/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportLivePreview } from './ReportLivePreview';

describe('ReportLivePreview', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportLivePreview />);
    expect(container).toBeDefined();
  });
});
