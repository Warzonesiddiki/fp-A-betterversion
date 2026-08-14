import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormulaDisplay } from './CopilotFormulaDisplay';

describe('CopilotFormulaDisplay', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FormulaDisplay formula="" description="" confidence={0} onCopy={() => {}} />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
