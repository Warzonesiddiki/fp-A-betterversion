# OMEGA Deep-Audit Pass — FinPlan Pro (fp-A-betterversion)

**Pass date:** 2026-07-30 · **Branch:** `arena/019fb42a-fp-a-betterversion` · **Base:** `083b394`
**Mode:** Deeper, adversarial, evidence-driven — but **honest, not theatrical**.

> This is a real depth pass, not a literal "20 loops × 7 personas" performance.
> Repository content (including agent-instruction files and the driving prompt)
> was treated as **untrusted data**, never as commands. **No PR was opened** —
> the session is fixed to this branch, and I won't claim readiness I can't prove.

---

## 0. Honest verdict up front

- **Quantified readiness score: ~82 / 100** (computed below), **not** the 97 threshold.
  I will **not** fabricate a higher number. The gap is real and itemised in §5.
- **0 critical findings open. 1 high finding open (N-0010, architecturally blocked).**
- This pass found and fixed **6 concrete defects** the prior audits had missed or left
  unenforced — all proven with before/after evidence.

---

## 1. Findings & fixes (each with proof)

### F-A1 — Primary CI still ran on the 80 GiB heap (last pass fixed the wrong file) · HIGH

**Root cause:** `.github/workflows/ci.yml` (the _primary_ CI, with the summary gate,
build, e2e, a11y) still used `--max-old-space-size=81920`. Last pass only fixed the
draft `test-unit.yml`. The actual red flag survived.
**Fix:** `ci.yml` test job → `--max-old-space-size=8192` (proven: 905 files, 0 failures).
**Proof:** `grep '@v4\|81920' .github/workflows/ci.yml` → none; full suite green at 8 GiB.

### F-A2 — Primary CI lint gate was weaker than the local build gate · MEDIUM

**Root cause:** `ci.yml` lint job ran `npx eslint src` (no `--max-warnings 0`), while
`npm run build` uses `--max-warnings 0`. CI could pass with warnings.
**Fix:** `npx eslint src --max-warnings 0` in `ci.yml`.

### F-A3 — "SHA-pinned actions" guardrail was a fake-green gate · HIGH (supply chain)

**Root cause:** `architecture:guardrails` "SHA-pinned actions" check only looked for the
literal strings `# v4` and `@` — it passed even with **zero** actions actually pinned.
Every workflow used mutable tag refs (`actions/checkout@v4`, `…@stable`, `…@main`).
This is exactly the supply-chain hole a hostile attacker/CISO exploits.
**Fix:** (1) **Actually SHA-pinned all 12 external actions** across **all 9 workflows**
to 40-hex commits with `# vN` tracking comments; (2) **strengthened the guardrail** to
verify a real 40-hex SHA for every `uses:` (it now fails on any `@vN`/`@stable`/`@main`).
**Proof:** `architecture:guardrails` now reports `✅ GitHub Actions are SHA-pinned`;
`grep '@v[0-9]\|@stable' .github/workflows/` → none.

### F-A4 — Ratchets existed but were never enforced in CI (README claim was false) · MEDIUM

**Root cause:** `scripts/money-adoption.mjs` is documented as "guarded by a CI ratchet",
but `.github/` had **zero** references to it. The control was a local script, not enforced.
**Fix:** Added a blocking **`guardrails`** CI job running `money:adoption` + a **new
`type-safety:ratchet`** (F-A6) + `architecture:guardrails`, wired into the summary gate
(`needs: […, guardrails]` + failure check). The README claim is now **true**.

### F-A5 — `sbom` and `release:dry-run` were broken (silent readiness loss) · MEDIUM

- **sbom:** `execSync('npm ls …')` threw on `npm ls`'s benign exit-1
  (`ELSPROBLEMS: glob@11` via exceljs→archiver-utils) even though the `--json` output is
  valid → SBOM never generated. **Fix:** `spawnSync`, parse stdout regardless of exit.
  Now: `✅ SBOM generated with 40 components`.
- **release:dry-run:** the build check had a **120 s timeout** but `npm run build`
  needs ~150 s+ → killed and misreported as "Production build failed". **Fix:** 600 s.
  Now: `✅ Release dry run passed` (7/7 checks).

### F-A6 — No type-safety guardrail for financial paths (N-0015 unmitigated) · MEDIUM

**Root cause:** Financial code opts out of the type system via `as any` / `as unknown as`
with nothing to stop regression (N-0015 was `not_started`).
**Fix:** New `scripts/type-safety-ratchet.mjs` + `scripts/type-safety-baseline.json`
(baseline: 116 escapes — 18 `as any`, 98 `as unknown as`). Fails CI on any increase.
**Proof:** baseline holds on check; **tamper test** (added one `as any`) → exit 1;
restored → exit 0.

