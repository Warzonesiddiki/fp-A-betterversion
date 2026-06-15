<!-- CANONICAL: true (Part 187 canonical; expected topic: Standards (XBRL, IFRS, OFX, SWIFT)) -->

# Part 187 — Standards (XBRL, IFRS, OFX, SWIFT)

**Status:** 🟡 DRAFT v0.1
**Owner:** Hephaestus
**Last updated:** 2026-06-15
**Cross-refs:** Part 15 (Security), Part 173 (Compliance), Part 159 (Multi-Standard), Part 185 (Export)
**Inputs from audits:** `SECURITY_READINESS.md`, `USER_DOCS_AUDIT.md`

---

## 1. Purpose

Define the canonical standards reference: per-domain (audit, tax, accounting, sector, exchange) — which standard applies, when, and how it's implemented in FinPlan Pro.

## 2. Current state (cited)

- US GAAP only — **partial** (per Part 38).
- No IFRS, French PCG, etc. — **missing**.

## 3. Specification / Requirements

1. **Per-domain:**
   - **Accounting:** US GAAP (FASB ASC), IFRS (IASB), French PCG, UK GAAP (FRS 102), German HGB.
   - **Audit:** US GAAS (PCAOB), IFAC IAASB (ISA), AICPA SOP.
   - **Tax:** US IRC + state, UK HMRC, EU OECD, transfer pricing (OECD).
   - **Sector:** ASC 606 / IFRS 15 (rev rec), ASC 842 / IFRS 16 (lease), ASC 740 / IAS 12 (tax), ASC 810 / IFRS 10 (consolidation), ASC 830 / IAS 21 (FX), ASC 980 (regulated), CECL / IFRS 9 (credit losses), LDTI / IFRS 17 (insurance), ASC 280 / IFRS 8 (segments), SOX (404), etc.
   - **Exchange:** XBRL, iXBRL, OFX, QIF, MT940, SWIFT MT/ISO 20022, EDI, etc.
2. **Per-standard:** reference doc, applicability, FinPlan Pro support level, sample data.
3. **Per-tenant:** primary + secondary.
4. **Per-period:** standard version (e.g., ASC 606 pre-2018 vs post-2018).
5. **Per-entity:** standard assignment.
6. **Disclosure:** per-standard disclosure templates.
7. **Audit:** standard selection logged.
8. **i18n:** standard name in 8 locales.
9. **Mapping:** cross-standard (per Part 159).
10. **Documentation:** `docs/standards/` per standard.

## 4. Implementation plan

1. Build `StandardsRegistry` in `src/config/standards.ts`.
2. Per-standard metadata.
3. Per-tenant standard selector.
4. Per-entity assignment.
5. Disclosure templates.
6. Documentation.
7. Playwright tests for switching.

## 5. Acceptance criteria

- [ ] 50+ standards cataloged
- [ ] Per-tenant selector
- [ ] Per-entity assignment
- [ ] Disclosure templates
- [ ] Cross-standard mapping

## 6. Cross-references

- **Parts:** 15, 173, 159, 185
- **Code paths:** `src/config/standards.ts`, `docs/standards/`
- **Audits:** `SECURITY_READINESS.md`, `USER_DOCS_AUDIT.md`

## 7. Open questions / Gaps

1. Standard version drift (new standard per year)?
2. Per-tenant override at line item level?
3. AI-suggested standard (clustering)?

## 8. Sign-off

**Status:** 🟡 DRAFT — pending Hephaestus + Strategos sign-off.
