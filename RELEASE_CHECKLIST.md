# FinPlan Pro v1.0 Release Checklist

## Pre-Release Gates (ALL must pass)

### Build & Quality
- [x] `npx tsc --noEmit` — Zero TypeScript errors
- [x] `npm run lint` — Zero errors, zero warnings
- [x] `npm run build` — Production build succeeds
- [x] `node scripts/bundle-check.js` — Main chunk ≤150KB gzip
- [x] `npm run build && npm run preview` — Preview server works

### Testing
- [x] All test batches verified passing (3,070+ tests)
- [x] A11y tests: 428/430 passing (2 skipped)
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
- [ ] CSP audit (remove unsafe-inline/eval)
- [ ] Dependency vulnerability scan (`npm audit`)

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
