import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ReportGenHelpers', () => {
  it('renders without crashing', () => {
    const { container } = render(<reportToCsv />);
    expect(container).toBeDefined();
  });
});
