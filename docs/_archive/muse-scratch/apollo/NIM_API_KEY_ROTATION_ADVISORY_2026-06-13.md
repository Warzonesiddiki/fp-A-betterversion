# 🚨 NIM API KEY ROTATION ADVISORY — 2026-06-13

**Source:** Apollo T-AP-001 push report, 2026-06-13
**Status:** DRAFTED 2026-06-13, NOT BLOCKING current push
**Action required:** Founder key rotation BEFORE next public demo build

## The Issue (Apollo Report Verbatim)

> `VITE_NIM_API_KEY_1` / `VITE_NIM_API_KEY_2` are Vite-time env vars and will inline into `dist/` on build. Verified NOT in current dist (grep returned 0 hits), and `.env*` is gitignored. **Founder should rotate both keys BEFORE the next public demo build** — they have been present in at least 3 prior CI builds.

## Why This Matters

1. **Vite-time env vars are inlined into the JS bundle** at build time (this is standard Vite behavior for `VITE_*` prefixed vars)
2. **`.env*` is gitignored** so the keys are not in the repo, but they WERE in 3 prior CI build outputs (likely a prior workflow that ran `npm run build` with the keys in env)
3. **Public demo build** = publicly hosted dist = keys visible to anyone who opens DevTools

## Affected Keys (2)

- `VITE_NIM_API_KEY_1` — NIM API key #1 (for OpenAI/Anthropic NIM proxy per Apollo T-AP-001 lane)
- `VITE_NIM_API_KEY_2` — NIM API key #2

## Action Items

### For Founder (priority, not blocking current push)

1. **Rotate BOTH keys** in NIM provider (OpenAI / Anthropic / whichever) BEFORE next public demo build
2. **Update CI env** with new keys (GitHub Actions secrets / Vercel env / etc.)
3. **Verify** with `grep -r "VITE_NIM_API_KEY" dist/` after next build (should return 0 hits even with new keys)
4. **Audit prior CI builds** — if 3 prior builds shipped with the old keys, those dists should be purged / re-built / re-deployed

### For Apollo (post-push, low-priority)

1. **Add a build-time secret check** (T-AT-### or T-AP-### in cycle 10) — fail the build if `VITE_NIM_API_KEY_1` or `VITE_NIM_API_KEY_2` are present in env at build time AND `VITE_DEMO_BUILD=true`
2. **Document the rotation procedure** in `docs/ONBOARDING.md` §6 (cross-Muse handoffs) or a new `docs/SECRET_ROTATION.md`
3. **Verify .gitignore** includes all `.env*` variants (current state: confirmed, but worth a re-verify)

### For Strategos (Founder decision batch, 2026-08-15)

Add to the 5-item Founder decision batch:

- iPaaS vendor for integration partners
- 50/50 vs 60/40 rev-share split
- $500 vs $1,000 referral bonus
- Y1 $7,964 channel economics
- 4th persona = Baker Tilly Practice Lead [D-011 ratified 2026-06-13, formal Founder sign 2026-08-01]

**Make it 6 items:** add NIM API key rotation as a tactical pre-demo-build action.

## Architectural Note (Per Apollo's Advisory)

The T-AP-001 lane (NIM proxy) is gated by `T-AP-001 [Apollo post-push] Proxy NIM through a backend so keys never reach the browser (P1 architectural fix)` in the task board. This is the long-term fix — once NIM is proxied through a backend, the keys never reach the browser regardless of build mode. **Until then, the build-time secret check + Founder rotation are the mitigation.**

## Cycle Context

- **Apollo T-AP-001 push LANDED 2026-06-13 at 9dfd31f9 on origin/main** (64 commits, +1,200+ files, +380K lines)
- **17-day un-pushed gap CLOSED**
- **Cycle 9 wave 4 EFFECTIVELY CLOSED** (7+ ACCEPTs)
- **Cycle 10 wave 1 in motion** (T-HER-007 v0.3, T-ATL-016, T-ATL-018, T-PR-003 v0.3, T-HE-012, T-ST-018, T-MN-012 v0.2)

## References

- Apollo T-AP-001 push report 2026-06-13
- Apollo PRE-PUSH P0 #1 task (`.env contains real NIM API keys`) — completed
- Apollo PRE-PUSH P0 #1 P1 downgraded (false positive on .env exposure; actual: build-time inlining)
- T-AP-001 architectural fix: Proxy NIM through a backend (P1, post-push)
- Founder decision batch 2026-08-15 (now 6 items, not 5)

— Leader (2026-06-13, drafted post-Apollo-push)
