# FinPlan Pro — Data Validation & Sanitization Audit Report

**Audited:** `C:\Users\Tahir\Desktop\frontend that i want\fp&A`
**Date:** 2026-06-08
**Auditor:** Data Validation Specialist Agent
**Severity Scale:** CRITICAL | HIGH | MEDIUM | LOW | PASS

---

## Executive Summary

| Area | Status | Critical Findings |
|------|--------|-------------------|
| Zod schema strictness | HIGH | No `.strict()` — unknown keys pass through; `z.number()` allows Infinity |
| Financial input parsing | MEDIUM | `parseFinancialInput` passes Infinity through; `formatPercent(Infinity)` renders "Infinity%" |
| CSV/Excel import validation | MEDIUM | Numeric check allows Infinity; Excel import advertised but unimplemented |
| React Hook Form usage | PASS | No RHF used; custom Zod+state with full ARIA error display |
| SQL injection protection | HIGH (structural) | Dynamic UPDATE field names from Zod — low risk today, fragile pattern |
| SQL schema CHECK constraints | CRITICAL | No positive-value CHECK constraints on ANY financial amount column |

---

## 1. Zod Schema Definitions

### 1.1 Server-Side Schemas

Files audited:
- server/src/middleware/validate.ts
- server/src/routes/auth.ts, budgets.ts, gl.ts, forecasts.ts, scenarios.ts, reports.ts, entities.ts

#### PASS — Validation middleware correctly uses safeParse()

```typescript
// validate.ts
const result = schema.safeParse(req.body);
if (!result.success) {
  res.status(400).json({ error: 'Validation failed', details: formatZodErrors(result.error) });
  return;
}
req.validated = result.data;
```

All routes call safeParse before any DB write. 400 is returned with structured field errors.

#### HIGH — No .strict() on any schema — unknown keys silently stripped

All schemas use plain `z.object({...})` (Zod default = strip mode).
Unknown keys are dropped from parsed.data, so no direct injection risk today.
But there is NO compiler-level enforcement that future schema additions are intentional.

Fix: Add `.strict()` to all server Zod schemas:
```typescript
const CreateBudgetSchema = z.object({ ... }).strict();
```

#### HIGH — amount fields accept Infinity (z.number() does not reject it)

```typescript
// budgets.ts line 32
amount: z.number(),            // allows Infinity, -Infinity

// gl.ts
debit: z.number().min(0),     // PASS: guarded against negative
credit: z.number().min(0),    // PASS: guarded against negative
amount: z.number(),            // FAIL: no .finite()

// forecasts.ts line 40
amount: z.number(),            // FAIL

// scenarios.ts lines 33-34
base_amount: z.number(),       // FAIL
adjusted_amount: z.number(),   // FAIL
adjustment_pct: z.number().optional(), // FAIL — no range check
```

Zod v3: `z.number()` rejects NaN but DOES NOT reject Infinity or -Infinity.
A client can POST `{"amount": 1e308}` and it passes validation.

Fix: `amount: z.number().finite()` — and `.min(0)` where negatives make no business sense.

#### PASS — Auth schemas are well-constrained

```typescript
email: z.string().email()
password: z.string().min(8)
firstName: z.string().min(1).max(100)
```

bcrypt salt=10, password never stored plain, sanitizeUser() strips password_hash from responses.

### 1.2 Client-Side Schemas

#### PASS — LoginPage uses Zod + useState with proper ARIA error display

```typescript
const loginSchema = z.object({
  email: z.string().min(1).email('Invalid email address.'),
  password: z.string().min(6),
});
```

- aria-invalid={!!fieldErrors.email} on inputs
- aria-describedby linking to error <p> elements
- Submit blocked when validate() returns false
- Global auth error shown with role="alert"

No React Hook Form is used anywhere in the codebase.

---

## 2. Financial Input Parsing

### parseFinancialInput (src/utils/financialFormatting.ts lines 91-108)

| Check | Status | Detail |
|-------|--------|--------|
| NaN guard | PASS | `if (isNaN(num)) return null` |
| Empty / dash | PASS | Returns null |
| Currency symbols | PASS | $, EUR, GBP, JPY, comma stripped |
| Infinity guard | MEDIUM FAIL | `parseFloat("Infinity")` = Infinity; `isNaN(Infinity)` = false — passes through |
| compactMatch NaN | LOW FAIL | `parseFloat(compactMatch[1])` not null-checked before multiply |

Fix:
```typescript
const num = parseFloat(cleaned);
if (isNaN(num) || !isFinite(num)) return null;
```

### formatPercent — renders "Infinity%" for Infinity input

```typescript
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;  // Infinity.toFixed() = "Infinity"
}
```

Fix: `if (value == null || !isFinite(value)) return '—';`

### PASS — src/utils/validation.ts has exemplary guards

```typescript
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value); // blocks NaN AND Infinity
}
```

