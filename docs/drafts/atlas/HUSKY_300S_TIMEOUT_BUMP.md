<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# Husky 300s timeout bump — contingency plan (DEFER-2026-005 STANDBY)

> **Status.** STANDBY. Do NOT apply until a pre-push actually times out at 240s.
> **Trigger.** A pre-push exits with code 124 (timeout) on any of the 4 gates. The error message will say: `timeout: the monitored command dumped core` or simply `Command timed out after 240s`.
> **Apply time.** 30 seconds (single sed, 4 lines).
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Parent spec.** [`./husky-timeout-fix.md`](./husky-timeout-fix.md) (T-ATL-006 — husky pre-push `timeout 240` upper bound, ACCEPTED 2026-06-13).
> **Sibling spec.** [`../DISASTER_RECOVERY_RUNBOOK.md`](../DISASTER_RECOVERY_RUNBOOK.md) §11 risk gap (T-ATL-008).
> **Close-out.** Closes DEFER-2026-005 from `docs/drafts/TASKBOARD.md`.

---

## §1 — When to apply (the trigger)

**Witness 1 (rule).** Apply this patch **only** when a pre-push actually times out at 240s. Symptoms:
- `git push` returns exit code 1
- Last 2-3 lines of output contain: `timeout: sending signal TERM to command 'npm'`, OR `Command failed: timeout 240 npx tsc --noEmit`
- The push hangs at one of the 4 gates (tsc / eslint / test / build) for ~240s before failing
- The pre-push runs fine on a re-invocation (timeout was cache-cold, not a real test failure)

**Witness 2 (evidence).** T-ATL-006 measurements (2026-06-13):
- Cold tsc (no .tsbuildinfo): 142s (well under 240s)
- Warm tsc (cached): 18s
- Cold eslint: 47s
- Cold test: 92s (on 8,334+ tests per Prometheus canonical)
- Cold build: 187s (full Vite build, no cache)
- **Predicted worst case after Apollo's post-push queue** (decimal.js, immer wrap on 13 stores, Sentry patch from T-ATL-009, react-virtual patches, Mermaid diagrams): ~225s on cold tsc + cold eslint. 15s of headroom. **The 240s cap is close to the wire.**

**Witness 3 (failure mode / consequence).** If we don't have this pre-write when the timeout fires, the failure mode is: (a) Apollo's push hangs at 240s, exits 1, (b) Apollo re-runs manually, the cache is now warm so the second push succeeds, (c) but Apollo has lost 5-10 min of context + may have a `--no-verify` itch. That itch is the risk — `--no-verify` is the gateway drug to skipping all 4 gates on the next push. This pre-write eliminates the debug session and the temptation.

---

## §2 — The patch (2 sed commands, 4 substitutions)

Apply with:
```bash
cd /c/Users/Tahir/Desktop/frontend\ that\ i\ want/fpa
sed -i 's/timeout 240 npx tsc --noEmit/timeout 300 npx tsc --noEmit/g' .husky/pre-push
sed -i 's/timeout 240 npx eslint src --max-warnings 0/timeout 300 npx eslint src --max-warnings 0/g' .husky/pre-push
sed -i 's/timeout 240 npm test/timeout 300 npm test/g' .husky/pre-push
sed -i 's/timeout 240 npm run build/timeout 300 npm run build/g' .husky/pre-push
```

Or, more atomic (1 sed, 4 substitutions):
```bash
sed -i 's/timeout 240/timeout 300/g' .husky/pre-push
```

**⚠️ Prefer the atomic version** — it ensures all 4 gates get bumped together. If only 1 gate gets bumped (e.g., tsc), the other 3 are still at 240s and we don't actually fix the worst-case.

The full diff (for git commit message):
```diff
diff --git a/.husky/pre-push b/.husky/pre-push
--- a/.husky/pre-push
+++ b/.husky/pre-push
@@ -1,6 +1,6 @@
 #!/bin/sh
 # husky pre-push — 4-gate chain (T-ATL-006)
-# T-ATL-011: bumped 240→300 on YYYY-MM-DD after first 240s timeout fire
+# T-ATL-011: bumped 240→300 on YYYY-MM-DD after first 240s timeout fire
 . "$(dirname -- "$0")/_/husky.sh"
 
 # Gate 1: type check
-timeout 240 npx tsc --noEmit || { echo "❌ tsc failed (timeout 240s)"; exit 1; }
+timeout 300 npx tsc --noEmit || { echo "❌ tsc failed (timeout 300s)"; exit 1; }

@@ Gate 2: lint
-timeout 240 npx eslint src --max-warnings 0 || { echo "❌ eslint failed (timeout 240s)"; exit 1; }
+timeout 300 npx eslint src --max-warnings 0 || { echo "❌ eslint failed (timeout 300s)"; exit 1; }

@@ Gate 3: test
-timeout 240 npm test || { echo "❌ tests failed (timeout 240s)"; exit 1; }
+timeout 300 npm test || { echo "❌ tests failed (timeout 300s)"; exit 1; }

@@ Gate 4: build
-timeout 240 npm run build || { echo "❌ build failed (timeout 240s)"; exit 1; }
+timeout 300 npm run build || { echo "❌ build failed (timeout 300s)"; exit 1; }
```

> **Commit message:** `chore(infra): bump husky pre-push timeout 240→300s (DEFER-2026-005 fired on YYYY-MM-DD)`

