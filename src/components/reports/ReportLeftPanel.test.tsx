import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportLeftPanel } from './ReportLeftPanel';

describe('ReportLeftPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportLeftPanel />);
    expect(container).toBeDefined();
  });
});
