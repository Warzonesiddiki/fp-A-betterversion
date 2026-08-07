import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CSRDReportGenerator } from './CSRDReportGenerator';

describe('CSRDReportGenerator', () => {
  it('renders without crashing', () => {
    const { container } = render(<CSRDReportGenerator />);
    expect(container).toBeDefined();
  });
});
