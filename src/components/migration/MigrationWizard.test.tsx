import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MigrationWizard from './MigrationWizard';

describe('MigrationWizard', () => {
  it('renders without crashing', () => {
    const { container } = render(<MigrationWizard />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
