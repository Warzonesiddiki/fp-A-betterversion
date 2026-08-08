import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FindReplaceDialog } from './FindReplaceDialog';

vi.mock('lucide-react', () => {
  const IconStub = () => null;
  const icons: Record<string, unknown> = { __esModule: true, default: IconStub };
  for (const n of [
    'X',
    'ChevronUp',
    'ChevronDown',
    'Search',
    'Replace',
    'AlertTriangle',
    'CaseSensitive',
    'Regex',
  ]) {
    icons[n] = IconStub;
  }
  return icons;
});

// --- Fake AG Grid API ------------------------------------------------------

function makeGridApi() {
  const data = [
    { name: 'Alpha', amount: 100, note: 'first row' },
    { name: 'beta', amount: 200, note: 'second row' },
    { name: 'Alpha', amount: 300, note: 'third row' },
  ];
  const nodes = data.map((d, i) => ({
    data: d,
    rowIndex: i,
    setDataValue: (colId: string, value: unknown) => {
      d[colId as keyof typeof d] = value as never;
    },
  }));
  const columns = ['name', 'amount', 'note'].map((id) => ({ getColId: () => id }));
  return {
    data,
    nodes,
    columns,
    forEachNode: (cb: (n: (typeof nodes)[number]) => void) => nodes.forEach(cb),
    getColumns: () => columns,
    getDisplayedRowAtIndex: (i: number) => nodes[i],
    setFocusedCell: vi.fn(),
    ensureIndexVisible: vi.fn(),
  };
}

function renderDialog(gridApi: ReturnType<typeof makeGridApi>, isOpen = true) {
  const onClose = vi.fn();
  const utils = render(
    <FindReplaceDialog gridApi={gridApi as never} isOpen={isOpen} onClose={onClose} />
  );
  return { ...utils, onClose, unmount: utils.unmount };
}

async function runFind(user: ReturnType<typeof userEvent.setup>, term: string) {
  await user.type(screen.getByLabelText('Find text'), term);
  await user.keyboard('{Enter}');
}

describe('FindReplaceDialog (data-driven)', () => {
  it('returns null when closed', () => {
    const gridApi = makeGridApi();
    renderDialog(gridApi, false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('finds all matches via Enter and navigates to the first one', async () => {
    const user = userEvent.setup();
    const gridApi = makeGridApi();
    renderDialog(gridApi);

    await runFind(user, 'Alpha');

    expect(gridApi.setFocusedCell).toHaveBeenCalledWith(0, 'name');
    expect(gridApi.ensureIndexVisible).toHaveBeenCalledWith(0, 'middle');
    // counter shows "1 of 2"
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('next/previous cycle through matches', async () => {
    const user = userEvent.setup();
    const gridApi = makeGridApi();
    renderDialog(gridApi);

    await runFind(user, 'Alpha');
    await user.click(screen.getByRole('button', { name: 'Next match' }));
    expect(gridApi.setFocusedCell).toHaveBeenLastCalledWith(2, 'name');
    expect(screen.getByText('2 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous match' }));
    expect(gridApi.setFocusedCell).toHaveBeenLastCalledWith(0, 'name');
  });

  it('replaces the current match', async () => {
    const user = userEvent.setup();
    const gridApi = makeGridApi();
    renderDialog(gridApi);

    await runFind(user, 'Alpha');
    await user.type(screen.getByLabelText('Replace text'), 'Omega');
    await user.click(screen.getByRole('button', { name: 'Replace' }));

    expect(gridApi.data[0]!.name).toBe('Omega');
  });

  it('replace all swaps every case-insensitive occurrence', async () => {
    const user = userEvent.setup();
    const gridApi = makeGridApi();
    renderDialog(gridApi);

    await runFind(user, 'Alpha');
    await user.type(screen.getByLabelText('Replace text'), 'Omega');
    await user.click(screen.getByRole('button', { name: 'Replace All' }));

    expect(gridApi.data[0]!.name).toBe('Omega');
    expect(gridApi.data[1]!.name).toBe('beta');
    expect(gridApi.data[2]!.name).toBe('Omega');
    expect(screen.getByRole('status')).toHaveTextContent('Replaced 2 occurrences');
  });

  it('honors match-case and regex options', async () => {
    const user = userEvent.setup();

    // match case ON → only exact 'Alpha' (2 matches)
    const strict = renderDialog(makeGridApi());
    await user.click(screen.getByRole('button', { name: 'Match case' }));
    await runFind(user, 'Alpha');
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    strict.unmount();

    // match case OFF → 'alpha' matches rows 0 and 2 (name column)
    const loose = renderDialog(makeGridApi());
    await runFind(user, 'alpha');
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    loose.unmount();

    // regex ON with a pattern matching 'row' in all three notes
    const regex = renderDialog(makeGridApi());
    await user.click(screen.getByRole('button', { name: 'Use regex' }));
    await runFind(user, 'r.w');
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    regex.unmount();
  });

  it('invalid regex falls back to substring search and reports no results', async () => {
    const user = userEvent.setup();
    const gridApi = makeGridApi();
    renderDialog(gridApi);

    await user.click(screen.getByRole('button', { name: 'Use regex' }));
    // fireEvent bypasses userEvent's key-descriptor parsing of the '[' char
    const { fireEvent } = await import('@testing-library/react');
    const findInput = screen.getByLabelText('Find text');
    fireEvent.change(findInput, { target: { value: '[invalid' } });
    await user.keyboard('{Enter}');
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('escape closes the dialog', async () => {
    const user = userEvent.setup();
    const gridApi = makeGridApi();
    const { onClose } = renderDialog(gridApi);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
