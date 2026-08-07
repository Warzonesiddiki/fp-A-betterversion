import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportLayoutEditor } from './ReportLayoutEditor';

describe('ReportLayoutEditor', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportLayoutEditor />);
    expect(container).toBeDefined();
  });
});
