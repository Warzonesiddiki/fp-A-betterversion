import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportLivePreview } from './ReportLivePreview';

describe('ReportLivePreview', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportLivePreview />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
