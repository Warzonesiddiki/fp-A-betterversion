import { render, screen } from '@testing-library/react';
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
    expect(container).toBeDefined();
  });
});