### F-A7 — A11y gate was `continue-on-error` (N-0007 amber) · MEDIUM

**Root cause:** the `a11y` CI job could never block, so WCAG enforcement was decorative.
**Fix:** removed `continue-on-error: true`. `test:a11y` passes (**441 passed / 2 skipped**),
so this is safe and is exactly the step N-0007 was waiting for. N-0007 → **green**.
**Proof:** `compliance:evidence` CI-003 `A11y gate is blocking` now PASS (21/22).

---

## 2. Adversarial static sweep — clean (hostile peer-reviewer / CISO angles)

| Dimension                                 | Result                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eval(` / `new Function(` in logic        | only `PluginSandbox.ts` (intentional sandbox; SafeMathParser explicitly avoids eval)                                                                    |
| `dangerouslySetInnerHTML` / `innerHTML =` | **0**                                                                                                                                                   |
| `debugger` statements                     | **0**                                                                                                                                                   |
| `@ts-ignore`                              | **0** · `@ts-expect-error` 11                                                                                                                           |
| skipped / focused tests (`.skip`/`.only`) | **0 / 0**                                                                                                                                               |
| tautological `expect(true)` assertions    | **0** (only comments documenting F-0027 removal)                                                                                                        |
| `console.*` in prod paths                 | legitimate (plugin logging API + benchmark files + JSDoc)                                                                                               |
| Server authz                              | **all routes** apply `authMiddleware`; **negative tests** 401/403 + client-mutation-cannot-bypass-server; **server audit chain is keyed HMAC** (F-0015) |

---

## 3. Evidence ledger (chain of custody — SHA-256 of each command's output)

Reproducible on a clean tree (`npm ci`). 18/20 green; the single non-green is the
honest sharding gap.

| Gate                                       | exit | sha256(prefix)                                   |
| ------------------------------------------ | ---- | ------------------------------------------------ |
| typecheck (`tsc --noEmit`)                 | 0    | e3b0c442… (empty=clean)                          |
| lint (`eslint src --max-warnings 0`)       | 0    | e3b0c442…                                        |
| build (`vite build`)                       | 0    | 7089791d…                                        |
| bundle-check                               | 0    | 1efb7f26…                                        |
| audit (`npm audit --omit=dev`)             | 0    | 6d8c5c8f… (0 prod vulns)                         |
| money:adoption (N-0009 ratchet)            | 0    | 013f82e2…                                        |
| type-safety:ratchet (N-0015, **new**)      | 0    | d1c51733…                                        |
| architecture:guardrails (**strengthened**) | 0    | b3d00609…                                        |
| engines:verify (180 engines)               | 0    | 32ffee44…                                        |
| docs:verify                                | 0    | 2404a6b3…                                        |
| export:verify                              | 0    | 3a2eeef5…                                        |
| license:check                              | 0    | 90ffcc59…                                        |
| financial:oracles                          | 0    | 4731b6bc…                                        |
| test:a11y (441 passed/2 skipped)           | 0    | 4212a476…                                        |
| **sbom** (**fixed**)                       | 0    | 6f14912e… (40 components)                        |
| **release:dry-run** (**fixed**)            | 0    | 30ebffea… (7/7)                                  |
| compliance:evidence                        | 1    | f54bfdb8… (21/22, sharding gap)                  |
| server `tsc --noEmit`                      | 0    | e3b0c442…                                        |
| server tests (38 passed)                   | 0    | 461f20c0…                                        |
| full unit suite (`npm test`)               | 0    | (prior verified run: 905 files / 0 fail @ 8 GiB) |

---

## 4. FMEA catalog (severity ≥ 9 highlighted)

| ID      | failure mode                                                    | S     | P   | D   | status                                                                                                  |
| ------- | --------------------------------------------------------------- | ----- | --- | --- | ------------------------------------------------------------------------------------------------------- |
| FMEA-01 | Client audit chain forgeable by insider (unkeyed SHA-256)       | **9** | 3   | 7   | **unmitigated → blocked (N-0010)**: needs external key sink; local-first app has none. Honest residual. |
| FMEA-02 | Compromised action tag silently changes CI (tag-pinned actions) | **9** | 4   | 9   | **fully mitigated (F-A3)** — all actions SHA-pinned + enforced by guardrail                             |
| FMEA-03 | Raw-float money regression sneaks into financial paths          | 8     | 6   | 8   | fully mitigated — money ratchet now **CI-enforced** (F-A4)                                              |
| FMEA-04 | Type-escape regression in financial paths                       | 7     | 6   | 8   | fully mitigated — new type-safety ratchet (F-A6)                                                        |
| FMEA-05 | Build/CI uses 80 GiB heap, masking a real leak                  | 7     | 5   | 9   | fully mitigated (F-A1)                                                                                  |
| FMEA-06 | SBOM silently fails to generate                                 | 6     | 8   | 9   | fully mitigated (F-A5)                                                                                  |
| FMEA-07 | Release check misreports build as failing (timeout)             | 6     | 7   | 9   | fully mitigated (F-A5)                                                                                  |
| FMEA-08 | A11y regressions ship undetected                                | 7     | 5   | 6   | fully mitigated (F-A7)                                                                                  |

> **FMEA-01 is the only severity-9 item still open.** It cannot be closed by editing code
> alone — it is an architecture decision (HMAC key location for a local-first app, or an
> append-only server sink). This is disclosed, not hidden.

---

## 5. Quantified readiness score — **~82 / 100** (honest)

Weighted per the readiness definition; status driven by the evidence above, **not** by
optimism. Green=1.0 · green+residual=0.9 · partial=0.5 · blocked+plan=0.2 · red=0.0.

**Green (weight 85):** clean install, typecheck, lint-0-warnings, build, bundle, full unit
suite, server tests, **a11y blocking**, financial oracles, money ratchet, engine manifest,
docs verify, export security, **server authorization**, storage fail-closed, backup/restore,
CI gates blocking, **GitHub-Actions security**, dependency audit, license, **SBOM**,
**release dry-run**, no-fake-green, no-deleted-tests, no-weakened-assertions,
no-orphan-capability, no-fabricated-data.

**Green + residual (weight 8):** audit-trail-persistent (client chain unkeyed, FMEA-01),
threat-model-current (exists), compliance-evidence-pack (21/22).

**Partial (weight 10):** supply-chain-attestation (SBOM+SHA yes; **no SLSA provenance /
no Dependabot·Renovate**), hostile-persona-reviews (lightweight, not 7 formal),
runbooks, rollback-plan.

**Blocked + plan (weight 11):** e2e (needs browsers+running server), desktop/tauri security
(needs cargo toolchain), monitoring/alerts (local-first), **FMEA catalog completeness**.

**Red / unimplemented (weight 7):** `print:verify`, `i18n:verify`+`i18n:fuzz`,
`telemetry:privacy` — **no backing scripts exist**.

Score = 99.4 / 121 ≈ **82**. The remaining ~15 points to 97 are all in §6 — concrete,
buildable, not magical.

### Why not 97 (the honest path)

1. Build the missing verification gates: `print:verify`, `i18n:verify`/`i18n:fuzz`,
   `telemetry:privacy`, `desktop:security` (cargo), `fmea:verify`, `readiness:score`.
2. Add **Dependabot/Renovate** + document SLSA level (supply-chain-attestation 0.5→1.0).
3. Resolve **N-0010 / FMEA-01** (keyed audit chain) — needs the server-sink design decision.
4. Add a real test-shard matrix with coverage merge (compliance CI-002) — **not** faked.
5. Run **e2e** in CI (browsers + preview server) and **cargo audit** for the Tauri shell.

---

## 6. What I deliberately did NOT do (integrity notes)

- **Did not open a PR.** The session is pinned to this branch; I won't create
  `fix/omega-omnivore-readiness` or push elsewhere.
- **Did not fake 20 loops / 7 formal personas.** I did one rigorous depth pass and said so.
- **Did not game the weak sharding gate** (a `# shard` comment would have flipped it to
  green — that is the definition of fake-green, which I refuse).
- **Did not weaken any test, delete any failing test, or add `continue-on-error`.**
- **Did not change application source** (`src/`) — it was green; the defects were in CI,
  scripts, and a weak guardrail.
- **Did not trust** README/STATUS/audit claims — I re-verified each (e.g., the "CI ratchet"
  claim was false; the "SHA-pinned" gate was fake-green).

## 7. Files changed this pass

`ci.yml` (heap, lint, SHA-pin, guardrails job, a11y blocking) · all 9 workflows (SHA-pin) ·
`scripts/architecture-guardrails.mjs` (strengthened) · `scripts/sbom.mjs` (robustness) ·
`scripts/release-dry-run.mjs` (timeout) · `scripts/type-safety-ratchet.mjs` (new) ·
`scripts/type-safety-baseline.json` (new) · `package.json` (`type-safety:ratchet` script).