validateFinancialNumber(), validatePercentage(), validateOwnershipPercentage() all use isFiniteNumber.
These are NOT wired into the server-side Zod schemas — missed opportunity.

---

## 3. CSV/Excel Import Validation

### PASS — Import is gated on validation result

```typescript
// FileUploader.tsx line 67
const handleConfirm = useCallback(() => {
  if (result && result.valid && onImport) {  // only imports when valid
    onImport(result.preview, result.columns);
  }
}, [result, snapshot, onImport]);

// Line 180 — button disabled when errors exist
<Button onClick={handleConfirm} disabled={hasErrors}>
  {hasErrors ? 'Fix Errors to Continue' : 'Confirm & Import'}
</Button>
```

### MEDIUM FAIL — Numeric validation allows Infinity in CSV cells

```typescript
// ImportEngine.ts line 212
if (val && val !== '' && isNaN(Number(val))) {
  errors.push({ message: `Non-numeric value "${val}"` });
}
```

`Number("Infinity")` = Infinity; `isNaN(Infinity)` = false.
A CSV with cell value "Infinity" or "1e308" passes numeric validation.

Fix:
```typescript
const numVal = Number(val);
if (val && val !== '' && (isNaN(numVal) || !isFinite(numVal))) {
  errors.push({ ... });
}
```

### CRITICAL — Excel import is UI-advertised but silently unimplemented

FileDropZone accepts .xlsx/.xls but ImportEngine returns an error stub:
```typescript
case 'excel':
  return { result: { valid: false, errors: [{ message: 'Excel import requires the ExcelJS library...' }] } };
```

Fix: Either implement ExcelJS parsing or remove .xlsx/.xls from the accept attribute.

### MEDIUM FAIL — No domain-level validation of imported rows

Validated: column presence, numeric format, date format, row count.
NOT validated: account code existence, entity reference validity, amount ranges, fiscal period validity.
The calling component receives raw strings and is solely responsible for domain validation.

---

## 4. React Hook Form / Form Error States

React Hook Form is NOT used. Custom Zod+useState pattern is used consistently.

| Form | Error Display | Submission Block | ARIA |
|------|--------------|-----------------|------|
| Login | PASS | PASS | PASS |
| Register | (not audited) | — | — |
| Forgot Password | FAIL | N/A | FAIL |

### MEDIUM FAIL — Forgot password email not validated

```typescript
const handleForgotPassword = () => {
  if (!forgotEmail) return;   // only non-empty check, no email format validation
  setForgotSent(true);
};
```

"notanemail" passes. No error state shown for invalid format.

---

## 5. SQL Injection Protection

### PASS — All WHERE/INSERT/DELETE use parameterized ? placeholders

```typescript
db.prepare('SELECT * FROM users WHERE email = ?').get(email)
db.prepare('INSERT INTO users (...) VALUES (?, ?, ?, ?, ?)').run(...)
db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken)
```

Zero instances of user-controlled string interpolation into SQL WHERE clauses.

### HIGH (structural) — Dynamic UPDATE field names from Zod keys are interpolated

Pattern used in ALL 6 route files (budgets, gl, entities, forecasts, scenarios, reports):

```typescript
for (const [key, value] of Object.entries(parsed.data)) {
  if (value !== undefined) {
    fields.push(`${key} = ?`);   // key is interpolated into SQL
    values.push(value);
  }
}
db.prepare(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
```

Current risk: LOW — parsed.data only contains Zod-schema-defined keys (unknown keys stripped).
Structural risk: MEDIUM — if a developer ever adds a field with SQL-significant characters to a schema, it would inject directly.

Fix: Add explicit field allowlists per resource:
```typescript
const BUDGET_UPDATE_FIELDS = new Set(['name', 'description', 'fiscal_year', 'base_currency', 'entity_id', 'status']);
for (const [key, value] of Object.entries(parsed.data)) {
  if (value !== undefined && BUDGET_UPDATE_FIELDS.has(key)) { ... }
}
```

### PASS — better-sqlite3 with foreign key enforcement and WAL mode

