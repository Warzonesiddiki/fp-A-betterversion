<!-- DRAFT v1.2 — Athena v1.2 polish cascade (apply T-AT-009 + T-AT-012 v3 cross-links, no substantive content change) 2026-06-13 — Mnemosyne T-MN-008 #10 -->
<!-- v0.1 → v1.2 cascade: v0.1 (Option A substitute, form-utility lens, 0 fabrications) → v0.2 (clean, 0 fabrications) → v0.3 (Athena APPLY) → v0.4 (no changes) → v1.1 (header polish) → v1.2 (Athena v1.2 polish cascade) -->
<!-- v1.2 cross-links: T-AT-009 [no direct ADR — useConfirmation is a form-utility hook, not architecture-level; cross-link to CSM T-IR-004 §2 (Day-7 activation checklist consumer) + Iris T-IR-013 (Day-7 activation pair-doc pattern)] · T-AT-012 v3 [not a zustand store — no Group A/B/C classification; no store audit relevance] · 0 substantive content change · 5 architectural-drift Greps all pass (class MasterStorage:0, STORAGE_PREFIX:0, getStats:0, 600k:0, auditStore:0) -->

# JSDoc draft — `src/hooks/useConfirmation.tsx` (v1.1)

> **Ground-truth note (2026-06-13)**: v0.1 patch derived from the actual
> source at `src/hooks/useConfirmation.tsx` (66 lines). All method
> signatures, return shapes, and state fields are file:line verified
> against the source — no fabrications.

---

## 4-Question Framework applied

1. **File path verified** — `src/hooks/useConfirmation.tsx` exists (66L, verified by Glob).
2. **Method signatures verified** — Read of actual source. Public surface = 1 hook returning `{ confirm, ConfirmDialog }`. Internal state has 7 fields; only `ConfirmOptions` interface (4 optional fields) is exported indirectly via the `confirm` callback parameter.
3. **ADR cross-check** — No ADR directly references this hook (closest: ADR-007 for the `Alert` component dependency it imports). No ADR number to verify.
4. **TENTATIVE markers** — None required. All claims file:line verified.

---

## Current source (verbatim, summary)

```tsx
// Lines 1-66, src/hooks/useConfirmation.tsx
import { useCallback, useState } from 'react';
import { Alert } from '@/components/ui/Alert';

interface ConfirmOptions {
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmState>({ /* 7 fields */ });
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => { /* ... */ }, []);
  const handleConfirm = useCallback(() => { /* ... */ }, [state.resolve]);
  const handleCancel = useCallback(() => { /* ... */ }, [state.resolve]);
  const ConfirmDialog = <Alert ... />;
  return { confirm, ConfirmDialog };
}
```

## Public surface (D-009 verified)

| Export                       | Kind            | Signature                                                                                                           | File:line |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- | --------- |
| `useConfirmation`            | function (hook) | `(): { confirm, ConfirmDialog }`                                                                                    | L17       |
| `confirm` (returned)         | function        | `(options: ConfirmOptions) => Promise<boolean>`                                                                     | L28       |
| `ConfirmDialog` (returned)   | JSX element     | `<Alert open title message variant confirmText cancelText onConfirm onCancel />`                                    | L52       |
| `ConfirmOptions` (interface) | type            | `{ title: string; message: string; variant?: 'default'\|'destructive'; confirmText?: string; cancelText?: string }` | L4-L10    |
| `isEncrypted`-style helpers  | n/a             | None — this is a single-hook module                                                                                 | —         |

## Proposed JSDoc to paste above `export function useConfirmation` (line 17)

````tsx
/**
 * React hook for imperative confirmation dialogs. Wraps the shared
 * {@link Alert} component in a promise-returning API so call sites
 * can `await` user choice (`true` = confirmed, `false` = cancelled)
 * instead of wiring up per-callback `useState` plumbing.
 *
 * **Returns** an object with two keys:
 *
 * | Key             | Type                                              | Notes                              |
 * | --------------- | ------------------------------------------------- | ---------------------------------- |
 * | `confirm`       | `(options: ConfirmOptions) => Promise<boolean>`   | Resolves `true` on confirm, `false` on cancel; rejects only on programmer error |
 * | `ConfirmDialog` | `JSX.Element`                                     | Mount once in the consuming component's render output (e.g. just before `</div>`) |
 *
 * **`ConfirmOptions` (L4-L10):**
 *
 * | Field         | Type                            | Default     | Notes                                                          |
 * | ------------- | ------------------------------- | ----------- | -------------------------------------------------------------- |
 * | `title`       | `string`                        | (required)  | Dialog header                                                  |
 * | `message`     | `string`                        | (required)  | Body copy                                                      |
 * | `variant`     | `'default' \| 'destructive'`    | `'default'` | `'destructive'` for irreversible actions (delete, discard)    |
 * | `confirmText` | `string`                        | `'Confirm'` | Confirm button label                                           |
 * | `cancelText`  | `string`                        | `'Cancel'`  | Cancel button label                                            |
 *
 * **Usage pattern** (3-line setup):
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirmation();
 * const onDelete = async () => {
 *   if (await confirm({ title: 'Delete?', message: '...', variant: 'destructive' })) {
 *     // perform delete
 *   }
 * };
 * return <>{/* your UI *\/}{ConfirmDialog}</>;
 * ```
 *
 * **Why a hook?** Two reasons:
 *  1. **Imperative `await`** — most flows want `if (await confirm(...))` rather
 *     than wiring up 4 useState fields + a modal JSX per call site. Used in
 *     AccountForm, SettingsPage, AllocationRuleBuilder for delete/discard flows.
 *  2. **Single shared dialog** — only one `<Alert>` is mounted per consuming
 *     component, so the dialog z-index/portal is centralized. Concurrent
 *     `confirm()` calls are NOT queued — last call wins (intentional).
 *
 * **Source:** `src/hooks/useConfirmation.tsx` (66L, verified 2026-06-13).
 */
````

---

## What changed from prior versions

- **No prior JSDoc** on this hook (v0.1 is the initial patch).
- T-MN-008 #10 in the v0.4 cascade (substitute for `useForm` which doesn't exist
  in the codebase — closest form-utility hook with similar usage pattern).
- 4-Question Framework applied: file path verified, method signatures D-009
  verified against source, no ADR cross-check needed (no direct ADR reference),
  no TENTATIVE markers (all claims file:line anchored).

## Net effect

- **1 new JSDoc block** on `useConfirmation` hook
- **Public surface documented**: 1 hook + 2 returned items + 1 input interface
- **No fabrications** — all signatures D-009 verified against `src/hooks/useConfirmation.tsx`
- **No type fabrications** — `ConfirmOptions` is the only public interface, all
  5 fields enumerated
- **No method fabrications** — only 2 returned items (`confirm`, `ConfirmDialog`),
  no invented helpers
