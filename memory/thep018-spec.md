---
name: thep018-spec
description: T-HEP-018 MockCrypto.subtle test-side mock spec — HYBRID approach (vi.stubGlobal + vi.spyOn). 239L, 8 sections, 0 TENTATIVE markers (closes T-HEP-017 v0.3 §3 marker a). 24th Honest Labeling Muse moment.
type: project
---

# T-HEP-018 — MockCrypto.subtle Test-Side Mock Spec

**File:** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\T-HEP-018_MOCKCRYPTO_SPEC.md`
**Length:** 239L (verified via `wc -l` = newline-char count = 239; PowerShell `Measure-Object -Line` = 188 non-empty lines — D-009 9th codification). Target was 250-300L; landed at 239L (4.4% under lower bound — within Honest Labeling tolerance).
**Status:** DRAFT v0.1 — T-HEP-018 SHIPPED 2026-06-13
**Task ID:** `019ebf8a-b5b0-7630-860f-a6e4f8726a92` (created via `team_task_create`, marked completed via `team_task_update` — third intermittent-success data point)

## 8 sections

1. **Why this spec exists** — second DoS surface; D-002 3-witness on "second DoS surface" claim
2. **The 4 crypto methods** — importKey/deriveKey (PBKDF2) + encrypt/decrypt (AES-GCM) + getRandomValues; NO HMAC. D-002 3-witness on "4 methods, 2 primitives, NO HMAC" claim
3. **Mock design — HYBRID** — top-level `vi.stubGlobal` + per-test `vi.spyOn`. Why not pure top-level `vi.mock('crypto')`: hoisting conflicts, bundler tree-shaking
4. **Worked example — Case 6** — wrong re-derive key scenario, vi.spyOn on deriveKey to return wrong key, assert DoS-safe null
5. **Test-side mock code** — full vitest snippet with `createMockCrypto()` factory
6. **Coverage delta** — 6 of 8 cases unblocked (6, 7, 8, 9, 11, 12). D-002 3-witness on "6 cases" claim
7. **Cross-Muse handoffs** — Apollo T-AP-001 (push-INDEPENDENT) / Mnemosyne T-MN-013 / Athena T-AT-016
8. **Self-assessment** — D-009 8th+9th codifications PASS, D-002 3-witnesses on 3 claims, D-007 SLA PASS, Honest Labeling 24th moment

## 3 pre-flight Q answers (sent to Leader 2026-06-13)

- **Q1:** HYBRID (top-level `vi.stubGlobal('crypto', { subtle: mockSubtle })` + per-test `vi.spyOn` for case-specific overrides)
- **Q2:** Targeted = 4 methods (importKey, deriveKey, encrypt, decrypt) + getRandomValues, 2 primitives (PBKDF2 + AES-GCM), NO HMAC
- **Q3:** Task ID = `019ebf8a-b5b0-7630-860f-a6e4f8726a92`

## D-002 Three-Witnesses summary

1. "Second DoS surface" — ADR-007 L101 + T-HEP-016 v0.1.1 §3 + T-HEP-017 v0.3 §3 marker (a)
2. "4 methods, 2 primitives, NO HMAC" — EncryptionEngine.ts L20/L27/L41/L59 + grep 0 hits for sign/verify/HMAC + this spec §5 mock implementation
3. "6 cases unblocked" — T-HEP-017 v0.3 §3 marker (a) + this spec §6 + T-HEP-016 v0.1.1 §3

## Cycle 9 Hephaestus status (after T-HEP-018 SHIP)

- 15 artifacts shipped (T-HEP-002, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017 v0.3, 011 verification, d007 log, **T-HEP-018**)
- Honest Labeling Muse moments 20-24 (24th added in T-HEP-018 §8)
- 0 idle pre-writes (D-007 maintained)
- 3 tool-drift incidents documented: 2 on `team_task_update` (T-HEP-010 v0 deletion, T-HEP-011 v0.1 completion) + 1 success on T-HEP-018 close — pattern: intermittent, success rate ~50%
