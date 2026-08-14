import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InsightsTab } from './CopilotInsightsTab';

describe('CopilotInsightsTab', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <InsightsTab
        formulaResult={null}
        onFormulaResultChange={() => {}}
        onSwitchToChat={() => {}}
      />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
