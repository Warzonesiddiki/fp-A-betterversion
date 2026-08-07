# FinPlan Pro v1.0 Release Checklist

## Pre-Release Gates (ALL must pass)

### Build & Quality

- [x] `npx tsc --noEmit` — Zero TypeScript errors
- [x] `npm run lint` — Zero errors, zero warnings
- [x] `npm run build` — Production build succeeds
- [x] `node scripts/bundle-check.js` — Main chunk ≤150KB gzip
- [x] `npm run build && npm run preview` — Preview server works

### Testing

- [ ] Full suite green. STATUS 2026-07-29: `vitest run` now TERMINATES (894/894 files, 10,589 tests, 1001s) after the N-0001 deadlock fix, but exits non-zero — ~20 failures remain (N-0012). The previous "[x] 3,070+ tests passing" claim was false: the suite could not complete.
- [x] A11y suite runs and passes: `npm run test:a11y` exit 0, 441 passed / 2 skipped, enforced in CI (N-0007)
- [x] Engine tests: 100+ files, 1000+ tests passing
- [x] Store tests: 40+ files, 133+ tests passing
- [x] Page tests: 100+ files passing
- [ ] Full E2E test run with Playwright (requires browser)
- [ ] Performance benchmark suite (requires dedicated run)

### Security

- [x] Zero `@ts-nocheck` directives
- [x] Security utilities implemented (CSRF, rate limiting, PIIRedactor)
- [x] Zero-retention policy enforcer
- [x] Data classification and redaction
- [x] CSP: script-src uses a hash, no unsafe-eval. `style-src 'unsafe-inline'` retained and documented.
- [x] Dependency vulnerability scan: `npm audit --omit=dev` exit 0, 0 production vulnerabilities; blocking CI job added (N-0004)

### Accessibility

- [x] WCAG 2.2 AA a11y tests passing
- [x] Keyboard navigation tests passing
- [x] Focus management tests passing
- [x] Live region tests passing
- [ ] Full axe-core audit on all pages
- [ ] Screen reader verification (manual)

### Desktop (Tauri)

- [x] Tauri config complete (window, CSP, NSIS, updater)
- [x] SQL migrations (initial + cube schema)
- [x] 9 Tauri plugins configured
- [ ] `npm run tauri:build` — Desktop build succeeds (requires Rust toolchain)
- [ ] SQLite persistence end-to-end test
- [ ] Auto-update verification
- [ ] NSIS installer build and test

### Documentation

- [x] README.md comprehensive
- [x] CHANGELOG.md created
- [x] ARCHITECTURE.md exists
- [x] CONTRIBUTING.md exists
- [x] SECURITY.md exists
- [ ] Clean up 145 codif/endorsement process docs
- [ ] Final user guide review

## Release Steps

1. Run full test suite: `npm test`
2. Run E2E tests: `npm run test:e2e`
3. Build production: `npm run build`
4. Verify bundle: `node scripts/bundle-check.js`
5. Build desktop: `npm run tauri:build`
6. Tag release: `git tag v1.0.0`
7. Push tag: `git push origin v1.0.0`
8. Create GitHub release with CHANGELOG

## MISSION C Status (2026-08-07)

- [x] Period-close client UI shipped (F-01): `/periods/close` — fiscal-period grid, close checklist, state machine, money-exact pre-close validation, chained audit panel, post-close report export; 35 new tests (store/page/money/a11y)
- [x] Period-close RBAC: `period:read` (all), `period:close` (Admin + FP&A_Manager), `period:reopen` (Admin) — matrix + negative-auth tests green
- [x] Zero-mock-data completion (F-04): 23 synthetic arrays → 7 wired to real stores/engines, 16 labeled demo defaults; `scripts/mock-data-audit.mjs` enforces the disposition list (exit 1 on violations)
- [ ] Full E2E test run with Playwright — STILL UNVERIFIED_BLOCKED (browser CDN egress blocked in sandbox; box stays unchecked, not faked)