```typescript
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

---

## 6. SQL Schema CHECK Constraints

File: src-tauri/migrations/001_initial_schema.sql

### PASS — Enumeration columns are constrained

```sql
status TEXT CHECK (status IN ('Draft', 'InReview', 'Approved', 'Locked', 'Rejected'))
type TEXT CHECK (type IN ('Revenue', 'COGS', 'OpEx', 'CapEx', 'Asset', 'Liability', 'Equity'))
month INTEGER CHECK (month BETWEEN 1 AND 12)
scenario_type TEXT CHECK (scenario_type IN ('base', 'optimistic', 'pessimistic', 'custom', 'stress_test'))
```

### CRITICAL — No CHECK constraints on ANY financial amount column

| Table | Column | Risk |
|-------|--------|------|
| gl_entries | amount REAL NOT NULL | No CHECK — Infinity storable |
| gl_entries | debit REAL DEFAULT 0 | No CHECK (debit >= 0) |
| gl_entries | credit REAL DEFAULT 0 | No CHECK (credit >= 0) |
| budget_line_items | amount REAL NOT NULL DEFAULT 0 | No range constraint |
| forecast_line_items | amount REAL NOT NULL DEFAULT 0 | No constraint |
| scenario_line_items | amount REAL NOT NULL DEFAULT 0 | No constraint |
| scenario_line_items | adjustment_pct REAL DEFAULT 0 | No BETWEEN -100 AND 100 |
| entities | ownership_pct REAL DEFAULT 100.0 | No BETWEEN 0 AND 100 |
| currency_rates | rate REAL NOT NULL | No CHECK (rate > 0) |

SQLite stores IEEE 754 floats — Infinity and -Infinity are valid float values that will be stored and corrupt SUM/AVG aggregations silently.

---

## 7. Additional Findings

### MEDIUM — LoginPage loads localStorage email without re-validation

```typescript
useEffect(() => {
  const remembered = localStorage.getItem('finplan_remembered_email');
  if (remembered) {
    setEmail(remembered);   // no format check — XSS / extension attack vector
  }
}, []);
```

Fix: Validate via `z.string().email().safeParse(remembered)` before setting state.

### MEDIUM — FileUploader.tsx line 112 duplicate role="alert" attribute

```tsx
<div className="..." role="alert"  role="alert">
```
Duplicate HTML attribute — invalid markup. Remove one.

### PASS — bcrypt password hashing (salt=10), never stored plain

### PASS — Refresh token rotation with UUID tokens stored in DB with expiry

### PASS — Account lockout middleware on login route (brute force protection)

---

## Prioritized Remediation Checklist

### CRITICAL (Fix Immediately)

- [ ] C1: Add CHECK (debit >= 0), CHECK (credit >= 0) to gl_entries table
- [ ] C2: Add CHECK (rate > 0) to currency_rates table
- [ ] C3: Add CHECK (ownership_pct BETWEEN 0 AND 100) to entities table
- [ ] C4: Either implement ExcelJS parsing or remove .xlsx/.xls from FileDropZone accept

### HIGH (Fix This Sprint)

- [ ] H1: Add .finite() to ALL z.number() amount fields in server schemas (budgets, gl, forecasts, scenarios)
- [ ] H2: Add explicit field allowlists for dynamic UPDATE SQL construction
- [ ] H3: Add .strict() to all server-side Zod schemas

### MEDIUM (Fix Next Sprint)

- [ ] M1: Fix parseFinancialInput — add !isFinite(num) guard alongside isNaN check
- [ ] M2: Fix formatPercent — add isFinite guard before .toFixed()
- [ ] M3: Fix CSV numeric validation — add !isFinite(numVal) check in ImportEngine
- [ ] M4: Add email format validation to forgot-password handler
- [ ] M5: Validate localStorage email on load via Zod before setting state
- [ ] M6: Fix duplicate role="alert" in FileUploader.tsx line 112
- [ ] M7: Add CHECK (adjustment_pct BETWEEN -1000 AND 1000) to scenario_line_items

### LOW (Backlog)

- [ ] L1: Add domain-level validation (account existence, period validity) in CSV import pipeline
- [ ] L2: Add reasonable range constraints to budget amounts in schema
- [ ] L3: Consider migrating to React Hook Form + zodResolver for consistent DX

---

## Files Audited (16 files, ~4,300 lines)

| File | Lines | Status |
|------|-------|--------|
| server/src/middleware/validate.ts | 44 | PASS |
| server/src/routes/auth.ts | 308 | PASS |
| server/src/routes/budgets.ts | 513 | HIGH — z.number() no .finite() |
| server/src/routes/gl.ts | 438 | HIGH — amount not finite |
| server/src/routes/forecasts.ts | 388 | HIGH — same pattern |
| server/src/routes/scenarios.ts | 488 | HIGH — same pattern |
| server/src/routes/reports.ts | 310 | PASS — no financial numbers |
| server/src/routes/entities.ts | 350 | PASS |
| server/src/db/migrate.ts | 93 | PASS |
| server/src/db/connection.ts | 26 | PASS — WAL + FK enforcement |
| src-tauri/migrations/001_initial_schema.sql | 503 | CRITICAL — no amount constraints |
| src/engines/ImportEngine.ts | 637 | MEDIUM — Infinity gap; Excel stub |
| src/utils/validation.ts | 515 | PASS — excellent isFiniteNumber guards |
| src/utils/financialFormatting.ts | 120 | MEDIUM — Infinity in parseFinancialInput |
| src/components/data/FileUploader.tsx | 226 | MEDIUM — JSX bug; gating correct |
| src/pages/auth/LoginPage.tsx | 303 | MEDIUM — forgot-pw no email validation |
