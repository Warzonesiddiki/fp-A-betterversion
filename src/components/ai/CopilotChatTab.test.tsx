import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatTab } from './CopilotChatTab';
import type { CopilotMessage, PageContext } from './CopilotTypes';
import type { FormulaSuggestion } from '@/engines/AICopilotEngine';
import * as React from 'react';

describe('CopilotChatTab', () => {
  const mockMessages: CopilotMessage[] = [];
  const mockPageContext: PageContext = {
    label: '',
    suggestions: [],
    alertThreshold: 0,
  };
  const mockScrollRef = React.createRef() as React.RefObject<HTMLDivElement>;
  const mockInputRef = React.createRef() as React.RefObject<HTMLInputElement>;
  const mockFormulaResult: FormulaSuggestion | null = null;

  it('renders without crashing', () => {
    const { container } = render(
      <ChatTab
        messages={mockMessages}
        inputValue=""
        isProcessing={false}
        pageContext={mockPageContext}
        formulaResult={mockFormulaResult}
        scrollRef={mockScrollRef}
        inputRef={mockInputRef}
        onInputChange={(value) => {}}
        onKeyDown={(e) => {}}
        onSend={(text) => {}}
        onSuggestionClick={(suggestion) => {}}
      />
    );
    expect(container).toBeDefined();
  });
});
