<!-- CANONICAL: true (Part 171 canonical; expected topic: Responsive (Every Resolution)) -->

# Part 171 — Responsive (Every Resolution)

**Status:** 🟡 DRAFT v0.1
**Owner:** Hera
**Last updated:** 2026-06-15
**Cross-refs:** Part 11 (Screens), Part 49 (A11y), Part 13 (Components), Part 8 (UX)
**Inputs from audits:** `UX_COMPLETENESS.md` (mobile gap)

---

## 1. Purpose

Define the responsive experience: tablet (768px+), phone (<768px), touch targets, gestures, and per-page mobile variant. Anchors "use on the go".

## 2. Current state (cited)

- No mobile-specific layout — **missing** (per Part 8 §7).
- 192 pages are desktop-first — **partial**.

## 3. Specification / Requirements

1. **Breakpoints:** xs (<640), sm (640-768), md (768-1024), lg (1024-1280), xl (1280-1536), 2xl (>1536).
2. **Mobile-first:** design for phone, scale up to desktop.
3. **Touch targets:** ≥ 44px × 44px (per Part 49).
4. **Gestures:** swipe (back, refresh), pinch (zoom), tap, long-press.
5. **Per-page mobile variant:** read-only on phone, full on tablet+.
6. **Navigation:** bottom tab bar on phone; sidebar on tablet+; top nav on all.
7. **Forms:** full-width inputs; larger tap targets; native keyboards.
8. **Tables:** horizontal scroll; freeze first column; condensed view.
9. **Charts:** responsive (always); tap to expand; share.
10. **Performance:** mobile first paint < 1s on 4G.

## 4. Implementation plan

1. Define breakpoints in `tailwind.config.ts`.
2. Audit 192 pages for mobile parity.
3. Build phone-specific layout (read-only).
4. Build bottom tab bar.
5. Build touch-friendly forms.
6. Build responsive table view.
7. Build responsive chart view.
8. Playwright tests for mobile viewports.

## 5. Acceptance criteria

- [ ] All 192 pages render on mobile
- [ ] Touch targets ≥ 44px
- [ ] Bottom tab bar on phone
- [ ] Forms touch-friendly
- [ ] Tables horizontal scroll

## 6. Cross-references

- **Parts:** 11, 49, 13
- **Code paths:** `tailwind.config.ts`, `src/components/shells/`
- **Audits:** `UX_COMPLETENESS.md`

## 7. Open questions / Gaps

1. PWA install on mobile?
2. Native iOS/Android (Tauri)?
3. Offline-first on mobile?

## 8. Sign-off

**Status:** 🟡 DRAFT — pending Hera + Strategos sign-off.