---

## §3 — Verification (post-apply)

1. **Syntax check.**
   ```bash
   bash -n .husky/pre-push
   sh -n .husky/pre-push
   ```
   Both must return 0. If `bash -n` fails: the `sed` may have broken a shebang or quoting (rare with `sed -i 's/timeout 240/timeout 300/g'` but worth checking).

2. **Shebang preserved.**
   ```bash
   head -1 .husky/pre-push
   # Expected: #!/bin/sh
   ```
   If missing: re-add with `sed -i '1i #!/bin/sh' .husky/pre-push` and `chmod +x .husky/pre-push`.

3. **Timeout values are all 300.**
   ```bash
   grep -c 'timeout 300' .husky/pre-push
   # Expected: 4
   grep -c 'timeout 240' .husky/pre-push
   # Expected: 0
   ```
   If 0/4 mismatch: re-run the atomic sed, or manually edit the gates that didn't catch.

4. **Push re-test (cold cache).**
   ```bash
   rm -rf node_modules/.cache .tsbuildinfo dist
   git push
   ```
   Should succeed without timeout.

5. **Bundle size unchanged.** The timeout doesn't affect bundle output — only the wall-clock limit. Verify `dist/` hash is identical to pre-bump (or run `npm run build` standalone and compare).

---

## §4 — Rollback plan (if 300s is too much)

If after the bump we discover the gates are now passing at >240s but we'd rather have them fail-fast (e.g., a gate is genuinely hanging instead of slow), revert:

```bash
cd /c/Users/Tahir/Desktop/frontend\ that\ i\ want/fpa
sed -i 's/timeout 300/timeout 240/g' .husky/pre-push
git add .husky/pre-push
git commit -m "chore(infra): rollback husky pre-push timeout 300→240s (false alarm)"
git push
```

> **When to consider rollback.** If the bump "fixes" the timeout but pushes consistently take >5 min, the dev experience degrades. 5 min is the upper UX bound for a pre-push. If a gate genuinely needs >5 min cold, the right fix is to make the gate lazy (e.g., parallel tsc + eslint) or split the test suite.

---

## §5 — Forward-looking: when to consider 360s

**Witness (evidence).** Headroom math at the 300s mark:
- Predicted cold total post-Apollo-push: ~270s (tsc 142s + eslint 47s + test 130s [more tests] + build 215s [more chunks], but tests run in parallel with eslint in npm-run-all mode if configured; without parallelism, sequential = 534s)
- **CRITICAL: the 4 gates in the current pre-push are SEQUENTIAL, not parallel.** Total wall-clock = sum of all 4 gates' cold times. At current 240s cap with 4 gates, ANY one gate taking >240s fails the whole push. At 300s, the cap is one gate at 300s; all 4 sequential gates = 534s budget headroom.

If after the bump we see pushes consistently approaching 300s, the right next move is **not** a 360s bump. It's to **parallelize the 4 gates** with `npm-run-all -p tsc lint test build` (the `p` flag is "parallel"). After parallelization, the 4 gates run concurrently and the wall-clock is bounded by the slowest single gate (~270s), not the sum (~534s). A 360s bump without parallelization is technical debt.

**Decision tree:**
1. First 240s timeout fires → apply this patch (240→300s). 30 sec.
2. First 300s timeout fires → parallelize the 4 gates. 5 min.
3. If a single gate (probably build) consistently takes >300s cold → cache that gate (e.g., `vite build` with `--mode=production` cached via Turborepo or Nx). 1 hour+ refactor.

This pre-write is step 1. Steps 2 and 3 are deferred until needed.

---

## §6 — Cross-links

- **Parent.** [`./husky-timeout-fix.md`](./husky-timeout-fix.md) (T-ATL-006, ACCEPTED 2026-06-13) — original 240s upper bound + spec deviation flagging
- **Sibling.** [`./DISASTER_RECOVERY_RUNBOOK.md`](./DISASTER_RECOVERY_RUNBOOK.md) §11 (T-ATL-008, ACCEPTED 2026-06-13) — DEFER-2026-005 originates here as risk gap #N
- **Sibling.** [`./SENTRY_SDK_INSTALL_PATCH.md`](./SENTRY_SDK_INSTALL_PATCH.md) (T-ATL-009, ACCEPTED 2026-06-13) — adds ~1.5s to tsc gate via `@sentry/opentelemetry-node` import resolution
- **Sibling.** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) IC-5 (T-ATL-003) — "push timeout" is the original incident this whole chain prevents
- **TASKBOARD.** `docs/drafts/TASKBOARD.md` entry **DEFER-2026-005** — STANDBY, closes when this patch is applied (or when 240s cap is confirmed safe through Q3 2026)
- **Sibling runbook.** `docs/drafts/atlas/dr-templates/` (T-ATL-010, ACCEPTED 2026-06-13) — if the timeout is part of a SEV-1 incident, these comms templates fire
- **CI sibling.** `docs/drafts/atlas/ci/README.md` (T-ATL-005) — same 4 gates in CI use a 360s GitHub Actions default (no per-gate timeout). If local 300s starts failing, check CI is not ALSO failing (signals a real test failure, not a timeout)

---

**End of contingency plan. 6 sections, 1 sed command, 30-sec apply time. Stays in STANDBY until first 240s timeout. — Atlas 2026-06-13 08:05 IST**
