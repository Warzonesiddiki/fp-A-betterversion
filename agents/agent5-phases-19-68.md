# Agent 5 (Enterprise Depth): Remaining Tasks

## YOUR FILES ONLY
- `src/workers/` — VERIFY (4 web workers already created)
- `tests/smoke.spec.ts` — VERIFY (10 test scenarios already created)
- `src/components/ui/ErrorBoundary.tsx` — VERIFY (already enhanced)
- `reports/agent5-complete.md` — UPDATE with final metrics

## DO NOT TOUCH (unless broken by other agents)
If A1-A4 break the build, fix it. Otherwise:

---

## Phase 68: Final Build & Desktop Verification (2 hr)

### 1. Verify ALL your previous work is intact
- [ ] `src/workers/formulaWorker.ts` — exists with proper onmessage handler
- [ ] `src/workers/consolidationWorker.ts` — exists
- [ ] `src/workers/exportWorker.ts` — exists
- [ ] `src/workers/scenarioWorker.ts` — exists
- [ ] `tests/smoke.spec.ts` — has 10 test scenarios covering all major pages
- [ ] `src/components/ui/ErrorBoundary.tsx` — has error ID, copy details, stack trace
- [ ] `src/utils/retry.ts` — exists with withRetry + createWorker

### 2. Run build and check for errors
```
npm run build
```
Must pass with 0 errors. If blocked by other agents' work, report which files are broken.

### 3. Verify no @ts-nocheck remains
```
Select-String -SimpleMatch "@ts-nocheck" src/pages/**/*.tsx
```
Must return 0 results.

### 4. Verify bundle size
Check `dist/` output:
- Total JS < 2MB gzip
- Main chunk < 500KB gzip

### 5. Check for any broken imports
```
Select-String "from '@/'" src/pages/**/*.tsx | Where-Object { $_ -notmatch '@ts-nocheck' }
```

### 6. If all passes — update completion report
Update `reports/agent5-complete.md` with:
- Build size
- Total pages written
- Workers created
- Tests written
- Any issues found during final verification

### 7. If build fails due to A1-A4 changes:
Don't fix their code. Report specifically:
- Which files have errors
- Which agent caused them
- What the fix should be

## Quality Gate
`npm run build` — 0 errors. All 74 pages render. Workers load without errors. Tests defined.
Update `reports/agent5-complete.md`.
