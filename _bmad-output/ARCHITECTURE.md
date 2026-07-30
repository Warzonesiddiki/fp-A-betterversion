# FinPlan Pro — Architecture Document (BMAD Phase 3)

> **Version:** 1.0 | **Date:** 2026-07-30 | **Method:** BMAD (Breakthrough Method for Agile AI-Driven Development)
> **Status:** Active — Driving continuous improvement loop

---

## 1. System Architecture

```
FinPlan Pro.exe (self-contained Windows 11 desktop application)
├── Tauri v2 (Rust) — native shell, filesystem, SQLite, secure storage
├── React 19 + TypeScript 5.9 — compiled frontend, embedded in binary
├── Zustand 5 + SQLite — ACID-compliant state persistence
├── 190 Financial Engines — pure TypeScript, no UI dependencies
├── AG Grid Community — Excel-like data editing
├── Recharts — client-side SVG charting
├── Vite 8 — build toolchain
└── NSIS installer — Windows distribution
```

## 2. Critical Invariants (Non-Negotiable)

| #      | Invariant                                                        | Enforcement                                     |
| ------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| INV-1  | Money uses decimal.js primitive (not IEEE-754 float)             | `money:adoption` script, ratchet gate           |
| INV-2  | Server-side authorization enforced on all routes                 | `architecture:guardrails` script                |
| INV-3  | Period close is a state machine (open→soft→hard→locked)          | `PeriodCloseStateMachine` + server `periods.ts` |
| INV-4  | Audit trail is persisted and tamper-evident (SHA-256 hash chain) | `auditTrailStore.ts`                            |
| INV-5  | Backup captures all user data (36 persisted stores)              | `backupRestore.ts` + `architecture:guardrails`  |
| INV-6  | CI gates are blocking (lint, type, test, A11y, server)           | `.github/workflows/ci.yml`                      |
| INV-7  | Storage failures resolve fail-closed (never silent null)         | `masterStorage.ts`                              |
| INV-8  | CSV export prevents injection attacks                            | `export.ts` + `export:verify`                   |
| INV-9  | GitHub Actions use SHA-pinned references                         | `ci.yml`                                        |
| INV-10 | Fiscal calendar uses Decimal for period allocation               | `FiscalCalendarEngine.ts`                       |

## 3. Engine Architecture

### 3.1 Money-Primitive Adoption (10/355 modules = 2.82%)

**Migrated (using `@/utils/money`):**

- AllocationEngine, ConsolidationEngine, FXEngine, FiscalCalendarEngine
- PeriodCloseStateMachine, ReconciliationEngine, SignConventionEngine
- ThreeStatementEngine, WorkingCapitalEngine, glStore

**Priority Migration Targets (high financial impact):**

- ValidationEngine (4 toFixed sites, arithmetic)
- DepreciationEngine (10 arithmetic ops)
- TaxEngine (10 arithmetic ops)
- LeaseEngine (14 arithmetic ops)
- CashEngine (1 arithmetic op)
- DebtScheduleEngine (3 arithmetic ops)
- ScenarioEngine (9 arithmetic ops)

### 3.2 Orphan Engine Status (7 identified)

Engines with zero consumers in the codebase. These are candidates for
either integration or removal to reduce maintenance burden.

## 4. Server Architecture

```
server/
├── src/routes/
│   ├── auth.ts        — JWT authentication
│   ├── periods.ts     — Period close state machine (close_state column)
│   ├── audit.ts       — Entity-scoped audit trail
│   └── export.ts      — Entity-scoped + CSV injection protection
├── src/middleware/
│   ├── auth.ts        — JWT verification
│   └── entityAuth.ts  — Entity access control
├── src/db/
│   ├── connection.ts  — Mock DB (close_state support)
│   └── migrate.ts     — Schema migrations
└── 38/38 tests passing
```

## 5. Data Flow

```
User Input → AG Grid → Zustand Store → Engine Calculation
                ↓                           ↓
            AutoSave              decimal.js (money primitive)
                ↓                           ↓
          masterStorage              SHA-256 audit trail
                ↓                           ↓
          Tauri SQLite              hash-chained auditTrailStore
                ↓
          Backup/Restore (SHA-256 checksum)
```

## 6. Security Architecture

| Layer            | Protection             | Status           |
| ---------------- | ---------------------- | ---------------- |
| Transport        | HTTPS (Tauri)          | ✅               |
| Authentication   | JWT                    | ✅               |
| Authorization    | Entity-scoped routes   | ✅               |
| Input Validation | Server-side validation | ✅               |
| CSV Injection    | Prefix dangerous chars | ✅               |
| Secure Storage   | Tauri keyring + AES    | ⚠️ F-0006 bypass |
| Audit Trail      | SHA-256 hash chain     | ✅               |
| Backup Integrity | SHA-256 checksum       | ✅               |
| CI Supply Chain  | SHA-pinned actions     | ✅               |

## 7. Open Issues (KILL List)

| ID        | Severity | Description                                          | Status                   |
| --------- | -------- | ---------------------------------------------------- | ------------------------ |
| F-0006    | CRITICAL | Tauri secure_storage bypass (any non-empty password) | OPEN (needs Rust)        |
| KILL-006  | HIGH     | 7 orphan engines                                     | OPEN                     |
| KILL-009  | HIGH     | E2E not reproducible                                 | BLOCKED (no browser)     |
| F-0017    | MEDIUM   | No OpenAPI/API contract spec                         | OPEN                     |
| KILLX-003 | MEDIUM   | No actionlint in CI                                  | OPEN                     |
| KILLX-004 | MEDIUM   | No coverage gate                                     | OPEN                     |
| KILLX-005 | MEDIUM   | No threat model document                             | OPEN                     |
| KILLX-006 | MEDIUM   | No error taxonomy                                    | OPEN                     |
| KILLX-007 | MEDIUM   | No observability/SLI/SLO                             | OPEN                     |
| KILLX-008 | MEDIUM   | No fiscal calendar model in UI                       | OPEN                     |
| KILLX-010 | LOW      | No cargo audit in CI                                 | OPEN (no Rust toolchain) |

## 8. Verification Commands

```bash
npm ci                          # Clean install (0 vulns)
npx tsc --noEmit                # Zero TypeScript errors
npm run money:adoption          # Money primitive ratchet (10 modules, 100 toFixed)
npm run engines:verify          # 180 engines in manifest
npm run docs:verify             # All README claims match
npm run export:verify           # Export security + fidelity
npm run architecture:guardrails # 21/21 invariants
npm run compliance:evidence     # 22/22 checks
npm audit --omit=dev            # 0 production vulns
cd server && npm test           # 38/38 server tests
```
