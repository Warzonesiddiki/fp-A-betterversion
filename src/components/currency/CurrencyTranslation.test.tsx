import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CurrencyTranslation } from './CurrencyTranslation';

describe('CurrencyTranslation', () => {
  it('renders without crashing', () => {
    const { container } = render(<CurrencyTranslation />);
    expect(container).toBeDefined();
  });
});
