# FinPlan Pro — BMAD Improvement Epics & Stories

> **Version:** 1.0 | **Date:** 2026-07-30
> **Method:** BMAD (Breakthrough Method for Agile AI-Driven Development)
> **Sprint:** Continuous Improvement Loop 5-20

---

## Epic 1: Money Primitive Expansion (MEDIUM-HIGH)

**Goal:** Increase money primitive adoption from 10/355 (2.82%) to 20+ modules.
**Invariant:** INV-1 (decimal.js for all financial calculations)

### Story 1.1: Migrate ValidationEngine to money primitive

- **Acceptance:** 0 toFixed sites, uses toDecimal for all financial arithmetic
- **Tests:** Existing tests pass, new money verification test added

### Story 1.2: Migrate DepreciationEngine to money primitive

- **Acceptance:** SLN, SYD, DDB calculations use Decimal, no toFixed
- **Tests:** Depreciation formulas produce exact results

### Story 1.3: Migrate TaxEngine to money primitive

- **Acceptance:** Tax calculations use Decimal, no toFixed
- **Tests:** Tax bracket calculations exact

### Story 1.4: Migrate LeaseEngine to money primitive

- **Acceptance:** Lease amortization uses Decimal, no toFixed
- **Tests:** IFRS 16 lease calculations exact

### Story 1.5: Migrate CashEngine to money primitive

- **Acceptance:** Cash flow calculations use Decimal
- **Tests:** Cash projection exact

### Story 1.6: Migrate DebtScheduleEngine to money primitive

- **Acceptance:** Amortization schedule uses Decimal
- **Tests:** EMI calculations exact

### Story 1.7: Migrate ScenarioEngine to money primitive

- **Acceptance:** Scenario arithmetic uses Decimal
- **Tests:** Scenario comparison exact

---

## Epic 2: API Contract & Documentation (MEDIUM)

**Goal:** Formalize API contracts and create missing documentation.

### Story 2.1: Create OpenAPI 3.1 specification

- **Acceptance:** All server routes documented with request/response schemas
- **Tests:** OpenAPI spec validates with spectral

### Story 2.2: Create threat model document

- **Acceptance:** STRIDE analysis, attack surface mapping, mitigations
- **Tests:** Threat model covers all F-xxxx findings

### Story 2.3: Create error taxonomy

- **Acceptance:** Error codes, severity levels, response patterns documented
- **Tests:** Every engine error maps to a taxonomy code

---

## Epic 3: CI Hardening (MEDIUM)

**Goal:** Make CI gates more comprehensive and reliable.

### Story 3.1: Add actionlint to CI

- **Acceptance:** GitHub Actions workflow validated by actionlint
- **Tests:** Intentional workflow error caught by actionlint

### Story 3.2: Add coverage gate

- **Acceptance:** Coverage threshold enforced in CI
- **Tests:** Below-threshold PR fails

### Story 3.3: Wire architecture:guardrails as blocking CI gate

- **Acceptance:** Architecture guardrails run in CI as blocking job
- **Tests:** Guardrail failure blocks merge

---

## Epic 4: Orphan Engine Resolution (MEDIUM)

**Goal:** Integrate or remove orphan engines.

### Story 4.1: Identify and document all orphan engines

- **Acceptance:** Each orphan has a disposition (integrate/remove)
- **Tests:** Orphan list matches docs:verify output

### Story 4.2: Integrate or remove orphans

- **Acceptance:** Zero orphan engines remain
- **Tests:** docs:verify shows 0 orphans

---

## Epic 5: Tauri Security (HIGH)

**Goal:** Fix F-0006 (secure_storage bypass).

### Story 5.1: Fix secure_storage unlock bypass

- **Acceptance:** Wrong password does NOT unlock vault
- **Tests:** Attempt with wrong password returns error
- **Blocker:** Requires Rust toolchain in CI

---

## Epic 6: Observability & Resilience (MEDIUM)

**Goal:** Define SLIs/SLOs and error handling patterns.

### Story 6.1: Create observability framework

- **Acceptance:** SLI/SLO definitions for key operations
- **Tests:** Metrics collected for engine calculations

### Story 6.2: Create error boundary for engines

- **Acceptance:** Engine errors are caught, logged, and surfaced to user
- **Tests:** Engine error produces user-friendly message
