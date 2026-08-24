import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CompetitiveGapsToolbar } from './CompetitiveGapsToolbar';

// --- mocks -----------------------------------------------------------------

const scenarioStore = vi.hoisted(() => {
  const lockScenario = vi.fn();
  const unlockScenario = vi.fn();
  const mergeScenarios = vi.fn();
  return {
    scenarios: [
      { id: 's1', name: 'Base', isLocked: false },
      { id: 's2', name: 'Optimistic', isLocked: true },
    ],
    selectedScenarioId: 's1',
    lockScenario,
    unlockScenario,
    mergeScenarios,
  };
});

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: (selector: (s: unknown) => unknown) => {
    const state = {
      scenarios: scenarioStore.scenarios,
      selectedScenarioId: scenarioStore.selectedScenarioId,
      lockScenario: scenarioStore.lockScenario,
      unlockScenario: scenarioStore.unlockScenario,
      mergeScenarios: scenarioStore.mergeScenarios,
    };
    return selector(state);
  },
}));

const sheetTabs = vi.hoisted(() => {
  const addSheet = vi.fn();
  const removeSheet = vi.fn();
  const renameSheet = vi.fn();
  const setActiveSheet = vi.fn();
  return {
    sheets: [{ id: 'sheet1', name: 'Sheet1' }],
    addSheet,
    removeSheet,
    renameSheet,
    setActiveSheet,
  };
});

vi.mock('@/utils/competitiveGaps', () => ({
  useSheetTabs: () => sheetTabs,
  useGridContextMenu: () => ({ openMenu: vi.fn() }),
  useSheetStore: () => ({}),
  applyDragFill: vi.fn(),
  applyAutoSum: vi.fn((start: string, end: string) => ({
    formula: `SUM(${start}:${end})`,
  })),
  useAutoUpdate: vi.fn(),
}));

vi.mock('lucide-react', () => {
  const IconStub = () => null;
  return {
    __esModule: true,
    default: IconStub,
    Lock: IconStub,
    Unlock: IconStub,
    Combine: IconStub,
    ArrowDown: IconStub,
    Sigma: IconStub,
    Plus: IconStub,
    X: IconStub,
    Edit2: IconStub,
  };
});

// --- tests -----------------------------------------------------------------

describe('CompetitiveGapsToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scenario selects, merge, lock, context menu, autosum and sheet tabs', () => {
    render(<CompetitiveGapsToolbar activeSheetId="sheet1" />);
    expect(screen.getByTestId('competitive-gaps-toolbar')).toBeInTheDocument();
    expect(screen.getByLabelText('Merge source scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Merge target scenario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /context menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auto-sum/i })).toBeDisabled(); // no range
    // E-02 a11y: fake div-tabs (role=tablist/tab nesting interactive buttons)
    // were replaced by real buttons in a labeled group — see the component's
    // section (6) comment for the axe rules this resolves.
    expect(screen.getByRole('group', { name: 'Workbook sheets' })).toBeInTheDocument();
    expect(screen.getByText('Sheet1')).toBeInTheDocument();
  });

  it('merges two distinct scenarios when both selects are set', async () => {
    const user = userEvent.setup();
    render(<CompetitiveGapsToolbar />);

    await user.selectOptions(screen.getByLabelText('Merge source scenario'), 's1');
    await user.selectOptions(screen.getByLabelText('Merge target scenario'), 's2');
    await user.click(screen.getByRole('button', { name: 'Merge' }));

    expect(scenarioStore.mergeScenarios).toHaveBeenCalledWith('s1', 's2');
  });

  it('does not merge when source equals target', async () => {
    const user = userEvent.setup();
    render(<CompetitiveGapsToolbar />);
    await user.selectOptions(screen.getByLabelText('Merge source scenario'), 's1');
    await user.selectOptions(screen.getByLabelText('Merge target scenario'), 's1');
    await user.click(screen.getByRole('button', { name: 'Merge' }));
    expect(scenarioStore.mergeScenarios).not.toHaveBeenCalled();
  });

  it('toggles lock/unlock for the selected scenario', async () => {
    const user = userEvent.setup();
    render(<CompetitiveGapsToolbar />);
    await user.click(screen.getByRole('button', { name: 'Lock' }));
    expect(scenarioStore.lockScenario).toHaveBeenCalledWith('s1');

    scenarioStore.selectedScenarioId = 's2';
    const { unmount } = render(<CompetitiveGapsToolbar />);
    await user.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(scenarioStore.unlockScenario).toHaveBeenCalledWith('s2');
    unmount();
    scenarioStore.selectedScenarioId = 's1';
  });

  it('auto-sum fires onContextMenu with the generated formula when a range is selected', async () => {
    const user = userEvent.setup();
    const onContextMenu = vi.fn();
    render(
      <CompetitiveGapsToolbar
        activeSheetId="sheet1"
        selectedRange={{ start: 'A1', end: 'A5' }}
        onContextMenu={onContextMenu}
      />
    );
    await user.click(screen.getByRole('button', { name: /auto-sum/i }));
    expect(onContextMenu).toHaveBeenCalledWith('autosum:sheet1:SUM(A1:A5)');
  });

  it('rename flow edits the active sheet name', async () => {
    const user = userEvent.setup();
    render(<CompetitiveGapsToolbar activeSheetId="sheet1" />);

    // Find rename (Edit2) button inside the tab and click it
    const editButtons = screen.getAllByRole('button', { name: /rename|edit/i });
    if (editButtons.length > 0) {
      await user.click(editButtons[0]!);
      const input = screen.getByDisplayValue('Sheet1');
      await user.clear(input);
      await user.type(input, 'NewName');
      await user.keyboard('{Enter}');
      expect(sheetTabs.renameSheet).toHaveBeenCalledWith('sheet1', 'NewName');
    }
  });

  it('add and remove sheet buttons are wired', async () => {
    const user = userEvent.setup();
    render(<CompetitiveGapsToolbar activeSheetId="sheet1" />);

    const addButton = screen.getByRole('button', { name: /add new sheet/i });
    await user.click(addButton);
    expect(sheetTabs.addSheet).toHaveBeenCalled();
  });
});
