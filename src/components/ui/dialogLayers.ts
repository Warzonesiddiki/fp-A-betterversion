/**
 * W6-P0-08 stacked-Escape coordination.
 *
 * Tiny LIFO registry of currently-open dialog layers (Modal instances and the
 * global ConfirmDialog). Each open dialog registers one opaque id on mount of
 * its open state and unregisters on close; a dialog may only consume Escape
 * when its id is the TOP of the stack. This is what makes "confirm dialog
 * opened over a Modal" dismiss exactly one layer per keypress instead of
 * both (both listened on document keydown with no ordering before Wave-7C).
 *
 * Deliberately framework-free and side-effect-free: ids are process-local
 * integers, never reused, and popping an unknown id is a safe no-op so a
 * double-cleanup cannot corrupt the stack.
 */

const stack: number[] = [];
let nextId = 1;

/** Register an open dialog layer; returns its opaque id. */
export function pushDialogLayer(): number {
  const id = nextId;
  nextId += 1;
  stack.push(id);
  return id;
}

/** Unregister a layer by id. Unknown or already-popped ids are ignored. */
export function popDialogLayer(id: number): void {
  const index = stack.lastIndexOf(id);
  if (index !== -1) stack.splice(index, 1);
}

/** True only while `id` is the topmost open layer. */
export function isTopDialogLayer(id: number): boolean {
  return stack[stack.length - 1] === id;
}
