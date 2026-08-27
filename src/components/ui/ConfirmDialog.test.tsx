/**
 * W6-P0-08 (Wave-7C integration-truth): ConfirmDialog regression coverage.
 *
 * Two defects captured red-first here:
 *  1. Dead host — `confirm.*` was exported but `<ConfirmDialog />` was mounted
 *     nowhere, so every promise deadlocked. The app-level mount lives in
 *     AppLayout (see AppLayout.test.tsx); this file pins the component+store
 *     contract.
 *  2. Single-slot resolve store — a second concurrent `open()` overwrote the
 *     first caller's options AND resolve, hanging the first caller forever.
 *     The queue model must settle callers strictly FIFO.
 * Plus stacked-Escape truth: Escape closes ONLY the topmost dialog layer
 * (confirm over Modal must not dismiss both).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import { Modal } from './Modal';
import { ConfirmDialog, confirm, useConfirmStore } from './ConfirmDialog';

const tick = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('ConfirmDialog', () => {
  beforeEach(() => {
    useConfirmStore.setState({ queue: [] });
  });

  it('renders nothing when no confirm is queued', () => {
    const { container } = render(<ConfirmDialog />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the front entry title and message when queued', async () => {
    render(<ConfirmDialog />);
    void confirm.custom({ title: 'Confirm Delete', message: 'Are you sure?' });
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', async () => {
    render(<ConfirmDialog />);
    void confirm.custom({ title: 'Test', message: 'Proceed?' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  it('renders custom button labels', async () => {
    render(<ConfirmDialog />);
    void confirm.custom({
      title: 'Test',
      message: 'Go?',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'No, keep',
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /no, keep/i })).toBeInTheDocument();
  });

  it('keeps an early confirm pending until a host mounts, then settles it', async () => {
    // Defect witness: before Wave-7C the app NEVER mounted a host, so this
    // exact sequence (call first, host appears later or never) hung forever.
    let settled: 'pending' | 'confirmed' | 'cancelled' = 'pending';
    void confirm.custom({ title: 'Early bird', message: 'queued before any host' }).then((v) => {
      settled = v ? 'confirmed' : 'cancelled';
    });
    await tick(25);
    expect(settled).toBe('pending');

    // Host mounts late (the app-level fix mounts it inside AppLayout).
    render(<ConfirmDialog />);
    expect(await screen.findByText('Early bird')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(settled).toBe('cancelled'));
  });

  it('settles two concurrent confirms FIFO: first displayed first, both settle', async () => {
    render(<ConfirmDialog />);
    const p1 = confirm.custom({ title: 'First ask', message: 'answer me first' });
    const p2 = confirm.custom({ title: 'Second ask', message: 'waiting in line' });

    // Only the FRONT entry is displayed.
    await waitFor(() => expect(screen.getByText('First ask')).toBeInTheDocument());
    expect(screen.queryByText('Second ask')).not.toBeInTheDocument();

    // Answering the front must NOT settle the waiter out of order.
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await expect(p1).resolves.toBe(true);

    // The waiting entry becomes the front and still works.
    expect(await screen.findByText('Second ask')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await expect(p2).resolves.toBe(false);

    expect(screen.queryByText('Second ask')).not.toBeInTheDocument();
  });

  it('drains a three-deep queue strictly FIFO through the store API', async () => {
    const results: boolean[] = [];
    const p1 = confirm.custom({ title: 'A', message: 'a' }).then((v) => void results.push(v));
    const p2 = confirm.custom({ title: 'B', message: 'b' }).then((v) => void results.push(v));
    const p3 = confirm.custom({ title: 'C', message: 'c' }).then((v) => void results.push(v));

    useConfirmStore.getState().close(true);
    useConfirmStore.getState().close(true);
    useConfirmStore.getState().close(false);
    useConfirmStore.getState().close(true); // empty queue: harmless no-op

    await Promise.all([p1, p2, p3]);
    expect(results).toEqual([true, true, false]);
    expect(useConfirmStore.getState().queue).toHaveLength(0);
  });

  it('confirm.delete settles through the host (danger variant)', async () => {
    render(<ConfirmDialog />);
    const p = confirm.delete('Q3 Report');
    expect(await screen.findByText('Delete Q3 Report?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await expect(p).resolves.toBe(true);
  });

  it('Escape on a lone confirm cancels the front entry', async () => {
    render(<ConfirmDialog />);
    const p = confirm.custom({ title: 'Lone confirm', message: 'press escape' });
    await screen.findByText('Lone confirm');
    fireEvent.keyDown(document, { key: 'Escape' });
    await expect(p).resolves.toBe(false);
    expect(useConfirmStore.getState().queue).toHaveLength(0);
  });

  it('Escape closes only the topmost layer: confirm over Modal leaves Modal open', async () => {
    const onModalClose = vi.fn();
    render(
      <>
        <Modal isOpen ariaLabel="Underlying" onClose={onModalClose}>
          <p>modal body</p>
        </Modal>
        <ConfirmDialog />
      </>
    );
    const p = confirm.custom({ title: 'Top confirm', message: 'escape me, not the modal' });
    await screen.findByText('Top confirm');

    // First Escape: confirm layer is topmost → confirm cancels, Modal stays.
    fireEvent.keyDown(document, { key: 'Escape' });
    await expect(p).resolves.toBe(false);
    expect(onModalClose).not.toHaveBeenCalled();
    expect(screen.getByText('modal body')).toBeInTheDocument();

    // Second Escape: confirm gone → Modal layer is now topmost → closes.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });
});
