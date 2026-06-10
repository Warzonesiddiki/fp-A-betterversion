import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MigrationWizard from './MigrationWizard';

describe('MigrationWizard', () => {
  it('renders without crashing', () => {
    const { container } = render(<MigrationWizard />);
    expect(container).toBeDefined();
  });
});
