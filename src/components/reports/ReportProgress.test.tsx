import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportProgress } from './ReportProgress';

describe('ReportProgress', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportProgress />);
    expect(container).toBeDefined();
  });
});
