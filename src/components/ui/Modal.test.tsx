/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('shows content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Modal content
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('hides content when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        Modal content
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has prefers-reduced-motion safe transition classes (UX-PI-007)', () => {
    // WCAG 2.2 SC 2.3.3 (Animation from Interactions): motion-reduce override
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Reduced Motion Test">
        <p>Body</p>
      </Modal>
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    const dialog = container.querySelector('[role="dialog"]');
    expect(backdrop).toBeTruthy();
    expect(dialog).toBeTruthy();
    // Backdrop must include motion-reduce override
    expect(backdrop?.className).toMatch(/motion-reduce:transition-none/);
    // Dialog must include BOTH motion-reduce overrides (transition + transform)
    expect(dialog?.className).toMatch(/motion-reduce:transition-none/);
    expect(dialog?.className).toMatch(/motion-reduce:transform-none/);
  });

  it('renders title and children', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <h2>My Title</h2>
        <p>My children</p>
      </Modal>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My children')).toBeInTheDocument();
  });

  it('has role="dialog" attribute', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true" attribute', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  // Hera PICK S - VarianceAnalysisPage focus trap (WCAG 2.4.3 + 2.1.2 + 4.1.2)
  it('traps focus within the modal (WCAG 2.4.3 Focus Order)', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Test">
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    const focusable = dialog.querySelectorAll('button');
    expect(focusable.length).toBeGreaterThanOrEqual(3);
    buttons.forEach((btn) => {
      expect(dialog.contains(btn)).toBe(true);
    });
  });

  it('calls onClose when Escape key is pressed (WCAG 2.1.2 No Keyboard Trap)', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <p>Body</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders title with proper aria-labelledby (WCAG 4.1.2 Name/Role/Value)', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Accessible Title">
        <p>Body</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    if (titleId) {
      const titleEl = document.getElementById(titleId);
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent).toContain('Accessible Title');
    }
  });
});
