import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WidgetLibrary } from './WidgetLibrary';

describe('WidgetLibrary', () => {
  it('renders without crashing', () => {
    const { container } = render(<WidgetLibrary />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
