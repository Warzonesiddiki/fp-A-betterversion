<!-- CANONICAL: true (Part 161 canonical; expected topic: Print (Every Scenario)) -->

# Part 161 — Print (Every Scenario)

**Status:** 🟡 DRAFT v0.1
**Owner:** Hera
**Last updated:** 2026-06-15
**Cross-refs:** Part 110 (Print/PDF), Part 64 (Charts), Part 49 (A11y)
**Inputs from audits:** `UX_COMPLETENESS.md` (no print CSS)

---

## 1. Purpose

Define the print and PDF CSS: `@media print` rules, page breaks, header/footer, page numbers, chart rendering. Anchors "Cmd+P works" and the board pack PDF (Part 110).

## 2. Current state (cited)

- No `@media print` rules — **missing** (per `UX_COMPLETENESS.md`).
- PDF via `pdf.ts` (Part 110) — **partial**.

## 3. Specification / Requirements

1. **`@media print`:**
   - Hide nav, toaster, modal overlays, comments UI, dev tools.
   - Show only main content + print header/footer.
   - Color → grayscale where appropriate (Part 154).
   - Body { font: 10pt; line-height: 1.4; }
2. **Page breaks:** `page-break-inside: avoid` on cards, tables, charts.
3. **Header:** title, subtitle, page X of Y, date, logo.
4. **Footer:** confidential notice, page number, doc hash.
5. **Page size:** A4 (default); Letter (US); configurable.
6. **Page margins:** 15mm; consistent.
7. **Charts:** preserve; `print-color-adjust: exact`.
8. **Tables:** repeat header row on each page.
9. **Hyperlinks:** show URL after link text.
10. **Page break before:** H1, H2; or per-component flag.

## 4. Implementation plan

1. Build `print.css` with @media print rules.
2. Add page break classes.
3. Add print header/footer component.
4. Add chart print rules.
5. Add table header repeat.
6. Add `Cmd+P` shortcut to print preview.
7. Playwright test for print round-trip.

## 5. Acceptance criteria

- [ ] `@media print` rules
- [ ] Page breaks work
- [ ] Header + footer
- [ ] Charts preserved
- [ ] `Cmd+P` works

## 6. Cross-references

- **Parts:** 110, 64, 49
- **Code paths:** `src/index.css` (print rules), `src/services/pdf.ts`
- **Audits:** `UX_COMPLETENESS.md`

## 7. Open questions / Gaps

1. Per-tenant print header (logo, address)?
2. Page-break per persona?
3. Per-sector print template?

## 8. Sign-off

**Status:** 🟡 DRAFT — pending Hera + Strategos sign-off.
