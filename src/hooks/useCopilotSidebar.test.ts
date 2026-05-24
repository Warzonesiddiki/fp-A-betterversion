/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCopilotSidebar } from './useCopilotSidebar';

describe('useCopilotSidebar', () => {
  beforeEach(() => {
    useCopilotSidebar.setState({ isOpen: false, activeTab: 'chat' });
  });

  it('should have correct initial state', () => {
    const state = useCopilotSidebar.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeTab).toBe('chat');
  });

  it('should toggle open state', () => {
    useCopilotSidebar.getState().toggle();
    expect(useCopilotSidebar.getState().isOpen).toBe(true);

    useCopilotSidebar.getState().toggle();
    expect(useCopilotSidebar.getState().isOpen).toBe(false);
  });

  it('should open', () => {
    useCopilotSidebar.getState().open();
    expect(useCopilotSidebar.getState().isOpen).toBe(true);
  });

  it('should close', () => {
    useCopilotSidebar.setState({ isOpen: true });
    useCopilotSidebar.getState().close();
    expect(useCopilotSidebar.getState().isOpen).toBe(false);
  });

  it('should set active tab', () => {
    useCopilotSidebar.getState().setActiveTab('alerts');
    expect(useCopilotSidebar.getState().activeTab).toBe('alerts');
  });

  it('should set active tab to suggestions', () => {
    useCopilotSidebar.getState().setActiveTab('suggestions');
    expect(useCopilotSidebar.getState().activeTab).toBe('suggestions');
  });
});
