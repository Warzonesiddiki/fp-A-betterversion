<!-- CANONICAL: true (Part 183 canonical; expected topic: Lineage (Every Number)) -->

# Part 183 — Lineage (Every Number)

**Status:** 🟡 DRAFT v0.1
**Owner:** Hephaestus
**Last updated:** 2026-06-15
**Cross-refs:** Part 28 (Drill), Part 117 (Audit Trail), Part 140 (Cell Versioning), Part 184 (Conflict)
**Inputs from audits:** `SECURITY_READINESS.md` (no lineage), `PERSONA_COVERAGE.md` P8 8.1

---

## 1. Purpose

Define the data lineage: visualization of calculation tree from raw input → formula → aggregation → displayed value. Anchors P8 Imani JTBD-8.1 and SOX controls.

## 2. Current state (cited)

- `src/engines/CellAuditTrailEngine.ts` — **partial**.
- No lineage viewer UI — **missing** (per Part 28).

## 3. Specification / Requirements

1. **Per-cell lineage:** tree from source data → formula → cell.
2. **Visualization:** DAG; node per step; edge per transformation.
3. **Per-step:** source (table, row, period), formula, version, who, when.
4. **Per-cell click:** "Show lineage" → DAG.
5. **Zoom + pan:** large DAGs.
6. **Filter:** by step type (formula, source, etc.).
7. **Search:** by source ID, by formula.
8. **Export:** PNG, SVG, PDF.
9. **Performance:** 1K-node DAG in < 1s.
10. **Audit:** every lineage view logged.

## 4. Implementation plan

1. Build `LineageEngine` in `src/engines/lineage.ts`.
2. Build DAG builder from CellAuditTrail (Part 117).
3. Build `LineageViewer` component (D3 or react-flow).
4. Wire to right-click "Show lineage".
5. Add export.
6. Add audit logging.
7. Playwright tests for round-trip.

## 5. Acceptance criteria

- [ ] DAG visualization
- [ ] 1K-node < 1s
- [ ] Per-step details
- [ ] Export to PNG/SVG/PDF
- [ ] Audit logged

## 6. Cross-references

- **Parts:** 28, 117, 140, 184
- **Code paths:** `src/engines/lineage.ts`, `src/components/ui/LineageViewer.tsx`
- **Audits:** `SECURITY_READINESS.md`, `PERSONA_COVERAGE.md`

## 7. Open questions / Gaps

1. Cross-model lineage (model A → model B)?
2. Cross-engine lineage?
3. AI-summarized lineage?

## 8. Sign-off

**Status:** 🟡 DRAFT — pending Hephaestus + Strategos sign-off.
